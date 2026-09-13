import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(await readFile(resolve(repository, "pipelines/imagery.lock.json"), "utf8"));
const destination = resolve(repository, "work/gis/raw", lock.itemId);

const digest = async (path) => {
  const hash = createHash("sha256");
  await pipeline(createReadStream(path), hash);
  return hash.digest("hex");
};

async function verify(path, expected) {
  const info = await stat(path);
  if (!info.isFile() || info.size !== expected.bytes || (await digest(path)) !== expected.sha256)
    throw Error(`Source checksum mismatch: ${expected.filename}`);
}

async function acquire(asset) {
  const target = resolve(destination, asset.filename);
  try {
    await access(target);
    await verify(target, asset);
    return;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const partial = `${target}.partial`;
  if (asset.bytes > 32 * 1024 * 1024) {
    const file = await open(partial, "w");
    try {
      await file.truncate(asset.bytes);
      await file.close();
      const chunks = 4, chunkSize = Math.ceil(asset.bytes / chunks);
      for (let index = 0; index < chunks; index++) {
        const start = index * chunkSize, end = Math.min(asset.bytes, start + chunkSize) - 1;
        if (start > end) break;
        for (let attempt = 1; ; attempt++) {
          try {
            const response = await fetch(asset.url, { redirect: "error", headers: { Range: `bytes=${start}-${end}` } });
            if (response.status !== 206 || !response.body || response.headers.get("content-range") !== `bytes ${start}-${end}/${asset.bytes}` || response.headers.get("content-type")?.split(";", 1)[0] !== "image/tiff" || Number(response.headers.get("content-length")) !== end - start + 1)
              throw Error(`Source range changed: ${asset.filename}`);
            await pipeline(response.body, createWriteStream(partial, { flags: "r+", start }));
            break;
          } catch (error) {
            if (attempt === 3) throw error;
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }
        }
      }
    } catch (error) {
      await file.close().catch(() => {});
      await unlink(partial).catch(() => {});
      throw error;
    }
    try {
      await verify(partial, asset);
      await rename(partial, target);
    } catch (error) {
      await unlink(partial).catch(() => {});
      throw error;
    }
    return;
  }
  const response = await fetch(asset.url, { redirect: "error" });
  if (!response.ok || !response.body) throw Error(`Source HTTP ${response.status}: ${asset.filename}`);
  const declared = Number(response.headers.get("content-length"));
  if (!Number.isSafeInteger(declared) || declared !== asset.bytes) throw Error(`Source size changed: ${asset.filename}`);
  const mediaType = response.headers.get("content-type")?.split(";", 1)[0];
  if ((asset.filename.endsWith(".tif") && mediaType !== "image/tiff") || (asset.filename.endsWith(".json") && mediaType !== "application/geo+json"))
    throw Error(`Source MIME changed: ${asset.filename}`);
  await pipeline(response.body, createWriteStream(partial, { flags: "wx" }));
  try {
    await verify(partial, asset);
    await rename(partial, target);
  } catch (error) {
    await unlink(partial).catch(() => {});
    throw error;
  }
}

await mkdir(destination, { recursive: true });
for (const asset of Object.values(lock.assets)) await acquire(asset);

const item = JSON.parse(await readFile(resolve(destination, lock.assets.item.filename), "utf8"));
const visual = item.assets?.visual, scl = item.assets?.scl;
if (
  item.id !== lock.itemId || item.collection !== lock.collection ||
  item.properties?.["s2:product_uri"] !== lock.productId ||
  item.properties?.datetime !== lock.sensingAt || item.properties?.["s2:generation_time"] !== lock.generatedAt || item.properties?.["proj:epsg"] !== Number(lock.sourceCrs.slice(5)) ||
  item.properties?.["eo:cloud_cover"] !== lock.sceneCloudPercent ||
  visual?.href !== lock.assets.visual.url || visual?.["file:size"] !== lock.assets.visual.bytes ||
  visual?.["file:checksum"] !== lock.assets.visual.upstreamMultihash || JSON.stringify(visual?.["proj:shape"]) !== JSON.stringify(lock.assets.visual.shape) || JSON.stringify(visual?.["proj:transform"]) !== JSON.stringify(lock.assets.visual.transform) ||
  scl?.href !== lock.assets.scl.url || scl?.["file:size"] !== lock.assets.scl.bytes ||
  scl?.["file:checksum"] !== lock.assets.scl.upstreamMultihash || JSON.stringify(scl?.["proj:shape"]) !== JSON.stringify(lock.assets.scl.shape) || JSON.stringify(scl?.["proj:transform"]) !== JSON.stringify(lock.assets.scl.transform)
) throw Error("Exact Sentinel Item identity changed");

const assets = Object.fromEntries(await Promise.all(Object.entries(lock.assets).map(async ([name, asset]) => [name, { bytes: asset.bytes, sha256: await digest(resolve(destination, asset.filename)) }])));
const recordPath = resolve(destination, "acquisition.json");
try {
  await access(recordPath);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  await writeFile(recordPath, `${JSON.stringify({ schema: "LAND_SOURCE_ACQUISITION_V1", itemId: lock.itemId, acquiredAt: new Date().toISOString(), assets }, null, 2)}\n`, { flag: "wx" });
}
console.log(JSON.stringify({ itemId: lock.itemId, destination, assets }, null, 2));
