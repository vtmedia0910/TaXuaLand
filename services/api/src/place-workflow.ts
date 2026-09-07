import { z } from "zod";
import type { PoolClient } from "pg";
import { database, transaction } from "./db";
import { requirePermission, audit, type Actor } from "./auth";
import { AppError } from "./errors";
import { currentGeometry, spatialWarnings, type PlaceRow } from "./places";
import { VerificationStatus } from "../../../packages/domain/src/index";
import {
  VerificationSchema,
  assertVerificationTransition,
  publicationErrors,
  effectiveVerification,
} from "../../../packages/verification/src/index";

export const VerificationCommand = z
  .object({
    version: z.number().int().positive(),
    subject: z.enum(["LOCATION", "ACCESS", "SAFETY"]),
    safetyNoteId: z.uuid().optional(),
    status: z.enum(["UNKNOWN", "DECLARED", "VERIFIED"]),
    method: z.string().trim().min(1).max(200).nullable(),
    evidenceSourceRecordId: z.uuid().nullable(),
    freshnessPolicy: z.enum(["UNKNOWN", "NO_EXPIRY", "EXPIRES"]),
    expiresAt: z.iso.datetime().nullable(),
    confirmed: z.literal(true),
  })
  .strict();
export const PublishCommand = z
  .object({
    version: z.number().int().positive(),
    reviewed: z.literal(true),
    warningsAcknowledged: z.boolean(),
    acknowledgedLocationStatus: VerificationStatus,
  })
  .strict();
