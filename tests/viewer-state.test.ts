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
});
