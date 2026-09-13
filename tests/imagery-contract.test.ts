import { describe, expect, it } from "vitest";
import { ImageryManifest } from "../packages/spatial-types/src/imagery";
import {
  assertAoiContained,
  assertApprovedImageryIdentity,
  obstructionPercent,
} from "../pipelines/imagery-contract";
import * as imageryContract from "../pipelines/imagery-contract";

const sha = "33aad31e8c02244c8d399add099bb337e8ad49e53f04b693bcdb0c9072b5a2c3";
const bbox = [104.45, 21.2, 104.62, 21.35] as const;
const aoi = {
  id: "1a169926-5c2c-48a7-a880-8e62b2b1d33d",
  version: "TX-AOI-2026-001",
  srid: 4326,
  bbox,
  outsidePolicy: "WARNING",
  canonicalGeoJson:
    '{"type":"Polygon","coordinates":[[[104.45,21.2],[104.45,21.35],[104.62,21.35],[104.62,21.2],[104.45,21.2]]]}',
  sha256: "11a166c87a6526b08cf7a1a480f3e5a0d394aec1be3f7336a7df437741417f14",
  authoritySemantics:
    "Owner-approved Phase 1 operational product coverage. NOT a legal or administrative boundary.",
} as const;
const manifest = {
  format: "LAND_IMAGERY_V1",
  datasetCode: "TX_IMAGERY_BASE",
  releaseVersion: "TX-IMAGERY-S2L2A-20260527T034216Z-001",
  source: {
    name: "Copernicus Sentinel-2 Collection 1 Level-2A Surface Reflectance / AWS Open Data COGs",
    collection: "sentinel-2-c1-l2a",
    itemId: "S2C_T48QVJ_20260527T033930_L2A",
    productId:
      "S2C_MSIL2A_20260527T032511_N0512_R018_T48QVJ_20260527T082311.SAFE",
    sourceLockSha256: sha,
    assets: {
      item: {
        sha256:
          "1da384852518a7fdfb0480a419991c2ed00f43b6a0eef83f651148a5512637b1",
        bytes: 17682,
        mediaType: "application/geo+json",
      },
      visual: {
        sha256:
          "d4ba26b4be3430e92ebc8c4e03657c228091a5ed1d4cf642897b4329ea2b63f2",
        bytes: 320168754,
        mediaType: "image/tiff; application=geotiff; profile=cloud-optimized",
      },
      scl: {
        sha256:
          "33422ed1bc5c9314df348bdcfa322513d1faa40e07998085f42e01c470ee07c1",
        bytes: 2543183,
        mediaType: "image/tiff; application=geotiff; profile=cloud-optimized",
      },
    },
    sensingAt: "2026-05-27T03:42:16.849000Z",
    generatedAt: "2026-05-27T08:23:11.000000Z",
    acquiredAt: "2026-09-12T00:00:00Z",
  },
  processing: {
    version: "land-imagery-1.0.0",
    processedAt: "2026-09-12T00:00:00Z",
    tools: {
      rasterio: "1.5.1",
      gdal: "3.11.4",
      proj: "9.6.2",
      libpng: "1.6.50",
    },
  },
  sourceCrs: "EPSG:32648",
  targetCrs: "EPSG:3857",
  aoi,
  bbox,
  nativeResolutionMeters: { visual: 10, sclQa: 20 },
  delivery: {
    scheme: "WEB_MERCATOR_XYZ",
    tileSize: 256,
    minimumLevel: 0,
    maximumLevel: 0,
    resolutionAtMaximumLevelMeters: 156543.03392804097,
    tileUrlTemplate: "{z}/{x}/{y}.png",
  },
  quality: {
    sceneCloudPercent: 8.200835,
    obstructionThresholdPercent: 10,
    aoiObstructionPercent: 5.86,
    obstructionClasses: [3, 8, 9, 10, 11],
    validPixelCount: 100,
    obstructedPixelCount: 6,
    nodataPixelCount: 0,
    saturatedPixelCount: 0,
    aoiContained: true,
  },
  rights: {
    licenseName: "Copernicus Sentinel Data Legal Notice (rev. 1)",
    licenseReference: "https://cds.climate.copernicus.eu/licences/ec-sentinel",
    publicNotice: "Contains modified Copernicus Sentinel data 2026",
    acquisitionNotice:
      "Sentinel-2 Cloud-Optimized GeoTIFFs was accessed on 2026-09-12 from https://registry.opendata.aws/sentinel-2-l2a-cogs.",
  },
  verificationStatus: "UNKNOWN",
  accuracy: "UNKNOWN",
  limitations: [
    "Resolution is not positional accuracy.",
    "Cloud screening is not field verification.",
  ],
  tileCount: 1,
  tiles: {
    "0/0/0.png": { bytes: 100, sha256: "d".repeat(64), mediaType: "image/png" },
  },
};

