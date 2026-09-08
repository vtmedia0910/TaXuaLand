import { z } from "zod";
export const TerrainManifest = z
  .object({
    format: z.literal("LAND_HEIGHTMAP_V1"),
    version: z.string().regex(/^[A-Z0-9-]+$/),
    processingVersion: z.string().max(100),
    bbox: z
      .tuple([z.number(), z.number(), z.number(), z.number()])
      .refine(
        ([w, s, e, n]) =>
          w >= -180 &&
          e <= 180 &&
          s >= -90 &&
          n <= 90 &&
          w < e &&
          s < n &&
          e - w <= 2 &&
          n - s <= 2,
      ),
    tileSize: z.literal(65),
    maximumLevel: z.number().int().min(0).max(6),
    horizontalCrs: z.literal("EPSG:4326"),
    verticalDatum: z.literal("WGS84_ELLIPSOID"),
    sourceVerticalDatum: z.string().max(100),
    normalizationCrs: z.string().max(100),
    resolutionMeters: z.number().positive(),
    heightRangeMeters: z.tuple([z.number().min(-1000), z.number().max(10000)]),
    source: z.string().max(300),
    sourceVersion: z.string().regex(/^[a-f0-9]{64}$/),
    geoidVersion: z.string().regex(/^[a-f0-9]{64}$/),
    license: z.url().startsWith("https://"),
    attribution: z.string().max(1000),
    liabilityNotice: z.string().max(1000),
    surfaceModel: z.string().max(300),
    verificationStatus: z.literal("UNKNOWN"),
    sourceMetadata: z.object({
      crs: z.string(),
      pixelSpacingDegrees: z.array(z.number()).length(2),
      rasterType: z.string(),
      bounds: z.array(z.number()).length(4),
    }),
    tiles: z.record(
      z.string().regex(/^\d+\/\d+\/\d+\.bin$/),
      z
        .object({
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
          bytes: z.literal(16900),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((manifest, context) => {
    const expected = (4 ** (manifest.maximumLevel + 1) - 1) / 3;
    if (Object.keys(manifest.tiles).length !== expected)
      context.addIssue({ code: "custom", message: "Incomplete tile index" });
    for (let level = 0; level <= manifest.maximumLevel; level++)
      for (let y = 0; y < 2 ** level; y++)
        for (let x = 0; x < 2 ** level; x++)
          if (!manifest.tiles[`${level}/${x}/${y}.bin`])
            context.addIssue({
              code: "custom",
              message: "Missing terrain tile",
            });
  });
export type TerrainManifest = z.infer<typeof TerrainManifest>;
