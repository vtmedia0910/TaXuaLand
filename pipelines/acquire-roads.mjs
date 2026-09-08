import { readFile, writeFile, stat, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("..", import.meta.url)),
  path = resolve(root, "work/gis/raw/osm-roads-2026-001.json"),
  lockPath = resolve(root, "pipelines/roads.lock.json");
const query =
  '[out:json][timeout:40];(way["highway"](21.20,104.45,21.35,104.62);node["place"]["name"](21.05,104.30,21.55,104.80););out geom;';
const endpoint = "https://overpass-api.de/api/interpreter";
await mkdir(resolve(root, "work/gis/raw"), { recursive: true });
if (!(await stat(path).catch(() => null))) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "TaXuaLand-Phase0-pipeline/1.0 (one-time AOI extract)",
    },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok)
    throw Error(`Overpass ${response.status}; no automatic retries`);
  const text = await response.text();
  if (Buffer.byteLength(text) > 16 * 1024 * 1024)
    throw Error("Extract too large");
  const data = JSON.parse(text);
  if (data.remark || !data.elements?.length || !data.osm3s?.timestamp_osm_base)
    throw Error("Incomplete OSM response");
  await writeFile(path, text, { flag: "wx" });
}
const bytes = await readFile(path),
  sha256 = createHash("sha256").update(bytes).digest("hex"),
  data = JSON.parse(bytes);
const lock = {
  filename: "osm-roads-2026-001.json",
  url: endpoint,
  query,
  sha256,
  bytes: bytes.length,
  sourceTimestamp: data.osm3s.timestamp_osm_base,
  license: "https://opendatacommons.org/licenses/odbl/1-0/",
  attribution: "© OpenStreetMap contributors",
};
try {
  const old = JSON.parse(await readFile(lockPath, "utf8"));
  if (old.sha256 !== sha256) throw Error("Pinned OSM source mismatch");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + "\n", {
    flag: "wx",
  });
}
console.log(
  JSON.stringify({
    sha256,
    bytes: bytes.length,
    ways: data.elements.filter((e) => e.type === "way").length,
    referencePlaces: data.elements
      .filter((e) => e.type === "node")
      .map((e) => ({
        id: e.id,
        name: e.tags.name,
        longitude: e.lon,
        latitude: e.lat,
      })),
  }),
);