describe("LAND_IMAGERY_V1", () => {
  it("binds the completed build QA to the approved manifest", () => {
    const assertBuild = Reflect.get(
      imageryContract,
      "assertApprovedImageryBuild",
    );
    expect(typeof assertBuild).toBe("function");
    const build = {
      releaseVersion: manifest.releaseVersion,
      sourceLockSha256: manifest.source.sourceLockSha256,
      manifestSha256: "f".repeat(64),
      qa: {
        itemId: manifest.source.itemId,
        aoiId: aoi.id,
        aoiVersion: aoi.version,
        aoiSha256: aoi.sha256,
        ...manifest.quality,
        verificationStatus: "UNKNOWN",
        accuracy: "UNKNOWN",
      },
    };
    expect(() => assertBuild(manifest, build, "f".repeat(64))).not.toThrow();
    expect(() =>
      assertBuild(
        manifest,
        { ...build, qa: { ...build.qa, validPixelCount: 99 } },
        "f".repeat(64),
      ),
    ).toThrow();
    expect(() =>
      assertBuild(
        manifest,
        { ...build, sourceLockSha256: "e".repeat(64) },
        "f".repeat(64),
      ),
    ).toThrow();
  });

  it("accepts the bounded manifest and rejects traversal, origins, wrong MIME, hashes and incomplete tiles", () => {
    expect(ImageryManifest.safeParse(manifest).success).toBe(true);
    for (const changed of [
      {
        delivery: {
          ...manifest.delivery,
          tileUrlTemplate: "https://evil.invalid/{z}/{x}/{y}.png",
        },
      },
      {
        delivery: {
          ...manifest.delivery,
          tileUrlTemplate: "../{z}/{x}/{y}.png",
        },
      },
      {
        tiles: {
          "0/0/0.png": {
            ...manifest.tiles["0/0/0.png"],
            mediaType: "image/jpeg",
          },
        },
      },
      {
        tiles: {
          "0/0/0.png": { ...manifest.tiles["0/0/0.png"], sha256: "wrong" },
        },
      },
      { tiles: {}, tileCount: 0 },
    ])
      expect(
        ImageryManifest.safeParse({ ...manifest, ...changed }).success,
      ).toBe(false);
  });

  it("pins the exact Item, CRS, asset metadata and approved source checksums", () => {
    expect(() => assertApprovedImageryIdentity(manifest)).not.toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        source: { ...manifest.source, itemId: "changed" },
      }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({ ...manifest, sourceCrs: "EPSG:4326" }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        source: {
          ...manifest.source,
          assets: {
            ...manifest.source.assets,
            scl: { ...manifest.source.assets.scl, sha256: "e".repeat(64) },
          },
        },
      }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        source: { ...manifest.source, sourceLockSha256: "e".repeat(64) },
      }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        source: { ...manifest.source, sensingAt: "2026-05-28T00:00:00Z" },
      }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        aoi: { ...aoi, version: "changed" },
      }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        bbox: [104.46, 21.2, 104.62, 21.35],
      }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        quality: { ...manifest.quality, sceneCloudPercent: 9 },
      }),
    ).toThrow();
    expect(() =>
      assertApprovedImageryIdentity({
        ...manifest,
        rights: { ...manifest.rights, acquisitionNotice: "Changed provenance" },
      }),
    ).toThrow();
  });

  it("requires full AOI containment and enforces the inclusive 10% obstruction gate", () => {
    const item = [
      [104.03, 21.7],
      [104.04, 20.7],
      [105.09, 20.71],
      [105.1, 21.71],
      [104.03, 21.7],
    ];
    expect(() => assertAoiContained(item, bbox)).not.toThrow();
    expect(() =>
      assertAoiContained(
        [
          [104.5, 21.3],
          [104.5, 21.2],
          [104.6, 21.2],
          [104.5, 21.3],
        ],
        bbox,
      ),
    ).toThrow();
    expect(obstructionPercent(10, 100)).toBe(10);
    expect(() => obstructionPercent(11, 100)).toThrow();
  });
});
