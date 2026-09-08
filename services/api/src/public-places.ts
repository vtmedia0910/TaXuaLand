import { z } from "zod";
import {
  PublicCategory,
  PublicListQuery,
  PublicPlaceDTO,
  PublicPlaceDetailDTO,
  PublicPlaceList,
} from "../../../packages/contracts/src/index";
import { Slug } from "../../../packages/domain/src/index";
import { database } from "./db";
import { AppError } from "./errors";

// Only static, developer-owned SQL fragments are composed here. User values use parameters.
const iso = (column: string) =>
  `to_char(${column} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
const allowed = (source: string, record: string) =>
  `${source}.public_display='ALLOWED' AND ${source}.status='ACTIVE' AND ${source}.archived_at IS NULL AND ${record}.archived_at IS NULL AND (${source}.provider_id IS NULL OR EXISTS(SELECT 1 FROM integration_providers provider WHERE provider.id=${source}.provider_id AND provider.enabled AND NOT provider.kill_switch))`;
const effective = (row: string) =>
  `CASE WHEN ${row}.verification_status<>'UNKNOWN' AND ${row}.expires_at<=now() THEN 'EXPIRED'::verification_status ELSE ${row}.verification_status END`;
const trust = (
  source: string,
  row?: string,
  observed = "sr.collected_at",
) => `jsonb_build_object(
 'sourceName',${source}.name,'sourceAuthority',${source}.authority_level,
 'verificationStatus',${row ? effective(row) : "'UNKNOWN'"},
 'observedAt',${iso(observed)},'verifiedAt',${row ? iso(row + ".verified_at") : "NULL"},
 'expiresAt',${row ? iso(row + ".expires_at") : "NULL"},
 'freshness',${row ? `CASE WHEN ${row}.expires_at<=now() THEN 'STALE' WHEN ${row}.verification_status='VERIFIED' AND ${row}.freshness_policy<>'UNKNOWN' THEN 'CURRENT' ELSE 'UNKNOWN' END` : "'UNKNOWN'"})`;
const media = `SELECT jsonb_build_object('id',m.id,'mediaType',m.media_type,'sourceUrl',m.source_url,'title',m.title,'altText',m.alt_text,'capturedAt',${iso("m.captured_at")}) AS dto FROM place_media m JOIN source_records mr ON mr.id=m.source_record_id JOIN sources ms ON ms.id=mr.source_id WHERE m.place_id=p.id AND ${allowed("ms", "mr")} ORDER BY m.sort_order,m.id`;
const categories = `SELECT jsonb_agg(jsonb_build_object('id',c.id,'code',c.code,'name',c.name,'color',c.color) ORDER BY c.name) FROM place_category_links pc JOIN place_categories c ON c.id=pc.category_id WHERE pc.place_id=p.id AND c.archived_at IS NULL`;
const joins = `FROM places p JOIN source_records sr ON sr.id=p.source_record_id JOIN sources s ON s.id=sr.source_id JOIN place_geometries g ON g.place_id=p.id AND g.valid_to IS NULL JOIN source_records gr ON gr.id=g.source_record_id JOIN sources gs ON gs.id=gr.source_id`;
const eligible = `p.publication_status='PUBLISHED' AND NOT p.review_required AND ${allowed("s", "sr")} AND ${allowed("gs", "gr")} AND EXISTS(SELECT 1 FROM place_category_links pc JOIN place_categories c ON c.id=pc.category_id WHERE pc.place_id=p.id AND c.archived_at IS NULL)`;
const base = `jsonb_build_object('id',p.id,'name',p.name,'slug',p.slug,'shortDescription',p.short_description,'areaName',p.area_name,'publicationStatus',p.publication_status,'categories',(${categories}),
 'location',jsonb_build_object('longitude',ST_X(g.geometry),'latitude',ST_Y(g.geometry),'locationRole',g.location_role,'verificationStatus',${effective("g")},'horizontalAccuracyMeters',g.horizontal_accuracy_m,'trust',${trust("gs", "g", "g.observed_at")}),
 'mediaSummary',coalesce((SELECT jsonb_agg(dto) FROM (${media} LIMIT 1) preview),'[]'::jsonb),
 'trust',${trust("s")},'updatedAt',${iso("p.updated_at")})`;

export async function publicPlaces(input: unknown, connection = database()) {
  const q = PublicListQuery.parse(input);
  const rows = await connection.query<{ dto: unknown }>(
    `SELECT ${base} AS dto ${joins} WHERE ${eligible} AND ($1='' OR lower(unaccent(p.name)) LIKE '%'||lower(unaccent($1))||'%' ESCAPE '\\') AND ($2::text IS NULL OR EXISTS(SELECT 1 FROM place_category_links pc JOIN place_categories c ON c.id=pc.category_id WHERE pc.place_id=p.id AND c.code=$2)) ORDER BY p.name,p.id LIMIT $3 OFFSET $4`,
    [
      q.query.replace(/[\\%_]/g, "\\$&"),
      q.category ?? null,
      q.limit + 1,
      q.offset,
    ],
  );
  return PublicPlaceList.parse({
    items: rows.rows
      .slice(0, q.limit)
      .map((row) => PublicPlaceDTO.parse(row.dto)),
    nextOffset: rows.rows.length > q.limit ? q.offset + q.limit : null,
  });
}
export async function publicPlace(slug: string, connection = database()) {
  Slug.parse(slug);
  const row = (
    await connection.query<{ dto: unknown }>(
      `SELECT ${base} || jsonb_build_object(
 'description',p.description,
 'visitContext',(SELECT jsonb_build_object('bestSeasonText',v.best_season_text,'recommendedTimeText',v.recommended_time_text,'difficulty',v.difficulty,'audienceText',v.audience_text,'guideRequirement',v.guide_requirement) FROM place_visit_contexts v WHERE v.place_id=p.id),
 'accessContext',(SELECT jsonb_build_object('accessMethodText',a.access_method_text,'roadConditionText',a.road_condition_text,'routeNote',a.route_note,'trust',${trust("acs", "a", "a.observed_at")}) FROM place_access_contexts a JOIN source_records ar ON ar.id=a.source_record_id JOIN sources acs ON acs.id=ar.source_id WHERE a.place_id=p.id AND ${allowed("acs", "ar")}),
 'safetyNotes',coalesce((SELECT jsonb_agg(jsonb_build_object('note',sn.note,'trust',${trust("sns", "sn", "sn.observed_at")}) ORDER BY sn.id) FROM place_safety_notes sn JOIN source_records snr ON snr.id=sn.source_record_id JOIN sources sns ON sns.id=snr.source_id WHERE sn.place_id=p.id AND ${allowed("sns", "snr")}),'[]'::jsonb),
 'media',coalesce((SELECT jsonb_agg(dto) FROM (${media}) all_media),'[]'::jsonb),
 'externalReferences',coalesce((SELECT jsonb_agg(jsonb_build_object('provider',e.provider,'externalUrl',e.external_url) ORDER BY e.id) FROM external_references e JOIN source_records er ON er.id=e.source_record_id JOIN sources es ON es.id=er.source_id WHERE e.subject_id=p.id AND ${allowed("es", "er")}),'[]'::jsonb)
 ) AS dto ${joins} WHERE ${eligible} AND p.slug=$1`,
      [slug],
    )
  ).rows[0];
  if (!row)
    throw new AppError("NOT_FOUND", 404, "Không tìm thấy địa điểm công khai.");
  return PublicPlaceDetailDTO.parse(row.dto);
}
export async function publicCategories(connection = database()) {
  const result = await connection.query(
    `SELECT DISTINCT c.id,c.code,c.name,c.color FROM place_categories c JOIN place_category_links pc ON pc.category_id=c.id WHERE c.archived_at IS NULL AND pc.place_id IN (SELECT p.id ${joins} WHERE ${eligible}) ORDER BY c.name`,
  );
  return z.array(PublicCategory).parse(result.rows);
}
