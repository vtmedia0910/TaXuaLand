import type { ViewerConfig } from "../../spatial-types/src/viewer";
/** Operational coverage box, not an administrative boundary or verified place. */
export const LAND_VIEWER_BASE: ViewerConfig = {
  aoi: {
    name: "Tà Xùa — vùng thử nghiệm Phase 0",
    version: "TX-AOI-DEMO-001",
    source: "LAND operational coverage configuration; not an official boundary",
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
  imagery: "NEUTRAL_GRID",
  minimumCameraHeight: 100,
  maximumCameraHeight: 60000,
  initialView: { longitude: 104.535, latitude: 21.245, heightMeters: 14000 },
};
