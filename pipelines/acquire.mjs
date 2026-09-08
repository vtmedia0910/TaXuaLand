import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, stat, rename } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url));
const raw = resolve(root, "work/gis/raw");
const sources = {
  dem: [
    "Copernicus_DSM_COG_10_N21_00_E104_00_DEM.tif",
    "https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N21_00_E104_00_DEM/Copernicus_DSM_COG_10_N21_00_E104_00_DEM.tif",
  ],
  geoid: ["us_nga_egm08_25.tif", "https://cdn.proj.org/us_nga_egm08_25.tif"],
};
await mkdir(raw, { recursive: true });
const lockPath = resolve(root, "pipelines/sources.lock.json");
let lock = {};
try {
  lock = JSON.parse(await readFile(lockPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
for (const [key, [filename, url]] of Object.entries(sources)) {
  const path = resolve(raw, filename);
  if (!(await stat(path).catch(() => null))) {
    const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
    if (!response.ok || !response.body)
      throw Error(`Acquisition failed: ${key} ${response.status}`);
    let size = 0;
    const limit = new Transform({
      transform(chunk, encoding, callback) {
        size += chunk.length;
        callback(
          size > 160 * 1024 * 1024 ? Error("Source size limit") : null,
          chunk,
        );
      },
    });
    const temporary = path + ".download";
    await pipeline(
      Readable.fromWeb(response.body),
      limit,
      createWriteStream(temporary, { flags: "wx" }),
    );
    await rename(temporary, path);
  }
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  const sha256 = hash.digest("hex"),
    bytes = (await stat(path)).size;
  if (lock[key] && (lock[key].sha256 !== sha256 || lock[key].url !== url))
    throw Error(`Pinned source changed: ${key}`);
  lock[key] ??= {
    filename,
    url,
    sha256,
    bytes,
    downloadedAt: new Date().toISOString(),
  };
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n");
  console.log(JSON.stringify({ source: key, sha256, bytes }));
}
