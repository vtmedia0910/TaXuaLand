import { createHash } from "node:crypto";
import { z } from "zod";
import type { PoolClient } from "pg";
import { database, transaction } from "./db";
import { audit, requirePermission, type Actor } from "./auth";
import { AppError } from "./errors";
import { AdminListInput, PlaceInput } from "./place-input";
import { Wgs84Position } from "../../../packages/spatial-types/src/index";
type Db = ReturnType<typeof database>;
export interface GeometryRow {
  id: string;
  longitude: number;
  latitude: number;
  horizontal_accuracy_m: number | null;
  verification_status: "UNKNOWN" | "DECLARED" | "VERIFIED" | "EXPIRED";
  source_record_id: string;
  verified_at: Date | null;
  verified_by: string | null;
  verification_method: string | null;
  expires_at: Date | null;
  valid_from: Date;
  valid_to: Date | null;
  location_role: "DECLARED" | "OBSERVED" | "VERIFIED";
}
export interface PlaceRow {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  area_name: string;
  publication_status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  source_record_id: string | null;
  internal_notes: string;
  review_required: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
}
export async function currentGeometry(
  client: PoolClient | Db,
  id: string,
): Promise<GeometryRow | null> {
  return (
    (
      await client.query<GeometryRow>(
        "SELECT *,ST_X(geometry) AS longitude,ST_Y(geometry) AS latitude FROM place_geometries WHERE place_id=$1 AND valid_to IS NULL",
        [id],
      )
    ).rows[0] ?? null
  );
}
export async function spatialWarnings(
  client: PoolClient | Db,
  position: Wgs84Position | null,
): Promise<
  Array<{ code: string; severity: "WARNING" | "INVALID"; message: string }>
