import { z } from "zod";
import { MediaType, SafeUrl, Slug } from "../../../packages/domain/src/index";
import { Wgs84Position } from "../../../packages/spatial-types/src/index";
const text = z.string().max(10000).default("");
export const VisitInput = z
  .object({
    bestSeasonText: text,
    recommendedTimeText: text,
    difficulty: text,
    audienceText: text,
    guideRequirement: text,
  })
  .strict();
export const AccessInput = z
  .object({
    accessMethodText: text,
    roadConditionText: text,
    routeNote: text,
    observedAt: z.iso.datetime().nullable().default(null),
  })
  .strict();
export const MediaInput = z
  .object({
    mediaType: MediaType,
    sourceUrl: SafeUrl,
    title: z.string().max(200).nullable().default(null),
    altText: z.string().max(300).default(""),
    capturedAt: z.iso.datetime().nullable().default(null),
  })
  .strict();
export const PlaceInput = z
  .object({
    name: z.string().trim().min(1).max(200),
    slug: Slug,
    shortDescription: z.string().max(1000).default(""),
    description: text,
    areaName: z.string().max(200).default(""),
    internalNotes: text,
    sourceId: z.uuid().nullable(),
    sourceObservedAt: z.iso.datetime().nullable().default(null),
    location: Wgs84Position.nullable(),
    horizontalAccuracyMeters: z
      .number()
      .finite()
      .nonnegative()
      .nullable()
      .default(null),
    geometryChangeConfirmed: z.boolean().default(false),
    categoryIds: z.array(z.uuid()).max(30).default([]),
    visitContext: VisitInput.default({
      bestSeasonText: "",
      recommendedTimeText: "",
      difficulty: "",
      audienceText: "",
      guideRequirement: "",
    }),
    accessContext: AccessInput.default({
      accessMethodText: "",
      roadConditionText: "",
      routeNote: "",
      observedAt: null,
    }),
    safetyNotes: z
      .array(
        z
          .object({
            note: z.string().min(1).max(5000),
            observedAt: z.iso.datetime().nullable(),
            expiresAt: z.iso.datetime().nullable(),
          })
          .strict(),
      )
      .max(30)
      .default([]),
    media: z.array(MediaInput).max(50).default([]),
    externalReferences: z
      .array(
        z
          .object({
            provider: z.string().min(1).max(100),
            externalUrl: SafeUrl,
          })
          .strict(),
      )
      .max(20)
      .default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.location?.heightMeters != null)
      ctx.addIssue({
        code: "custom",
        path: ["location", "heightMeters"],
        message:
          "Chưa nhận cao độ địa điểm khi thiếu datum và quy trình cao độ.",
      });
    if (
      (value.location ||
        value.media.length ||
        value.safetyNotes.length ||
        value.externalReferences.length ||
        Object.values(value.accessContext).some(Boolean)) &&
      !value.sourceId
    )
      ctx.addIssue({
        code: "custom",
        path: ["sourceId"],
        message: "Nguồn bắt buộc cho dữ liệu không gian và nội dung có nguồn.",
      });
    if (new Set(value.categoryIds).size !== value.categoryIds.length)
      ctx.addIssue({
        code: "custom",
        path: ["categoryIds"],
        message: "Danh mục trùng lặp.",
      });
  });
export type PlaceInput = z.infer<typeof PlaceInput>;
export const SavePlaceInput = z
  .object({ version: z.number().int().positive(), data: PlaceInput })
  .strict();
export const AdminListInput = z.object({
  query: z.string().max(120).default(""),
  publicationStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  categoryId: z.uuid().optional(),
  verificationStatus: z
    .enum(["UNKNOWN", "DECLARED", "VERIFIED", "EXPIRED"])
    .optional(),
  sourceId: z.uuid().optional(),
  missingCoordinate: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .or(z.boolean())
    .optional(),
  stale: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .or(z.boolean())
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
