import { z } from "zod";

const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const Bbox = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .refine(([w, s, e, n]) => w >= -180 && e <= 180 && s >= -85.051129 && n <= 85.051129 && w < e && s < n && e - w <= 2 && n - s <= 2);
const Tile = z.object({ bytes: z.number().int().positive().max(32 * 1024 * 1024), sha256: Sha256, mediaType: z.literal("image/png") }).strict();
const AoiEvidence = z
  .object({
    id: z.uuid(),
    version: z.string().min(1).max(100),
    srid: z.literal(4326),
    bbox: Bbox,
    outsidePolicy: z.enum(["WARNING", "INVALID"]),
    canonicalGeoJson: z.string().min(1).max(10_000),
    sha256: Sha256,
    authoritySemantics: z.string().min(1).max(500),
  })
  .strict();

function tileRange(bbox: readonly number[], level: number) {
  const n = 2 ** level;
  const x = (lon: number) => ((lon + 180) / 360) * n;
  const y = (lat: number) =>
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
  return {
    minX: Math.max(0, Math.floor(x(bbox[0]!))),
    maxX: Math.min(n - 1, Math.ceil(x(bbox[2]!)) - 1),
    minY: Math.max(0, Math.floor(y(bbox[3]!))),
    maxY: Math.min(n - 1, Math.ceil(y(bbox[1]!)) - 1),
  };
}

export const ImageryManifest = z
  .object({
    format: z.literal("LAND_IMAGERY_V1"),
    datasetCode: z.literal("TX_IMAGERY_BASE"),
    releaseVersion: z.string().regex(/^TX-IMAGERY-S2L2A-\d{8}T\d{6}Z-\d{3}$/),
    source: z
      .object({
        name: z.string().min(1).max(300),
        collection: z.string().min(1).max(100),
        itemId: z.string().min(1).max(200),
        productId: z.string().min(1).max(300),
        sourceLockSha256: Sha256,
        assets: z
          .object({
            item: z.object({ sha256: Sha256, bytes: z.number().int().positive(), mediaType: z.literal("application/geo+json") }).strict(),
            visual: z.object({ sha256: Sha256, bytes: z.number().int().positive(), mediaType: z.literal("image/tiff; application=geotiff; profile=cloud-optimized") }).strict(),
            scl: z.object({ sha256: Sha256, bytes: z.number().int().positive(), mediaType: z.literal("image/tiff; application=geotiff; profile=cloud-optimized") }).strict(),
          })
          .strict(),
        sensingAt: z.iso.datetime({ offset: true }),
        generatedAt: z.iso.datetime({ offset: true }),
        acquiredAt: z.iso.datetime({ offset: true }),
      })
      .strict(),
    processing: z
      .object({
        version: z.string().min(1).max(100),
        processedAt: z.iso.datetime({ offset: true }),
        tools: z.record(z.string().min(1), z.string().min(1)).refine((tools) => ["rasterio", "gdal", "proj", "libpng"].every((tool) => tools[tool])),
      })
      .strict(),
    sourceCrs: z.literal("EPSG:32648"),
    targetCrs: z.literal("EPSG:3857"),
    aoi: AoiEvidence,
    bbox: Bbox,
    nativeResolutionMeters: z.object({ visual: z.literal(10), sclQa: z.literal(20) }).strict(),
    delivery: z
      .object({
        scheme: z.literal("WEB_MERCATOR_XYZ"),
        tileSize: z.literal(256),
        minimumLevel: z.number().int().min(0).max(18),
        maximumLevel: z.number().int().min(0).max(18),
        resolutionAtMaximumLevelMeters: z.number().positive(),
        tileUrlTemplate: z.literal("{z}/{x}/{y}.png"),
      })
      .strict()
      .refine(({ minimumLevel, maximumLevel }) => minimumLevel <= maximumLevel),
    quality: z
      .object({
        sceneCloudPercent: z.number().min(0).max(20),
        obstructionThresholdPercent: z.literal(10),
        aoiObstructionPercent: z.number().min(0).max(10),
        obstructionClasses: z.tuple([z.literal(3), z.literal(8), z.literal(9), z.literal(10), z.literal(11)]),
        validPixelCount: z.number().int().positive(),
        obstructedPixelCount: z.number().int().nonnegative(),
        nodataPixelCount: z.literal(0),
        saturatedPixelCount: z.literal(0),
        aoiContained: z.literal(true),
      })
      .strict(),
    rights: z
      .object({
        licenseName: z.string().min(1).max(300),
        licenseReference: z.url().startsWith("https://"),
        publicNotice: z.literal("Contains modified Copernicus Sentinel data 2026"),
        acquisitionNotice: z.string().min(1).max(1000),
      })
      .strict(),
    verificationStatus: z.literal("UNKNOWN"),
    accuracy: z.literal("UNKNOWN"),
    limitations: z.array(z.string().min(1).max(500)).min(2).max(20),
    tileCount: z.number().int().positive().max(5462),
    tiles: z.record(z.string().regex(/^\d+\/\d+\/\d+\.png$/), Tile),
  })
  .strict()
  .superRefine((manifest, context) => {
    const expected = new Set<string>();
    for (let level = manifest.delivery.minimumLevel; level <= manifest.delivery.maximumLevel; level++) {
      const range = tileRange(manifest.bbox, level);
      for (let x = range.minX; x <= range.maxX; x++)
        for (let y = range.minY; y <= range.maxY; y++) expected.add(`${level}/${x}/${y}.png`);
    }
    const actual = Object.keys(manifest.tiles);
    if (manifest.tileCount !== actual.length || actual.length !== expected.size || actual.some((tile) => !expected.has(tile)))
      context.addIssue({ code: "custom", message: "Incomplete imagery tile index" });
  });

export type ImageryManifest = z.infer<typeof ImageryManifest>;
