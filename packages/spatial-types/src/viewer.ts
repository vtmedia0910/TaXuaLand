import { z } from "zod";
import { Wgs84Position } from "./index";
export const LayerId = z.enum(["terrain", "imagery", "roads", "places"]);
export type LayerId = z.infer<typeof LayerId>;
export type LayerReadiness =
  "UNAVAILABLE" | "INITIALIZING" | "READY" | "FAILED";
export type ViewerLayerReadiness = Record<LayerId, LayerReadiness>;
export const ViewerConfig = z
  .object({
    aoi: z
      .object({
        name: z.string(),
        version: z.string(),
        source: z.string(),
        west: z.number(),
        south: z.number(),
        east: z.number(),
        north: z.number(),
      })
      .strict(),
    terrainUrl: z.string().nullable(),
    terrainRelease: z.string().nullable(),
    terrainChecksum: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable()
      .default(null),
    roadsUrl: z.string().nullable(),
    roadsRelease: z.string().nullable(),
    imagery: z.literal("NEUTRAL_GRID"),
    minimumCameraHeight: z.number(),
    maximumCameraHeight: z.number(),
    initialView: Wgs84Position.extend({ heightMeters: z.number() }),
  })
  .strict();
export type ViewerConfig = z.infer<typeof ViewerConfig>;
export interface ViewerPoint {
  id: string;
  name: string;
  location: Wgs84Position;
  color: string;
  state?: "CURRENT" | "CANDIDATE" | "INVALID";
}
export interface ViewerDiagnostics {
  initialized: boolean;
  webgl: boolean;
  layers: ViewerLayerReadiness;
  terrainRelease: string | null;
  roadsRelease: string | null;
  failedRequests: number;
  initializationMs: number | null;
  firstFrameMs: number | null;
  firstStableFrameMs: number | null;
  clientErrors: number;
  placeLayerMs: number | null;
}
