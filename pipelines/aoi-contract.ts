import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

export const AUTHORITATIVE_AOI = {
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
} as const;

export function assertAuthoritativeAoi(value: unknown) {
  if (
    !isDeepStrictEqual(value, AUTHORITATIVE_AOI) ||
    createHash("sha256")
      .update(AUTHORITATIVE_AOI.canonicalGeoJson)
      .digest("hex") !== AUTHORITATIVE_AOI.sha256
  )
    throw Error("Authoritative LAND AOI identity mismatch");
}