async function lockedPlace(client: PoolClient, id: string, version: number) {
  z.uuid().parse(id);
  const p = (
    await client.query<PlaceRow>(
      "SELECT * FROM places WHERE id=$1 FOR UPDATE",
      [id],
    )
  ).rows[0];
  if (!p) throw new AppError("NOT_FOUND", 404, "Không tìm thấy địa điểm.");
  if (p.version !== version)
    throw new AppError(
      "VERSION_CONFLICT",
      409,
      "Dữ liệu đã thay đổi. Tải lại để rà soát.",
    );
  return p;
}
export async function verifyPlace(
  actor: Actor,
  id: string,
  input: unknown,
  connection = database(),
) {
  requirePermission(actor, "verify");
  const command = VerificationCommand.parse(input);
  const now = new Date();
  const verification = VerificationSchema.parse({
    status: command.status,
    method: command.method,
    verifiedAt: command.status === "VERIFIED" ? now.toISOString() : null,
    actorId: command.status === "VERIFIED" ? actor.id : null,
    evidenceSourceRecordId: command.evidenceSourceRecordId,
    freshnessPolicy: command.freshnessPolicy,
    expiresAt: command.expiresAt,
  });
  try {
    assertVerificationTransition(verification, actor.permissions, now);
  } catch {
    throw new AppError(
      "INVALID_VERIFICATION",
      400,
      "Thời điểm xác minh và hết hạn không hợp lệ.",
    );
  }
  await transaction(async (client) => {
    await lockedPlace(client, id, command.version);
    if (command.evidenceSourceRecordId) {
      const evidence = await client.query(
        "SELECT sr.id FROM source_records sr JOIN sources s ON s.id=sr.source_id WHERE sr.id=$1 AND sr.archived_at IS NULL AND s.archived_at IS NULL AND s.status<>'DISABLED'",
        [command.evidenceSourceRecordId],
      );
      if (!evidence.rowCount)
        throw new AppError(
          "INVALID_EVIDENCE",
          400,
          "Bằng chứng không khả dụng.",
        );
    }
    if (command.subject === "LOCATION") {
      const old = await currentGeometry(client, id);
      if (!old)
        throw new AppError(
          "GEOMETRY_REQUIRED",
          409,
          "Chưa có vị trí để xác minh.",
        );
      await client.query(
        "UPDATE place_geometries SET valid_to=clock_timestamp() WHERE id=$1",
        [old.id],
      );
      await client.query(
        `INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs,location_role,verification_status,horizontal_accuracy_m,observed_at,verified_at,verified_by,verification_method,evidence_source_record_id,freshness_policy,expires_at,valid_from)
    SELECT place_id,geometry,source_record_id,source_crs,$2,$3,horizontal_accuracy_m,observed_at,$4,$5,$6,$7,$8,$9,valid_to FROM place_geometries WHERE id=$1`,
        [
          old.id,
          command.status === "VERIFIED" ? "VERIFIED" : "DECLARED",
          verification.status,
          verification.verifiedAt,
          verification.actorId,
          verification.method,
          verification.evidenceSourceRecordId,
          verification.freshnessPolicy,
          verification.expiresAt,
        ],
      );
    } else {
      const table =
        command.subject === "ACCESS"
          ? "place_access_contexts"
          : "place_safety_notes";
      if (command.subject === "SAFETY" && !command.safetyNoteId)
        throw new AppError("NOTE_REQUIRED", 400, "Chọn ghi chú cần xác minh.");
      // Preserve exact prior context, including private evidence, before changing its trust metadata.
      await client.query(
        `INSERT INTO place_content_revisions(place_id,version,actor_id,snapshot) SELECT p.id,p.version,$2,jsonb_build_object('place',to_jsonb(p),'access',(SELECT to_jsonb(a) FROM place_access_contexts a WHERE a.place_id=p.id),'safety',(SELECT jsonb_agg(to_jsonb(s)) FROM place_safety_notes s WHERE s.place_id=p.id)) FROM places p WHERE p.id=$1`,
        [id, actor.id],
      );
      const result = await client.query(
        `UPDATE ${table} SET verification_status=$2,verified_at=$3,verified_by=$4,verification_method=$5,evidence_source_record_id=$6,freshness_policy=$7,expires_at=$8 WHERE place_id=$1 ${command.subject === "SAFETY" ? "AND id=$9" : ""}`,
        [
          id,
          verification.status,
          verification.verifiedAt,
          verification.actorId,
          verification.method,
          verification.evidenceSourceRecordId,
          verification.freshnessPolicy,
          verification.expiresAt,
          ...(command.subject === "SAFETY" ? [command.safetyNoteId] : []),
        ],
      );
      if (!result.rowCount)
        throw new AppError("NOT_FOUND", 404, "Chưa có nội dung để xác minh.");
    }
    await client.query(
      "UPDATE places SET version=version+1,publication_status='DRAFT',review_required=true,updated_at=now(),updated_by=$2 WHERE id=$1",
      [id, actor.id],
    );
    await audit(client, actor, "VERIFICATION_CHANGED", "PLACE", id, {
      subject: command.subject,
      status: verification.status,
      evidenceSourceRecordId: verification.evidenceSourceRecordId,
      method: verification.method,
    });
  }, connection);
}
async function publishInTransaction(
  client: PoolClient,
  actor: Actor,
  id: string,
  command: z.infer<typeof PublishCommand>,
) {
  const p = await lockedPlace(client, id, command.version),
    g = await currentGeometry(client, id);
  const validation = await spatialWarnings(
    client,
    g ? { longitude: g.longitude, latitude: g.latitude } : null,
  );
  const sources = await client.query<{ allowed: boolean }>(
    "SELECT s.public_display='ALLOWED' AND s.status='ACTIVE' AND s.archived_at IS NULL AND sr.archived_at IS NULL AS allowed FROM source_records sr JOIN sources s ON s.id=sr.source_id WHERE sr.id=ANY($1::uuid[])",
    [[p.source_record_id, g?.source_record_id].filter(Boolean)],
  );
  const count = (
    await client.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM place_category_links pc JOIN place_categories c ON c.id=pc.category_id WHERE pc.place_id=$1 AND c.archived_at IS NULL",
      [id],
    )
  ).rows[0]!.count;
  const status = g
    ? effectiveVerification(
        {
          status: g.verification_status,
          expiresAt: g.expires_at?.toISOString() ?? null,
          method: null,
          verifiedAt: null,
          actorId: null,
          evidenceSourceRecordId: null,
          freshnessPolicy: "UNKNOWN",
        },
        new Date(),
      )
    : "UNKNOWN";
  const errors = publicationErrors({
    name: p.name,
    slug: p.slug,
    hasGeometry: !!g,
    categoryCount: count,
    sourceRecordId: p.source_record_id,
    sourceDisplayAllowed:
      sources.rows.length > 0 && sources.rows.every((s) => s.allowed),
    blockingErrors: validation.filter((w) => w.severity === "INVALID").length,
    verificationStatus: status,
    reviewed: command.reviewed,
  });
  if (command.acknowledgedLocationStatus !== status)
    errors.push("VERIFICATION_REVIEW_REQUIRED");
  if (
    validation.some((w) => w.severity === "WARNING") &&
    !command.warningsAcknowledged
  )
    errors.push("WARNINGS_REQUIRE_ACKNOWLEDGEMENT");
  if (p.publication_status === "ARCHIVED") errors.push("ARCHIVED_PLACE");
  if (errors.length)
    throw new AppError(
      "PUBLICATION_GATE",
      409,
      `Chưa thể xuất bản: ${errors.join(", ")}. ${validation.map((v) => v.message).join(" ")}`,
    );
  await client.query(
    "UPDATE places SET publication_status='PUBLISHED',review_required=false,version=version+1,updated_by=$2,updated_at=now() WHERE id=$1",
    [id, actor.id],
  );
  await audit(client, actor, "PLACE_PUBLISHED", "PLACE", id, {
    locationStatus: status,
    warnings: validation.map((w) => w.code),
    reviewedVersion: p.version,
  });
}
export async function publishPlace(
  actor: Actor,
  id: string,
  input: unknown,
  connection = database(),
) {
  requirePermission(actor, "publish");
  const command = PublishCommand.parse(input);
  return transaction(
    (client) => publishInTransaction(client, actor, id, command),
    connection,
  );
}
export const BulkCommand = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("ARCHIVE"),
      confirmed: z.literal(true),
      items: z
        .array(
          z
            .object({ id: z.uuid(), version: z.number().int().positive() })
            .strict(),
        )
        .min(1)
        .max(50),
    })
    .strict(),
  z
    .object({
      action: z.literal("PUBLISH"),
      confirmed: z.literal(true),
      items: z
        .array(PublishCommand.extend({ id: z.uuid() }))
        .min(1)
        .max(50),
    })
    .strict(),
]);
export async function bulkPlaces(
  actor: Actor,
  input: unknown,
  connection = database(),
) {
  const command = BulkCommand.parse(input);
  requirePermission(actor, command.action === "PUBLISH" ? "publish" : "edit");
  if (new Set(command.items.map((i) => i.id)).size !== command.items.length)
    throw new AppError("DUPLICATE_SELECTION", 400, "Địa điểm được chọn trùng.");
  await transaction(async (client) => {
    for (const item of [...command.items].sort((a, b) =>
      a.id.localeCompare(b.id),
    )) {
      if (command.action === "PUBLISH") {
        const { id, ...publication } = item;
        await publishInTransaction(
          client,
          actor,
          id,
          PublishCommand.parse(publication),
        );
      } else {
        await lockedPlace(client, item.id, item.version);
        await client.query(
          "UPDATE places SET publication_status='ARCHIVED',version=version+1,updated_at=now(),updated_by=$2 WHERE id=$1",
          [item.id, actor.id],
        );
        await audit(client, actor, "PLACE_ARCHIVED", "PLACE", item.id, {
          bulk: true,
        });
      }
    }
  }, connection);
}
export async function evidenceRecords(actor: Actor, sourceId: string) {
  requirePermission(actor, "read");
  z.uuid().parse(sourceId);
  return (
    await database().query<{
      id: string;
      collected_at: Date | null;
      imported_at: Date;
      external_record_id: string | null;
      notes: string;
    }>(
      "SELECT id,collected_at,imported_at,external_record_id,notes FROM source_records WHERE source_id=$1 AND archived_at IS NULL ORDER BY imported_at DESC LIMIT 100",
      [sourceId],
    )
  ).rows;
}
