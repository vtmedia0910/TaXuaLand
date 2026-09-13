import { describe, expect, it } from "vitest";
import { LAND_VIEWER_BASE } from "../packages/config/src/viewer";
import {
  initialLayerReadiness,
  regionalCameraFrame,
} from "../apps/web/components/spatial-viewer/viewer-state";

describe("Phase 1A viewer state", () => {
  it("derives the regional camera from ViewerConfig and removes reduced-motion flight", () => {
    const config = {
      ...LAND_VIEWER_BASE,
      initialView: {
        longitude: 104.501,
        latitude: 21.301,
        heightMeters: 12345,
      },
    };

    expect(regionalCameraFrame(config, false)).toEqual({
      ...config.initialView,
      headingDegrees: 0,
      pitchDegrees: -55,
      durationSeconds: 1,
    });
    expect(regionalCameraFrame(config, true)).toMatchObject({
      ...config.initialView,
      durationSeconds: 0,
    });
  });

  it("keeps unavailable future layers independent from initialized layers", () => {
    expect(initialLayerReadiness(LAND_VIEWER_BASE)).toEqual({
      terrain: "UNAVAILABLE",
      imagery: "UNAVAILABLE",
      roads: "UNAVAILABLE",
      places: "INITIALIZING",
    });
  });

  it("initializes one governed imagery release independently", () => {
    expect(
      initialLayerReadiness({
        ...LAND_VIEWER_BASE,
        imageryManifestUrl: "/spatial/imagery/dataset/release/manifest.json",
        imageryRelease: "TX-IMAGERY-S2L2A-20260527T034216Z-001",
        imageryChecksum: "a".repeat(64),
        imageryMetadata: {
          sourceName: "Synthetic",
          licenseName: "Synthetic",
          licenseReference: "https://example.invalid/license",
          attribution: "Synthetic",
          acquisitionNotice: null,
          sourceTimestamp: "2026-05-27T03:42:16.849Z",
          bbox: [104.45, 21.2, 104.62, 21.35],
          nativeResolutionMeters: 10,
          deliveryResolutionMeters: 9.55,
          verificationStatus: "UNKNOWN",
          accuracy: "UNKNOWN",
          limitations: ["Synthetic fixture"],
        },
      }),
    ).toMatchObject({ imagery: "INITIALIZING", terrain: "UNAVAILABLE" });
  });
});
