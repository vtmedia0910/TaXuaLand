import * as Cesium from "cesium";
import { TerrainManifest } from "../../../../packages/spatial-types/src/terrain";

const digest = async (bytes: ArrayBuffer) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
async function boundedBytes(
  response: Response,
  maximum: number,
): Promise<ArrayBuffer> {
  if (
    !response.body ||
    Number(response.headers.get("content-length") ?? 0) > maximum
  )
    throw Error("TERRAIN_RESPONSE_SIZE");
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > maximum) {
        await reader.cancel();
        throw Error("TERRAIN_RESPONSE_SIZE");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes.buffer;
}
/** Bounded, finite-resolution DEM provider. No terrain is invented outside coverage. */
export async function loadLandTerrain(
  url: string,
  expectedHash: string,
  signal: AbortSignal,
): Promise<{ provider: Cesium.TerrainProvider; manifest: TerrainManifest }> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw Error("TERRAIN_MANIFEST_HTTP");
  const bytes = await boundedBytes(response, 1024 * 1024);
  if (bytes.byteLength > 1024 * 1024 || (await digest(bytes)) !== expectedHash)
    throw Error("TERRAIN_MANIFEST_INTEGRITY");
  const manifest = TerrainManifest.parse(
    JSON.parse(new TextDecoder().decode(bytes)),
  );
  const tilingScheme = new Cesium.GeographicTilingScheme({
    rectangle: Cesium.Rectangle.fromDegrees(...manifest.bbox),
    numberOfLevelZeroTilesX: 1,
    numberOfLevelZeroTilesY: 1,
  });
  const availability = new Cesium.TileAvailability(
    tilingScheme,
    manifest.maximumLevel,
  );
  for (let level = 0; level <= manifest.maximumLevel; level++)
    availability.addAvailableTileRange(
      level,
      0,
      0,
      2 ** level - 1,
      2 ** level - 1,
    );
  const creditElement = document.createElement("span");
  creditElement.textContent = manifest.attribution + " · ";
  const link = document.createElement("a");
  link.href = manifest.license;
  link.textContent = "Licence";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  creditElement.append(link);
  const errorEvent = new Cesium.Event<Cesium.TerrainProvider.ErrorEvent>();
  let active = 0;
  const widthMeters = new Cesium.EllipsoidGeodesic(
    Cesium.Cartographic.fromDegrees(manifest.bbox[0], manifest.bbox[1]),
    Cesium.Cartographic.fromDegrees(manifest.bbox[2], manifest.bbox[1]),
  ).surfaceDistance;
  const heightMeters = new Cesium.EllipsoidGeodesic(
    Cesium.Cartographic.fromDegrees(manifest.bbox[0], manifest.bbox[1]),
    Cesium.Cartographic.fromDegrees(manifest.bbox[0], manifest.bbox[3]),
  ).surfaceDistance;
  const base = new URL(".", new URL(url, window.location.origin));
  const provider: Cesium.TerrainProvider = {
    errorEvent,
    credit: new Cesium.Credit(creditElement.innerHTML, true),
    tilingScheme,
    hasWaterMask: false,
    hasVertexNormals: false,
    availability,
    getLevelMaximumGeometricError: (level) =>
      Math.max(widthMeters, heightMeters) / 64 / 2 ** level,
    getTileDataAvailable: (x, y, level) =>
      availability.isTileAvailable(level, x, y),
    loadTileDataAvailability: () => undefined,
    requestTileGeometry(x, y, level) {
      const key = `${level}/${x}/${y}.bin`,
        entry = manifest.tiles[key];
      if (!entry || active >= 6 || signal.aborted) return undefined;
      active++;
      return (async () => {
        const result = await fetch(new URL(key, base), { signal });
        if (!result.ok) throw Error("TERRAIN_TILE_HTTP");
        const tile = await boundedBytes(result, entry.bytes);
        if (
          tile.byteLength !== entry.bytes ||
          (await digest(tile)) !== entry.sha256
        )
          throw Error("TERRAIN_TILE_INTEGRITY");
        const view = new DataView(tile),
          heights = new Float32Array(65 * 65);
        for (let i = 0; i < heights.length; i++) {
          const value = view.getFloat32(i * 4, true);
          if (!Number.isFinite(value) || value < -1000 || value > 10000)
            throw Error("TERRAIN_TILE_INVALID_HEIGHT");
          heights[i] = value;
        }
        return new Cesium.HeightmapTerrainData({
          buffer: heights,
          width: 65,
          height: 65,
          childTileMask: level < manifest.maximumLevel ? 15 : 0,
        });
      })()
        .catch((error) => {
          if (!signal.aborted)
            errorEvent.raiseEvent(
              new Cesium.TileProviderError(
                provider,
                "LAND terrain tile unavailable",
                x,
                y,
                level,
                0,
                error,
              ),
            );
          throw error;
        })
        .finally(() => {
          active--;
        });
    },
  };
  return { provider, manifest };
}
