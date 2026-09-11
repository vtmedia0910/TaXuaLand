import type {
  ViewerConfig,
  ViewerLayerReadiness,
} from "../../../../packages/spatial-types/src/viewer";

export const cameraFlightDuration = (reducedMotion: boolean) =>
  reducedMotion ? 0 : 1;

export function regionalCameraFrame(
  config: ViewerConfig,
  reducedMotion: boolean,
  overhead = false,
) {
  return {
    ...config.initialView,
    headingDegrees: 0,
    pitchDegrees: overhead ? -90 : -55,
    durationSeconds: cameraFlightDuration(reducedMotion),
  };
}

export function initialLayerReadiness(
  config: ViewerConfig,
): ViewerLayerReadiness {
  return {
    terrain: config.terrainUrl ? "INITIALIZING" : "UNAVAILABLE",
    imagery: "UNAVAILABLE",
    roads: config.roadsUrl ? "INITIALIZING" : "UNAVAILABLE",
    places: "INITIALIZING",
  };
}
