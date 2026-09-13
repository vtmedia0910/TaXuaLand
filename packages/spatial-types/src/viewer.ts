import { z } from "zod";
import { Wgs84Position } from "./index";
export const LayerId = z.enum(["terrain", "imagery", "roads", "places"]);
export type LayerId = z.infer<typeof LayerId>;
export type LayerReadiness =
  "UNAVAILABLE" | "INITIALIZING" | "READY" | "FAILED";
export type ViewerLayerReadiness = Record<LayerId, LayerReadiness>;
export const GovernedLayerMetadata = z
  .object({
    sourceName: z.string().min(1).max(300),
    licenseName: z.string().min(1).max(300),
    licenseReference: z.url().startsWith("https://"),
    attribution: z.string().min(1).max(1000),
    acquisitionNotice: z.string().min(1).max(1000).nullable(),
    sourceTimestamp: z.iso.datetime({ offset: true }),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    nativeResolutionMeters: z.number().positive().nullable(),
    deliveryResolutionMeters: z.number().positive().nullable(),
    verificationStatus: z.literal("UNKNOWN"),
    accuracy: z.literal("UNKNOWN"),
    limitations: z.array(z.string().min(1).max(500)).min(1).max(20),
  })
  .strict();
export type GovernedLayerMetadata = z.infer<typeof GovernedLayerMetadata>;
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
    roadsMetadata: GovernedLayerMetadata.nullable(),
    imageryManifestUrl: z.string().nullable(),
    imageryRelease: z.string().nullable(),
    imageryChecksum: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    imageryMetadata: GovernedLayerMetadata.nullable(),
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
