import { describe, expect, it } from "vitest";
import {
  ROAD_ATTRIBUTION,
  ROAD_LICENSE,
  ROAD_SOURCE_NAME,
  validateRoadCandidate,
} from "../pipelines/road-contract";

const hash = "094276d313b6814a45db67d47da458c45ea5979929a842aa6c6e9072c2312a67";
const aoi = {
  id: "1a169926-5c2c-48a7-a880-8e62b2b1d33d",
  version: "TX-AOI-2026-001",
  srid: 4326,
  bbox: [104.45, 21.2, 104.62, 21.35],
  outsidePolicy: "WARNING",
  canonicalGeoJson:
    '{"type":"Polygon","coordinates":[[[104.45,21.2],[104.45,21.35],[104.62,21.35],[104.62,21.2],[104.45,21.2]]]}',
  sha256: "11a166c87a6526b08cf7a1a480f3e5a0d394aec1be3f7336a7df437741417f14",
  authoritySemantics:
    "Owner-approved Phase 1 operational product coverage. NOT a legal or administrative boundary.",
};
const feature = {
  type: "Feature" as const,
  id: "osm-way-1-0",
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [104.5, 21.25],
      [104.51, 21.26],
    ],
  },
  properties: {
    name: null,
    sourceId: "way/1",
    roadClass: "track",
    verificationStatus: "UNKNOWN" as const,
  },
};
const sourceLock = {
  filename: "osm-roads-2026-001.json",
  url: "https://overpass-api.de/api/interpreter",
  query:
    '[out:json][timeout:40];(way["highway"](21.20,104.45,21.35,104.62);node["place"]["name"](21.05,104.30,21.55,104.80););out geom;',
  sha256: hash,
  bytes: 741406,
  sourceTimestamp: "2026-09-07T22:22:01Z",
  license: ROAD_LICENSE,
  attribution: ROAD_ATTRIBUTION,
};
const candidate = {
  source: {
    name: ROAD_SOURCE_NAME,
    license: ROAD_LICENSE,
    attribution: ROAD_ATTRIBUTION,
  },
  sourceLock,
  manifest: {
    version: "TX-ROADS-2026-001",
    processingVersion: "land-roads-1.0.0",
    sourceVersion: hash,
    sourceTimestamp: "2026-09-07T22:22:01Z",
    horizontalCrs: "EPSG:4326",
    aoi,
    bbox: [104.45, 21.2, 104.62, 21.35],
    features: 208,
    checksum:
      "7c36bbb1c8d9da99cc88c14f78c939be3fb1ee812580abef56557cadbb752bc0",
    license: ROAD_LICENSE,
    attribution: ROAD_ATTRIBUTION,
    verificationStatus: "UNKNOWN",
    sourceLock,
  },
  geojson: {
    type: "FeatureCollection" as const,
    attribution: ROAD_ATTRIBUTION,
    license: ROAD_LICENSE,
    sourceTimestamp: sourceLock.sourceTimestamp,
    bbox: [104.45, 21.2, 104.62, 21.35],
    features: Array.from({ length: 208 }, (_, index) => ({
      ...feature,
      id: `osm-way-${index + 1}-0`,
      properties: { ...feature.properties, sourceId: `way/${index + 1}` },
    })),
  },
};

describe("governed roads contract", () => {
  it.each([
    ["source byte count", { ...sourceLock, bytes: sourceLock.bytes + 1 }],
    [
      "source timestamp",
      { ...sourceLock, sourceTimestamp: "2026-09-08T00:00:00Z" },
    ],
    [
      "Overpass query",
      { ...sourceLock, query: '[out:json];way["highway"];out geom;' },
    ],
  ])("rejects an internally consistent changed %s", (_name, changedLock) => {
    expect(() =>
      validateRoadCandidate({
        ...candidate,
        sourceLock: changedLock,
        manifest: {
          ...candidate.manifest,
          sourceTimestamp: changedLock.sourceTimestamp,
          sourceLock: changedLock,
        },
        geojson: {
          ...candidate.geojson,
          sourceTimestamp: changedLock.sourceTimestamp,
        },
      }),
    ).toThrow();
  });

  it.each([
    ["wrong source", { source: { ...candidate.source, name: "Other" } }],
    [
      "wrong licence",
      { source: { ...candidate.source, license: "https://example.invalid" } },
    ],
    [
      "bad checksum",
      { manifest: { ...candidate.manifest, sourceVersion: "c".repeat(64) } },
    ],
    [
      "changed source bytes",
      { sourceLock: { ...sourceLock, bytes: sourceLock.bytes + 1 } },
    ],
    [
      "changed source timestamp",
      {
        sourceLock: { ...sourceLock, sourceTimestamp: "2026-09-08T00:00:00Z" },
      },
    ],
    [
      "changed query",
      {
        sourceLock: {
          ...sourceLock,
          query: '[out:json];way["highway"];out geom;',
        },
      },
    ],
    [
      "invalid bbox",
      {
        manifest: { ...candidate.manifest, bbox: [104.6, 21.2, 104.5, 21.35] },
      },
    ],
    [
      "changed bbox",
      {
        manifest: {
          ...candidate.manifest,
          bbox: [104.46, 21.2, 104.62, 21.35],
        },
      },
    ],
    [
      "wrong SRID",
      { manifest: { ...candidate.manifest, horizontalCrs: "EPSG:3857" } },
    ],
    [
      "wrong AOI identity",
      {
        manifest: {
          ...candidate.manifest,
          aoi: { ...candidate.manifest.aoi, version: "changed" },
        },
      },
    ],
    [
      "feature-count mismatch",
      { manifest: { ...candidate.manifest, features: 207 } },
    ],
  ])("rejects %s", (_name, change) => {
    expect(() => validateRoadCandidate({ ...candidate, ...change })).toThrow();
  });

  it("accepts an exact replay but rejects non-LineString and claim fields", () => {
    expect(validateRoadCandidate(candidate).features).toHaveLength(208);
    expect(() =>
      validateRoadCandidate({
        ...candidate,
        geojson: {
          ...candidate.geojson,
          features: [
            {
              ...feature,
              geometry: { type: "Point", coordinates: [104.5, 21.25] },
            },
          ],
        },
      }),
    ).toThrow();
    expect(() =>
      validateRoadCandidate({
        ...candidate,
        geojson: {
          ...candidate.geojson,
          features: [
            {
              ...feature,
              properties: { ...feature.properties, safety: "safe" },
            },
          ],
        },
      }),
    ).toThrow();
  });
});
