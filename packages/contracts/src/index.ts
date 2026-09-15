import { z } from "zod";
import {
  LocationRole,
  MediaType,
  SafeUrl,
  Slug,
  SourceAuthority,
  VerificationStatus,
} from "../../domain/src/index";
import { Wgs84Position } from "../../spatial-types/src/index";
export const PublicTrust = z
  .object({
    verificationStatus: VerificationStatus,
    sourceName: z.string(),
    sourceAuthority: SourceAuthority,
    observedAt: z.iso.datetime().nullable(),
    verifiedAt: z.iso.datetime().nullable(),
    expiresAt: z.iso.datetime().nullable(),
    freshness: z.enum(["CURRENT", "STALE", "UNKNOWN"]),
  })
  .strip();
export const PublicMedia = z
  .object({
    id: z.uuid(),
    mediaType: MediaType,
    sourceUrl: SafeUrl,
    title: z.string().nullable(),
    altText: z.string(),
    capturedAt: z.iso.datetime().nullable(),
  })
  .strip();
export const PublicCategory = z
  .object({
    id: z.uuid(),
    code: z.string(),
    name: z.string(),
    color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
  })
  .strip();
export const PublicPlaceDTO = z
  .object({
    id: z.uuid(),
    name: z.string(),
    slug: Slug,
    shortDescription: z.string(),
    areaName: z.string(),
    publicationStatus: z.literal("PUBLISHED"),
    categories: z.array(PublicCategory).min(1),
    location: Wgs84Position.extend({
      locationRole: LocationRole,
      verificationStatus: VerificationStatus,
      horizontalAccuracyMeters: z.number().nonnegative().nullable(),
      trust: PublicTrust,
    }).strip(),
    mediaSummary: z.array(PublicMedia).max(1),
    trust: PublicTrust,
    updatedAt: z.iso.datetime(),
  })
  .strip();
export type PublicPlaceDTO = z.infer<typeof PublicPlaceDTO>;
export const PublicPlaceDetailDTO = PublicPlaceDTO.extend({
  description: z.string(),
  visitContext: z
    .object({
      bestSeasonText: z.string(),
      recommendedTimeText: z.string(),
      difficulty: z.string(),
      audienceText: z.string(),
      guideRequirement: z.string(),
    })
    .strip()
    .nullable(),
  accessContext: z
    .object({
      accessMethodText: z.string(),
      roadConditionText: z.string(),
      routeNote: z.string(),
      trust: PublicTrust,
    })
    .strip()
    .nullable(),
  safetyNotes: z.array(
    z.object({ note: z.string(), trust: PublicTrust }).strip(),
  ),
  media: z.array(PublicMedia),
  externalReferences: z.array(
    z.object({ provider: z.string(), externalUrl: SafeUrl }).strip(),
  ),
}).strip();
export type PublicPlaceDetailDTO = z.infer<typeof PublicPlaceDetailDTO>;
export const PublicListQuery = z.object({
  query: z.string().max(120).default(""),
  category: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
export const PublicPlaceList = z.object({
  items: z.array(PublicPlaceDTO),
  nextOffset: z.number().int().nonnegative().nullable(),
});

const BboxCoordinate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() !== "" ? Number(value) : value,
  z.number().finite(),
);
export const PublicPlaceMarkerQuery = z
  .object({
    west: BboxCoordinate.pipe(z.number().min(-180).max(180)),
    south: BboxCoordinate.pipe(z.number().min(-90).max(90)),
    east: BboxCoordinate.pipe(z.number().min(-180).max(180)),
    north: BboxCoordinate.pipe(z.number().min(-90).max(90)),
    limit: z.coerce.number().int().min(1).max(100).default(100),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict()
  .refine(({ west, east }) => west < east, "west must be less than east")
  .refine(({ south, north }) => south < north, "south must be less than north");
export const PublicBbox = z
  .object({
    west: z.number().finite().min(-180).max(180),
    south: z.number().finite().min(-90).max(90),
    east: z.number().finite().min(-180).max(180),
    north: z.number().finite().min(-90).max(90),
  })
  .strict();
export const PublicPlaceMarkerDTO = z
  .object({
    id: z.uuid(),
    slug: Slug,
    name: z.string(),
    position: Wgs84Position,
    /** Deterministic marker styling only; this is not a domain primary category. */
    presentationCategory: PublicCategory,
  })
  .strict();
export type PublicPlaceMarkerDTO = z.infer<typeof PublicPlaceMarkerDTO>;
export const PublicPlaceMarkerPage = z
  .object({
    items: z.array(PublicPlaceMarkerDTO).max(100),
    bbox: PublicBbox,
    clamped: z.boolean(),
    truncated: z.boolean(),
    nextOffset: z.number().int().nonnegative().nullable(),
  })
  .strict();
export type PublicPlaceMarkerPage = z.infer<typeof PublicPlaceMarkerPage>;
