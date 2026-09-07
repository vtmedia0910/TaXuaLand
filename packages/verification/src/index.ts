import { z } from "zod";
import { VerificationStatus } from "../../domain/src/index";
export const VerificationSchema = z
  .object({
    status: VerificationStatus,
    method: z.string().min(1).max(200).nullable(),
    verifiedAt: z.iso.datetime().nullable(),
    actorId: z.uuid().nullable(),
    evidenceSourceRecordId: z.uuid().nullable(),
    expiresAt: z.iso.datetime().nullable(),
    freshnessPolicy: z.enum(["NO_EXPIRY", "EXPIRES", "UNKNOWN"]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.status === "VERIFIED" &&
      (!value.method ||
        !value.verifiedAt ||
        !value.actorId ||
        !value.evidenceSourceRecordId ||
        value.freshnessPolicy === "UNKNOWN")
    )
      ctx.addIssue({
        code: "custom",
        message:
          "VERIFIED requires method, timestamp, actor, evidence and freshness policy",
      });
    if (value.freshnessPolicy === "EXPIRES" && !value.expiresAt)
      ctx.addIssue({ code: "custom", message: "Expiry timestamp is required" });
    if (
      value.verifiedAt &&
      value.expiresAt &&
      Date.parse(value.expiresAt) <= Date.parse(value.verifiedAt)
    )
      ctx.addIssue({
        code: "custom",
        message: "Expiry must follow verification",
      });
  });
export type Verification = z.infer<typeof VerificationSchema>;
export const unknownVerification = (): Verification => ({
  status: "UNKNOWN",
  method: null,
  verifiedAt: null,
  actorId: null,
  evidenceSourceRecordId: null,
  expiresAt: null,
  freshnessPolicy: "UNKNOWN",
});
export function effectiveVerification(
  value: Verification,
  now: Date,
): Verification["status"] {
  return value.expiresAt && Date.parse(value.expiresAt) <= now.getTime()
    ? "EXPIRED"
    : value.status;
}
export function assertVerificationTransition(
  value: Verification,
  permissions: ReadonlySet<string>,
  now: Date,
): void {
  VerificationSchema.parse(value);
  if (!permissions.has("verify")) throw new Error("FORBIDDEN");
  if (
    value.status === "VERIFIED" &&
    (Date.parse(value.verifiedAt!) > now.getTime() ||
      effectiveVerification(value, now) === "EXPIRED")
  )
    throw new Error("INVALID_VERIFICATION_TIME");
}
export interface PublicationInput {
  name: string;
  slug: string;
  hasGeometry: boolean;
  categoryCount: number;
  sourceRecordId: string | null;
  verificationStatus: Verification["status"];
  sourceDisplayAllowed: boolean;
  blockingErrors: number;
  reviewed: boolean;
}
export function publicationErrors(input: PublicationInput): string[] {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push("NAME_REQUIRED");
  if (!input.slug) errors.push("SLUG_REQUIRED");
  if (!input.hasGeometry) errors.push("GEOMETRY_REQUIRED");
  if (!input.categoryCount) errors.push("CATEGORY_REQUIRED");
  if (!input.sourceRecordId) errors.push("SOURCE_REQUIRED");
  if (!input.sourceDisplayAllowed) errors.push("SOURCE_DISPLAY_NOT_ALLOWED");
  if (input.blockingErrors) errors.push("BLOCKING_VALIDATION");
  if (!input.reviewed) errors.push("EXPLICIT_REVIEW_REQUIRED");
  return errors;
}