> {
  if (!position)
    return [
      {
        code: "MISSING_COORDINATE",
        severity: "INVALID",
        message: "Chưa có tọa độ; không thể xuất bản trên bản đồ.",
      },
    ];
  const result = await client.query<{
    inside: boolean;
    outside_policy: "WARNING" | "INVALID";
    version: string;
  }>(
    "SELECT ST_Covers(boundary,ST_SetSRID(ST_MakePoint($1,$2),4326)) AS inside,outside_policy,version FROM areas_of_interest WHERE active",
    [position.longitude, position.latitude],
  );
  if (!result.rows[0])
    return [
      {
        code: "AOI_NOT_CONFIGURED",
        severity: "INVALID",
        message: "Chưa cấu hình AOI để kiểm tra vị trí.",
      },
    ];
  return result.rows[0].inside
    ? []
    : [
        {
          code: "OUTSIDE_AOI",
          severity: result.rows[0].outside_policy,
          message: `Điểm ngoài AOI ${result.rows[0].version}. Cần kiểm tra.`,
        },
      ];
}
export async function listPlaces(
  actor: Actor,
  input: unknown,
  connection = database(),
) {
  requirePermission(actor, "read");
  const q = AdminListInput.parse(input),
    values: unknown[] = [];
  const where: string[] = [];
  function filter(sql: string, value: unknown) {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  }
  if (q.query)
    filter(
      "lower(unaccent(p.name)) LIKE '%'||lower(unaccent(?))||'%'",
      q.query,
    );
  if (q.publicationStatus)
    filter("p.publication_status=?", q.publicationStatus);
  if (q.categoryId)
    filter(
      "EXISTS(SELECT 1 FROM place_category_links c WHERE c.place_id=p.id AND c.category_id=?)",
      q.categoryId,
    );
  if (q.sourceId) filter("sr.source_id=?", q.sourceId);
  if (q.verificationStatus)
    filter(
      "coalesce(CASE WHEN g.verification_status<>'UNKNOWN' AND g.expires_at<=now() THEN 'EXPIRED'::verification_status ELSE g.verification_status END,'UNKNOWN')=?",
      q.verificationStatus,
    );
  if (q.missingCoordinate) where.push("g.id IS NULL");
  if (q.stale) where.push("(g.expires_at<=now())");
  values.push(q.limit, q.offset);
  return (
    await connection.query<
      PlaceRow & {
        verification_status: string;
        longitude: number | null;
        latitude: number | null;
        source_name: string | null;
      }
    >(
      `SELECT p.*,coalesce(CASE WHEN g.verification_status<>'UNKNOWN' AND g.expires_at<=now() THEN 'EXPIRED'::verification_status ELSE g.verification_status END,'UNKNOWN') AS verification_status,ST_X(g.geometry) AS longitude,ST_Y(g.geometry) AS latitude,s.name AS source_name FROM places p LEFT JOIN place_geometries g ON g.place_id=p.id AND g.valid_to IS NULL LEFT JOIN source_records sr ON sr.id=p.source_record_id LEFT JOIN sources s ON s.id=sr.source_id ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY p.updated_at DESC,p.id LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    )
  ).rows;
}
export async function getPlace(
  actor: Actor,
  id: string,
  connection = database(),
) {
  requirePermission(actor, "read");
  z.uuid().parse(id);
  const place = (
    await connection.query<PlaceRow>("SELECT * FROM places WHERE id=$1", [id])
  ).rows[0];
  if (!place) throw new AppError("NOT_FOUND", 404, "Không tìm thấy địa điểm.");
  const geometry = await currentGeometry(connection, id);
  const source = place.source_record_id
    ? (
        await connection.query<{
          source_id: string;
          collected_at: Date | null;
        }>("SELECT source_id,collected_at FROM source_records WHERE id=$1", [
          place.source_record_id,
        ])
      ).rows[0]
    : null;
  const [categories, visit, access, safety, media, external, history, events] =
    await Promise.all([
      connection.query<{ category_id: string }>(
        "SELECT category_id FROM place_category_links WHERE place_id=$1",
        [id],
      ),
      connection.query(
        'SELECT best_season_text AS "bestSeasonText",recommended_time_text AS "recommendedTimeText",difficulty,audience_text AS "audienceText",guide_requirement AS "guideRequirement" FROM place_visit_contexts WHERE place_id=$1',
        [id],
      ),
      connection.query(
        'SELECT access_method_text AS "accessMethodText",road_condition_text AS "roadConditionText",route_note AS "routeNote",observed_at AS "observedAt",verification_status FROM place_access_contexts WHERE place_id=$1',
        [id],
      ),
      connection.query(
        'SELECT note,observed_at AS "observedAt",expires_at AS "expiresAt",verification_status FROM place_safety_notes WHERE place_id=$1',
        [id],
      ),
      connection.query(
        'SELECT media_type AS "mediaType",source_url AS "sourceUrl",title,alt_text AS "altText",captured_at AS "capturedAt" FROM place_media WHERE place_id=$1 ORDER BY sort_order',
        [id],
      ),
      connection.query(
        'SELECT provider,external_url AS "externalUrl" FROM external_references WHERE subject_id=$1',
        [id],
      ),
      connection.query<GeometryRow>(
        "SELECT *,ST_X(geometry) AS longitude,ST_Y(geometry) AS latitude FROM place_geometries WHERE place_id=$1 ORDER BY valid_from DESC",
        [id],
      ),
      connection.query(
        "SELECT action,actor_id,created_at,correlation_id FROM audit_events WHERE subject_id=$1 ORDER BY created_at DESC LIMIT 30",
        [id],
      ),
    ]);
  const cleanAccess = access.rows[0]
    ? Object.fromEntries(
        Object.entries(access.rows[0]).filter(
          ([key]) => key !== "verification_status",
        ),
      )
    : undefined;
  const cleanSafety = safety.rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).filter(([key]) => key !== "verification_status"),
    ),
  );
  // Date values become ISO at this boundary; administrative input is validated on round-trip.
  const data = PlaceInput.parse(
    JSON.parse(
      JSON.stringify({
        name: place.name,
        slug: place.slug,
        shortDescription: place.short_description,
        description: place.description,
        areaName: place.area_name,
        internalNotes: place.internal_notes,
        sourceId: source?.source_id ?? null,
        sourceObservedAt: source?.collected_at ?? null,
        location: geometry
          ? { longitude: geometry.longitude, latitude: geometry.latitude }
          : null,
        horizontalAccuracyMeters: geometry?.horizontal_accuracy_m ?? null,
        categoryIds: categories.rows.map((c) => c.category_id),
        visitContext: visit.rows[0],
        accessContext: cleanAccess,
        safetyNotes: cleanSafety,
        media: media.rows,
        externalReferences: external.rows,
      }),
    ),
  );
  return {
    place,
    data,
    geometry,
    geometryEffectiveStatus:
      geometry?.verification_status === "UNKNOWN"
        ? "UNKNOWN"
        : geometry?.expires_at && geometry.expires_at <= new Date()
          ? "EXPIRED"
          : (geometry?.verification_status ?? "UNKNOWN"),
    geometryHistory: history.rows,
    audit: events.rows,
    warnings: await spatialWarnings(connection, data.location),
    accessVerification: access.rows[0]?.verification_status ?? "UNKNOWN",
    safetyVerification: safety.rows.map((r) => r.verification_status),
    verificationRecords: (
      await connection.query(
        "SELECT 'ACCESS' AS subject,place_id AS id,verification_status,verified_at,verification_method,evidence_source_record_id,freshness_policy,expires_at FROM place_access_contexts WHERE place_id=$1 UNION ALL SELECT 'SAFETY',id,verification_status,verified_at,verification_method,evidence_source_record_id,freshness_policy,expires_at FROM place_safety_notes WHERE place_id=$1",
        [id],
      )
    ).rows,
    nearbyRoad: geometry
      ? ((
          await connection.query<{
            name: string | null;
            distance_m: number;
            version: string;
          }>(
            "SELECT rs.name,ST_Distance(rs.geometry::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS distance_m,r.version FROM road_segments rs JOIN dataset_releases r ON r.id=rs.release_id WHERE r.qa_status='PUBLISHED' AND ST_DWithin(rs.geometry::geography,ST_SetSRID(ST_MakePoint($1,$2),4326)::geography,5000) ORDER BY distance_m LIMIT 1",
            [geometry.longitude, geometry.latitude],
          )
        ).rows[0] ?? null)
      : null,
  };
}
/** Shared transaction primitive for manual edits and explicit import commit. Caller supplies permission checks. */
export async function savePlaceInTransaction(
  client: PoolClient,
  actor: Actor,
  data: PlaceInput,
  existing: { id: string; version: number } | null,
  importSourceRecordId?: string,
): Promise<string> {
  const prior = existing
    ? (
        await client.query<PlaceRow>(
          "SELECT * FROM places WHERE id=$1 FOR UPDATE",
          [existing.id],
        )
      ).rows[0]
    : null;
  if (existing && !prior)
    throw new AppError("NOT_FOUND", 404, "Không tìm thấy địa điểm.");
  if (prior && prior.version !== existing!.version)
    throw new AppError(
      "VERSION_CONFLICT",
      409,
      "Dữ liệu đã thay đổi. Tải lại trước khi lưu.",
    );
  const oldGeometry = prior ? await currentGeometry(client, prior.id) : null;
  const geometryChanged =
    Boolean(oldGeometry) !== Boolean(data.location) ||
    Boolean(
      oldGeometry &&
      data.location &&
      (oldGeometry.longitude !== data.location.longitude ||
        oldGeometry.latitude !== data.location.latitude ||
        oldGeometry.horizontal_accuracy_m !== data.horizontalAccuracyMeters),
    );
  if (prior && geometryChanged && !data.geometryChangeConfirmed)
    throw new AppError(
      "GEOMETRY_CONFIRMATION_REQUIRED",
      409,
      "Xác nhận thay đổi vị trí trước khi lưu.",
    );
  let recordId = importSourceRecordId ?? null;
  if (data.sourceId) {
    const source = (
      await client.query<{ id: string }>(
        "SELECT id FROM sources WHERE id=$1 AND archived_at IS NULL AND status<>'DISABLED'",
        [data.sourceId],
      )
    ).rows[0];
    if (!source)
      throw new AppError("INVALID_SOURCE", 400, "Nguồn không khả dụng.");
    if (!recordId)
      recordId = (
        await client.query<{ id: string }>(
          "INSERT INTO source_records(source_id,collected_at,raw_payload_hash,notes) VALUES($1,$2,$3,$4) RETURNING id",
          [
            data.sourceId,
            data.sourceObservedAt,
            createHash("sha256").update(JSON.stringify(data)).digest("hex"),
            "Manual admin entry",
          ],
        )
      ).rows[0]!.id;
  }
  const categories = await client.query<{ id: string }>(
    "SELECT id FROM place_categories WHERE id=ANY($1::uuid[]) AND archived_at IS NULL",
    [data.categoryIds],
  );
  if (categories.rowCount !== data.categoryIds.length)
    throw new AppError("INVALID_CATEGORY", 400, "Danh mục không khả dụng.");
  const args = [
    data.name,
    data.slug,
    data.shortDescription,
    data.description,
    data.areaName,
    data.internalNotes,
    recordId,
    actor.id,
  ];
  if (prior)
    await client.query(
      `INSERT INTO place_content_revisions(place_id,version,actor_id,snapshot) SELECT p.id,p.version,$2,jsonb_build_object('place',to_jsonb(p),'visit',(SELECT to_jsonb(v) FROM place_visit_contexts v WHERE v.place_id=p.id),'access',(SELECT to_jsonb(a) FROM place_access_contexts a WHERE a.place_id=p.id),'safety',(SELECT jsonb_agg(to_jsonb(s)) FROM place_safety_notes s WHERE s.place_id=p.id),'media',(SELECT jsonb_agg(to_jsonb(m)) FROM place_media m WHERE m.place_id=p.id),'references',(SELECT jsonb_agg(to_jsonb(e)) FROM external_references e WHERE e.subject_id=p.id)) FROM places p WHERE p.id=$1`,
      [prior.id, actor.id],
    );
  const id = prior
    ? prior.id
    : (
        await client.query<{ id: string }>(
          "INSERT INTO places(name,slug,short_description,description,area_name,internal_notes,source_record_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id",
          args,
        )
      ).rows[0]!.id;
  if (prior)
    await client.query(
      "UPDATE places SET name=$1,slug=$2,short_description=$3,description=$4,area_name=$5,internal_notes=$6,source_record_id=$7,updated_by=$8,updated_at=now(),version=version+1,publication_status='DRAFT',review_required=true WHERE id=$9",
      [...args, id],
    );
  // Imported observations never inherit verification from an older observation,
  // even when their coordinate numbers happen to match.
  if (geometryChanged || (importSourceRecordId && data.location)) {
    if (oldGeometry)
      await client.query(
        "UPDATE place_geometries SET valid_to=clock_timestamp() WHERE id=$1",
        [oldGeometry.id],
      );
    if (data.location && recordId)
      await client.query(
        "INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs,horizontal_accuracy_m,observed_at) VALUES($1,ST_SetSRID(ST_MakePoint($2,$3),4326),$4,'EPSG:4326',$5,$6)",
        [
          id,
          data.location.longitude,
          data.location.latitude,
          recordId,
          data.horizontalAccuracyMeters,
          data.sourceObservedAt,
        ],
      );
    await audit(client, actor, "GEOMETRY_CHANGED", "PLACE", id, {
      previousGeometryId: oldGeometry?.id ?? null,
      verificationStatus: "UNKNOWN",
    });
  }
  await client.query("DELETE FROM place_category_links WHERE place_id=$1", [
    id,
  ]);
  for (const categoryId of data.categoryIds)
    await client.query(
      "INSERT INTO place_category_links(place_id,category_id) VALUES($1,$2)",
      [id, categoryId],
    );
  const v = data.visitContext;
  await client.query(
    "INSERT INTO place_visit_contexts(place_id,best_season_text,recommended_time_text,difficulty,audience_text,guide_requirement) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(place_id) DO UPDATE SET best_season_text=$2,recommended_time_text=$3,difficulty=$4,audience_text=$5,guide_requirement=$6",
    [
      id,
      v.bestSeasonText,
      v.recommendedTimeText,
      v.difficulty,
      v.audienceText,
      v.guideRequirement,
    ],
  );
  for (const table of [
    "place_access_contexts",
    "place_safety_notes",
    "place_media",
  ] as const)
    await client.query(`DELETE FROM ${table} WHERE place_id=$1`, [id]);
  await client.query("DELETE FROM external_references WHERE subject_id=$1", [
    id,
  ]);
  if (recordId) {
    const a = data.accessContext;
    await client.query(
      "INSERT INTO place_access_contexts(place_id,access_method_text,road_condition_text,route_note,source_record_id,observed_at) VALUES($1,$2,$3,$4,$5,$6)",
      [
        id,
        a.accessMethodText,
        a.roadConditionText,
        a.routeNote,
        recordId,
        a.observedAt,
      ],
    );
    for (const s of data.safetyNotes)
      await client.query(
        "INSERT INTO place_safety_notes(place_id,note,source_record_id,observed_at,expires_at) VALUES($1,$2,$3,$4,$5)",
        [id, s.note, recordId, s.observedAt, s.expiresAt],
      );
    for (const [i, m] of data.media.entries())
      await client.query(
        "INSERT INTO place_media(place_id,media_type,source_url,title,alt_text,sort_order,source_record_id,captured_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          id,
          m.mediaType,
          m.sourceUrl,
          m.title,
          m.altText,
          i,
          recordId,
          m.capturedAt,
        ],
      );
    for (const e of data.externalReferences)
      await client.query(
        "INSERT INTO external_references(subject_id,provider,external_url,source_record_id) VALUES($1,$2,$3,$4)",
        [id, e.provider, e.externalUrl, recordId],
      );
  }
  await audit(
    client,
    actor,
    prior ? "PLACE_UPDATED" : "PLACE_CREATED",
    "PLACE",
    id,
    {
      sourceRecordId: recordId,
      publicationStatus: "DRAFT",
      previousVersion: prior?.version ?? null,
    },
  );
  return id;
}
export async function savePlace(
  actor: Actor,
  input: unknown,
  existing: { id: string; version: number } | null,
  connection = database(),
) {
  requirePermission(actor, "edit");
  const data = PlaceInput.parse(input);
  try {
    return await transaction(
      (client) => savePlaceInTransaction(client, actor, data, existing),
      connection,
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    )
      throw new AppError("DUPLICATE_SLUG", 409, "Slug đã tồn tại.");
    throw error;
  }
}
export async function archivePlace(
  actor: Actor,
  id: string,
  version: number,
  connection = database(),
) {
  requirePermission(actor, "edit");
  z.uuid().parse(id);
  await transaction(async (client) => {
    const result = await client.query(
      "UPDATE places SET publication_status='ARCHIVED',updated_at=now(),updated_by=$1,version=version+1 WHERE id=$2 AND version=$3 RETURNING id",
      [actor.id, id, version],
    );
    if (!result.rowCount)
      throw new AppError("VERSION_CONFLICT", 409, "Địa điểm đã thay đổi.");
    await audit(client, actor, "PLACE_ARCHIVED", "PLACE", id);
  }, connection);
}
