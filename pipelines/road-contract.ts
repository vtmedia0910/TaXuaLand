import { z } from "zod";
import {
  assertAuthoritativeAoi,
  AUTHORITATIVE_AOI,
} from "./aoi-contract.ts";

export const ROAD_SOURCE_NAME = "OpenStreetMap AOI road extract";
export const ROAD_LICENSE = "https://opendatacommons.org/licenses/odbl/1-0/";
export const ROAD_ATTRIBUTION = "© OpenStreetMap contributors";
export const ROAD_SOURCE_VERSION =
  "094276d313b6814a45db67d47da458c45ea5979929a842aa6c6e9072c2312a67";
export const ROAD_CHECKSUM =
  "7c36bbb1c8d9da99cc88c14f78c939be3fb1ee812580abef56557cadbb752bc0";
export const ROAD_SOURCE_TIMESTAMP = "2026-09-07T22:22:01Z";
export const ROAD_BBOX = [104.45, 21.2, 104.62, 21.35] as const;
const Bbox = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .refine(([w, s, e, n]) => w < e && s < n);
const ApprovedBbox = z.tuple([
  z.literal(104.45),
  z.literal(21.2),
  z.literal(104.62),
  z.literal(21.35),
]);
const AoiEvidence = z
  .object({
    id: z.string(),
    version: z.string(),
    srid: z.number(),
    bbox: ApprovedBbox,
    outsidePolicy: z.string(),
    canonicalGeoJson: z.string(),
    sha256: z.string(),
    authoritySemantics: z.string(),
  })
  .strict();
const SourceLock = z
  .object({
    filename: z.literal("osm-roads-2026-001.json"),
    url: z.literal("https://overpass-api.de/api/interpreter"),
    query: z.literal(
      '[out:json][timeout:40];(way["highway"](21.20,104.45,21.35,104.62);node["place"]["name"](21.05,104.30,21.55,104.80););out geom;',
    ),
    sha256: z.literal(ROAD_SOURCE_VERSION),
    bytes: z.literal(741406),
    sourceTimestamp: z.literal(ROAD_SOURCE_TIMESTAMP),
    license: z.literal(ROAD_LICENSE),
    attribution: z.literal(ROAD_ATTRIBUTION),
  })
  .strict();
const Feature = z
  .object({
    type: z.literal("Feature"),
    id: z.string().regex(/^osm-way-\d+-\d+$/),
    geometry: z
      .object({
        type: z.literal("LineString"),
        coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
      })
      .strict(),
    properties: z
      .object({
        name: z.string().nullable(),
        sourceId: z.string().regex(/^way\/\d+$/),
        roadClass: z.string().min(1).max(100),
        verificationStatus: z.literal("UNKNOWN"),
      })
      .strict(),
  })
  .strict();
const Manifest = z
  .object({
    version: z.literal("TX-ROADS-2026-001"),
    processingVersion: z.literal("land-roads-1.0.0"),
    sourceVersion: z.literal(ROAD_SOURCE_VERSION),
    sourceTimestamp: z.literal(ROAD_SOURCE_TIMESTAMP),
    horizontalCrs: z.literal("EPSG:4326"),
    aoi: AoiEvidence,
    bbox: ApprovedBbox,
    features: z.literal(208),
    checksum: z.literal(ROAD_CHECKSUM),
    license: z.literal(ROAD_LICENSE),
    attribution: z.literal(ROAD_ATTRIBUTION),
    verificationStatus: z.literal("UNKNOWN"),
    sourceLock: SourceLock,
  })
  .strict();
const Candidate = z
  .object({
    source: z
      .object({
        name: z.literal(ROAD_SOURCE_NAME),
        license: z.literal(ROAD_LICENSE),
        attribution: z.literal(ROAD_ATTRIBUTION),
      })
      .strict(),
    sourceLock: SourceLock,
    manifest: Manifest,
    geojson: z
      .object({
        type: z.literal("FeatureCollection"),
        attribution: z.literal(ROAD_ATTRIBUTION),
        license: z.literal(ROAD_LICENSE),
        sourceTimestamp: z.iso.datetime({ offset: true }),
        bbox: Bbox,
        features: z.array(Feature).min(1),
      })
      .strict(),
  })
  .strict();

export function validateRoadCandidate(input: unknown) {
  const candidate = Candidate.parse(input);
  assertAuthoritativeAoi(candidate.manifest.aoi);
  if (
    candidate.manifest.sourceVersion !== candidate.sourceLock.sha256 ||
    JSON.stringify(candidate.manifest.sourceLock) !==
      JSON.stringify(candidate.sourceLock)
  )
    throw Error("Road source identity mismatch");
  if (
    candidate.manifest.features !== candidate.geojson.features.length ||
    candidate.manifest.sourceTimestamp !== candidate.geojson.sourceTimestamp ||
    JSON.stringify(candidate.manifest.bbox) !==
      JSON.stringify(AUTHORITATIVE_AOI.bbox) ||
    JSON.stringify(candidate.manifest.bbox) !==
      JSON.stringify(candidate.manifest.aoi.bbox) ||
    JSON.stringify(candidate.manifest.bbox) !==
      JSON.stringify(candidate.geojson.bbox)
  )
    throw Error("Road feature count, timestamp or bbox mismatch");
  const [west, south, east, north] = candidate.manifest.bbox;
  for (const feature of candidate.geojson.features)
    for (const [longitude, latitude] of feature.geometry.coordinates)
      if (
        longitude < west ||
        longitude > east ||
        latitude < south ||
        latitude > north
      )
        throw Error("Road coordinate outside release bbox");
  return candidate.geojson;
}
