import { it, expect } from "vitest";
import { TerrainManifest } from "../packages/spatial-types/src/terrain";
const manifest = {
  format: "LAND_HEIGHTMAP_V1",
  version: "TX-TEST-001",
  processingVersion: "test",
  bbox: [104.3, 21.05, 104.8, 21.55],
  tileSize: 65,
  maximumLevel: 0,
  horizontalCrs: "EPSG:4326",
  verticalDatum: "WGS84_ELLIPSOID",
  sourceVerticalDatum: "EGM2008",
  normalizationCrs: "EPSG:32648",
  resolutionMeters: 60,
  heightRangeMeters: [100, 3000],
  source: "Synthetic contract fixture",
  sourceVersion: "a".repeat(64),
  geoidVersion: "b".repeat(64),
  license: "https://example.invalid/license",
  attribution: "Synthetic fixture",
  liabilityNotice: "Test",
  surfaceModel: "DSM",
  verificationStatus: "UNKNOWN",
  sourceMetadata: {
    crs: "EPSG:4326",
    pixelSpacingDegrees: [1 / 3600, 1 / 3600],
    rasterType: "Point",
    bounds: [104, 21, 105, 22],
  },
  tiles: { "0/0/0.bin": { sha256: "c".repeat(64), bytes: 16900 } },
};
it("terrain rejects wrong vertical datum, unbounded coverage and incomplete LOD indexes", () => {
  expect(TerrainManifest.safeParse(manifest).success).toBe(true);
  expect(
    TerrainManifest.safeParse({ ...manifest, verticalDatum: "UNKNOWN" })
      .success,
  ).toBe(false);
  expect(
    TerrainManifest.safeParse({ ...manifest, verticalDatum: "EGM2008" })
      .success,
  ).toBe(false);
  expect(
    TerrainManifest.safeParse({ ...manifest, bbox: [-180, -90, 180, 90] })
      .success,
  ).toBe(false);
  expect(
    TerrainManifest.safeParse({ ...manifest, maximumLevel: 1 }).success,
  ).toBe(false);
  expect(
    TerrainManifest.safeParse({
      ...manifest,
      tiles: { "../secret.bin": { sha256: "c".repeat(64), bytes: 16900 } },
    }).success,
  ).toBe(false);
  expect(
    TerrainManifest.safeParse({ ...manifest, verificationStatus: "VERIFIED" })
      .success,
  ).toBe(false);
});
