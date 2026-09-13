import type { ViewerConfig } from "../../spatial-types/src/viewer";
/** Owner-approved operational product coverage, not an administrative boundary. */
export const LAND_VIEWER_BASE: ViewerConfig = {
  aoi: {
    name: "Tà Xùa — Phase 1 operational product coverage",
    version: "TX-AOI-2026-001",
    source:
      "Owner-approved Phase 1 operational product coverage; not a legal or administrative boundary",
    west: 104.45,
    south: 21.2,
    east: 104.62,
    north: 21.35,
  },
  terrainUrl: null,
  terrainRelease: null,
  terrainChecksum: null,
  roadsUrl: null,
  roadsRelease: null,
  roadsMetadata: null,
  imageryManifestUrl: null,
  imageryRelease: null,
  imageryChecksum: null,
  imageryMetadata: null,
  imagery: "NEUTRAL_GRID",
  minimumCameraHeight: 100,
  maximumCameraHeight: 60000,
  initialView: { longitude: 104.535, latitude: 21.245, heightMeters: 14000 },
};
