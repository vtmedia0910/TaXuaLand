import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "../infra/migrate";
import {
  publicPlace,
  publicPlaceMarkers,
  publicPlaces,
} from "../services/api/src/public-places";

const connection = process.env.DATABASE_TEST_URL;

it("rejects bbox request strings before any SQL runs", async () => {
  let queried = false;
  const fakeConnection = {
    query: async () => {
      queried = true;
      throw new Error("SQL should not run");
    },
  };
  await expect(
    publicPlaceMarkers(
      {
        west: "104.45); SELECT pg_sleep(10); --",
        south: "21.20",
        east: "104.62",
        north: "21.35",
      },
      fakeConnection as never,
    ),
  ).rejects.toThrow();
  expect(queried).toBe(false);
});

describe.skipIf(!connection)(
  "public Place marker projection with PostGIS",
  () => {
    let owner: InstanceType<typeof pg.Client>;
    let pool: InstanceType<typeof pg.Pool>;
    let actorId: string;
    let categoryId: string;
    let alternateCategoryId: string;
    const dbName = `land_test_${randomUUID().replaceAll("-", "")}`;

    beforeAll(async () => {
      owner = new pg.Client({ connectionString: connection! });
      await owner.connect();
      await owner.query(`CREATE DATABASE "${dbName}"`);
      const url = new URL(connection!);
      url.pathname = `/${dbName}`;
      pool = new pg.Pool({ connectionString: url.toString() });
      await migrate(pool);
      actorId = (
        await pool.query<{ id: string }>(
          "INSERT INTO admin_users(email,password_hash) VALUES('markers@example.invalid','unusable-test-hash') RETURNING id",
        )
      ).rows[0]!.id;
      await pool.query(
        "INSERT INTO areas_of_interest(name,version,source,boundary,outside_policy,active) VALUES('Synthetic marker coverage','MARKER-QA-001','Synthetic test coverage; not a factual boundary',ST_MakeEnvelope(104.45,21.20,104.62,21.35,4326),'WARNING',true)",
      );
      const categories = await pool.query<{ id: string; code: string }>(
        "INSERT INTO place_categories(code,name,color) VALUES('Z_TEST','Zulu','#112233'),('A_TEST','Alpha','#445566') RETURNING id,code",
      );
      categoryId = categories.rows.find(({ code }) => code === "Z_TEST")!.id;
      alternateCategoryId = categories.rows.find(
        ({ code }) => code === "A_TEST",
      )!.id;
    }, 30000);

    afterAll(async () => {
      await pool?.end();
      if (owner) {
        await owner.query(`DROP DATABASE IF EXISTS "${dbName}"`);
        await owner.end();
      }
    });

    async function addMarker(
      slug: string,
      options: {
        publicationStatus?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
        reviewRequired?: boolean;
        contentRecordArchived?: boolean;
        contentSourceArchived?: boolean;
        contentSourceStatus?: string;
        contentPublicDisplay?: "ALLOWED" | "DENIED" | "UNKNOWN";
        contentSourceAcceptance?:
          "OWNER_APPROVED" | "SOURCE_APPROVED" | "REJECTED" | null;
        contentProviderState?: "ENABLED" | "DISABLED" | "KILLED";
        geometry?: "CURRENT" | "HISTORICAL" | "MISSING";
        geometryRecordArchived?: boolean;
        geometrySourceArchived?: boolean;
        geometrySourceStatus?: string;
        geometryPublicDisplay?: "ALLOWED" | "DENIED" | "UNKNOWN";
        geometrySourceAcceptance?:
          "OWNER_APPROVED" | "SOURCE_APPROVED" | "REJECTED" | null;
        geometryProviderRightsStatus?:
          "ALLOWED" | "RESTRICTED" | "REVIEW_REQUIRED" | "UNKNOWN";
        geometryProviderState?: "ENABLED" | "DISABLED" | "KILLED";
        locationRole?: "DECLARED" | "OBSERVED" | "VERIFIED";
        verificationStatus?: "UNKNOWN" | "DECLARED";
        horizontalAccuracyMeters?: number | null;
        category?: "ACTIVE" | "ARCHIVED" | "MISSING" | "MULTIPLE";
        longitude?: number;
        latitude?: number;
      } = {},
    ) {
      const provider = async (
        state: "ENABLED" | "DISABLED" | "KILLED" | undefined,
      ) => {
        if (!state) return null;
        const id = `marker_${randomUUID()}`;
        await pool.query(
          "INSERT INTO integration_providers(id,type,enabled,kill_switch) VALUES($1,'STORAGE',$2,$3)",
          [id, state !== "DISABLED", state === "KILLED"],
        );
        return id;
      };
      const contentSource = (
        await pool.query<{ id: string }>(
          "INSERT INTO sources(name,category,status,public_display,source_acceptance,provider_id,archived_at) VALUES($1,'PLACES',$2,$3,$4,$5,$6) RETURNING id",
          [
            `${slug} content`,
            options.contentSourceStatus ?? "ACTIVE",
            options.contentPublicDisplay ?? "ALLOWED",
            options.contentSourceAcceptance ?? null,
            await provider(options.contentProviderState),
            options.contentSourceArchived ? new Date() : null,
          ],
        )
      ).rows[0]!.id;
      const geometrySource = (
        await pool.query<{ id: string }>(
          "INSERT INTO sources(name,category,status,public_display,source_acceptance,provider_rights_status,provider_id,archived_at) VALUES($1,'PLACES',$2,$3,$4,$5,$6,$7) RETURNING id",
          [
            `${slug} geometry`,
            options.geometrySourceStatus ?? "ACTIVE",
            options.geometryPublicDisplay ?? "ALLOWED",
            options.geometrySourceAcceptance ?? null,
            options.geometryProviderRightsStatus ?? "UNKNOWN",
            await provider(options.geometryProviderState),
            options.geometrySourceArchived ? new Date() : null,
          ],
        )
      ).rows[0]!.id;
      const contentRecord = (
        await pool.query<{ id: string }>(
          "INSERT INTO source_records(source_id,raw_payload_hash,archived_at) VALUES($1,$2,$3) RETURNING id",
          [
            contentSource,
            "a".repeat(64),
            options.contentRecordArchived ? new Date() : null,
          ],
        )
      ).rows[0]!.id;
      const geometryRecord = (
        await pool.query<{ id: string }>(
          "INSERT INTO source_records(source_id,raw_payload_hash,archived_at) VALUES($1,$2,$3) RETURNING id",
          [
            geometrySource,
            "b".repeat(64),
            options.geometryRecordArchived ? new Date() : null,
          ],
        )
      ).rows[0]!.id;
      const placeId = (
        await pool.query<{ id: string }>(
          "INSERT INTO places(name,slug,source_record_id,created_by,updated_by,publication_status,review_required,internal_notes) VALUES($1,$2,$3,$4,$4,$5,$6,'PRIVATE_MARKER_FIXTURE') RETURNING id",
          [
            `Marker ${slug}`,
            slug,
            contentRecord,
            actorId,
            options.publicationStatus ?? "PUBLISHED",
            options.reviewRequired ?? false,
          ],
        )
      ).rows[0]!.id;
      if ((options.geometry ?? "CURRENT") !== "MISSING")
        await pool.query(
          "INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs,location_role,verification_status,horizontal_accuracy_m,valid_from,valid_to) VALUES($1,ST_SetSRID(ST_MakePoint($2,$3),4326),$4,'EPSG:4326',$5,$6,$7,$8,$9)",
          [
            placeId,
            options.longitude ?? 104.47,
            options.latitude ?? 21.22,
            geometryRecord,
            options.locationRole ?? "DECLARED",
            options.verificationStatus ?? "UNKNOWN",
            options.horizontalAccuracyMeters ?? null,
            options.geometry === "HISTORICAL"
              ? new Date(Date.now() - 2_000)
              : new Date(),
            options.geometry === "HISTORICAL"
              ? new Date(Date.now() - 1_000)
              : null,
          ],
        );
      if ((options.category ?? "ACTIVE") !== "MISSING") {
        let linkedCategory = categoryId;
        if (options.category === "ARCHIVED")
          linkedCategory = (
            await pool.query<{ id: string }>(
              "INSERT INTO place_categories(code,name,archived_at) VALUES($1,$2,now()) RETURNING id",
              [`ARCHIVED_${slug.toUpperCase()}`, `Archived ${slug}`],
            )
          ).rows[0]!.id;
        await pool.query("INSERT INTO place_category_links VALUES($1,$2)", [
          placeId,
          linkedCategory,
        ]);
        if (options.category === "MULTIPLE")
          await pool.query("INSERT INTO place_category_links VALUES($1,$2)", [
            placeId,
            alternateCategoryId,
          ]);
      }
      return placeId;
    }

    async function addBulk(prefix: string, count: number, longitude: number) {
      const source = (
        await pool.query<{ id: string }>(
          "INSERT INTO sources(name,category,status,public_display) VALUES($1,'PLACES','ACTIVE','ALLOWED') RETURNING id",
          [`${prefix} source`],
        )
      ).rows[0]!.id;
      const record = (
        await pool.query<{ id: string }>(
          "INSERT INTO source_records(source_id,raw_payload_hash) VALUES($1,$2) RETURNING id",
          [source, "c".repeat(64)],
        )
      ).rows[0]!.id;
      await pool.query(
        `WITH inserted AS (
        INSERT INTO places(name,slug,source_record_id,created_by,updated_by,publication_status,review_required)
        SELECT $1||' '||n,$1||'-'||lpad(n::text,3,'0'),$2,$3,$3,'PUBLISHED',false FROM generate_series(1,$4) n
        RETURNING id,slug
      ), geometries AS (
        INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs)
        SELECT id,ST_SetSRID(ST_MakePoint($5,21.30),4326),$2,'EPSG:4326' FROM inserted RETURNING place_id
      )
      INSERT INTO place_category_links(place_id,category_id) SELECT place_id,$6 FROM geometries`,
        [prefix, record, actorId, count, longitude, categoryId],
      );
    }

    it("fails closed for invalid/outside bbox and starts with zero markers", async () => {
      expect(
        await publicPlaceMarkers(
          { west: 104.45, south: 21.2, east: 104.46, north: 21.21 },
          pool,
        ),
      ).toMatchObject({ items: [], truncated: false, nextOffset: null });
      for (const input of [
        { west: NaN, south: 21.2, east: 104.6, north: 21.3 },
        { west: 104.6, south: 21.2, east: 104.5, north: 21.3 },
        { west: 104.5, south: 21.3, east: 104.6, north: 21.2 },
        { west: "0 OR 1=1", south: 21.2, east: 104.6, north: 21.3 },
      ])
        await expect(publicPlaceMarkers(input, pool)).rejects.toThrow();
      await expect(
        publicPlaceMarkers({ west: 0, south: 0, east: 1, north: 1 }, pool),
      ).rejects.toMatchObject({ code: "BBOX_OUTSIDE_AOI" });
      await pool.query(
        "UPDATE areas_of_interest SET outside_policy='INVALID' WHERE active",
      );
      await expect(
        publicPlaceMarkers(
          { west: 104.44, south: 21.2, east: 104.46, north: 21.21 },
          pool,
        ),
      ).rejects.toMatchObject({ code: "BBOX_OUTSIDE_AOI" });
      await pool.query(
        "UPDATE areas_of_interest SET outside_policy='WARNING' WHERE active",
      );
    });

    it("reuses every public eligibility gate and returns only public-safe marker fields", async () => {
      const eligible = await addMarker("eligible", { category: "MULTIPLE" });
      await addMarker("draft", { publicationStatus: "DRAFT" });
      await addMarker("archived", { publicationStatus: "ARCHIVED" });
      await addMarker("review", { reviewRequired: true });
      await addMarker("content-record-archived", {
        contentRecordArchived: true,
      });
      await addMarker("content-source-archived", {
        contentSourceArchived: true,
      });
      await addMarker("content-source-disabled", {
        contentSourceStatus: "DISABLED",
      });
      await addMarker("content-display-denied", {
        contentPublicDisplay: "DENIED",
      });
      await addMarker("content-provider-killed", {
        contentProviderState: "KILLED",
      });
      await addMarker("content-provider-disabled", {
        contentProviderState: "DISABLED",
      });
      await addMarker("geometry-missing", { geometry: "MISSING" });
      await addMarker("geometry-historical", { geometry: "HISTORICAL" });
      await addMarker("geometry-record-archived", {
        geometryRecordArchived: true,
      });
      await addMarker("geometry-source-archived", {
        geometrySourceArchived: true,
      });
      await addMarker("geometry-source-disabled", {
        geometrySourceStatus: "DISABLED",
      });
      await addMarker("geometry-display-denied", {
        geometryPublicDisplay: "DENIED",
      });
      await addMarker("geometry-provider-killed", {
        geometryProviderState: "KILLED",
      });
      await addMarker("geometry-provider-disabled", {
        geometryProviderState: "DISABLED",
      });
      await addMarker("category-missing", { category: "MISSING" });
      await addMarker("category-archived", { category: "ARCHIVED" });

      const result = await publicPlaceMarkers(
        { west: 104.46, south: 21.21, east: 104.48, north: 21.23 },
        pool,
      );
      expect(result.items.map(({ id }) => id)).toEqual([eligible]);
      expect(result.items[0]).toEqual({
        id: eligible,
        slug: "eligible",
        name: "Marker eligible",
        position: { longitude: 104.47, latitude: 21.22 },
        presentationCategory: {
          id: alternateCategoryId,
          code: "A_TEST",
          name: "Alpha",
          color: "#445566",
        },
      });
      expect(JSON.stringify(result)).not.toMatch(
        /PRIVATE_MARKER_FIXTURE|source_record|sourceAcceptance|source_acceptance|providerRightsStatus|provider_rights_status|provider|internal|audit|actor|evidence|publicationStatus/,
      );
    });

    it("allows only approved current geometry while keeping content and child rights strict", async () => {
      const ownerReview = await addMarker("adr-owner-review", {
        geometryPublicDisplay: "UNKNOWN",
        geometrySourceAcceptance: "OWNER_APPROVED",
        geometryProviderRightsStatus: "REVIEW_REQUIRED",
        locationRole: "DECLARED",
        verificationStatus: "UNKNOWN",
        horizontalAccuracyMeters: null,
      });
      const ownerUnknown = await addMarker("adr-owner-unknown", {
        geometryPublicDisplay: "UNKNOWN",
        geometrySourceAcceptance: "OWNER_APPROVED",
        geometryProviderRightsStatus: "UNKNOWN",
      });
      const sourceReview = await addMarker("adr-source-review", {
        geometryPublicDisplay: "UNKNOWN",
        geometrySourceAcceptance: "SOURCE_APPROVED",
        geometryProviderRightsStatus: "REVIEW_REQUIRED",
      });
      const strict = await addMarker("adr-strict", {
        geometryPublicDisplay: "ALLOWED",
        geometrySourceAcceptance: null,
      });
      const rejected = await addMarker("adr-rejected", {
        geometryPublicDisplay: "ALLOWED",
        geometrySourceAcceptance: "REJECTED",
      });
      const restricted = await addMarker("adr-restricted", {
        geometryPublicDisplay: "ALLOWED",
        geometrySourceAcceptance: "OWNER_APPROVED",
        geometryProviderRightsStatus: "RESTRICTED",
      });
      const unaccepted = await addMarker("adr-unaccepted", {
        geometryPublicDisplay: "UNKNOWN",
        geometrySourceAcceptance: null,
      });
      const outside = await addMarker("adr-outside", {
        geometryPublicDisplay: "UNKNOWN",
        geometrySourceAcceptance: "OWNER_APPROVED",
        geometryProviderRightsStatus: "REVIEW_REQUIRED",
        longitude: 104.63,
      });
      const contentBlocked = await addMarker("adr-content-blocked", {
        contentPublicDisplay: "UNKNOWN",
        contentSourceAcceptance: "OWNER_APPROVED",
        geometryPublicDisplay: "UNKNOWN",
        geometrySourceAcceptance: "OWNER_APPROVED",
        geometryProviderRightsStatus: "REVIEW_REQUIRED",
      });
      await pool.query(
        "UPDATE places SET description='PRIVATE_UNRESOLVED_DESCRIPTION' WHERE id=$1",
        [contentBlocked],
      );

      const markers = await publicPlaceMarkers(
        { west: 104.45, south: 21.2, east: 104.62, north: 21.35 },
        pool,
      );
      const ids = new Set(markers.items.map(({ id }) => id));
      for (const id of [ownerReview, ownerUnknown, sourceReview, strict])
        expect(ids.has(id)).toBe(true);
      for (const id of [
        rejected,
        restricted,
        unaccepted,
        outside,
        contentBlocked,
      ])
        expect(ids.has(id)).toBe(false);

      const detail = await publicPlace("adr-owner-review", pool);
      expect(detail.location).toMatchObject({
        locationRole: "DECLARED",
        verificationStatus: "UNKNOWN",
        horizontalAccuracyMeters: null,
      });
      expect(JSON.stringify(detail)).not.toMatch(
        /sourceAcceptance|source_acceptance|providerRightsStatus|provider_rights_status/,
      );
      await expect(publicPlace("adr-content-blocked", pool)).rejects.toThrow(
        "công khai",
      );
      expect(
        (await publicPlaces({ query: "adr outside" }, pool)).items,
      ).toHaveLength(0);

      const unresolvedSource = (
        await pool.query<{ id: string }>(
          "INSERT INTO sources(name,category,status,public_display,source_acceptance) VALUES('ADR unresolved child content','PLACES','ACTIVE','UNKNOWN','OWNER_APPROVED') RETURNING id",
        )
      ).rows[0]!.id;
      const unresolvedRecord = (
        await pool.query<{ id: string }>(
          "INSERT INTO source_records(source_id,raw_payload_hash) VALUES($1,repeat('d',64)) RETURNING id",
          [unresolvedSource],
        )
      ).rows[0]!.id;
      await pool.query(
        "INSERT INTO place_access_contexts(place_id,access_method_text,road_condition_text,route_note,source_record_id) VALUES($1,'PRIVATE_ACCESS','PRIVATE_ROAD','PRIVATE_ROUTE',$2)",
        [ownerReview, unresolvedRecord],
      );
      await pool.query(
        "INSERT INTO place_safety_notes(place_id,note,source_record_id) VALUES($1,'PRIVATE_SAFETY',$2)",
        [ownerReview, unresolvedRecord],
      );
      await pool.query(
        "INSERT INTO place_media(place_id,media_type,source_url,alt_text,source_record_id) VALUES($1,'IMAGE','https://example.invalid/private.png','PRIVATE_MEDIA',$2)",
        [ownerReview, unresolvedRecord],
      );
      await pool.query(
        "INSERT INTO external_references(subject_id,provider,external_url,source_record_id) VALUES($1,'PRIVATE_PROVIDER','https://example.invalid/private',$2)",
        [ownerReview, unresolvedRecord],
      );
      const bounded = await publicPlace("adr-owner-review", pool);
      expect(bounded.accessContext).toBeNull();
      expect(bounded.safetyNotes).toEqual([]);
      expect(bounded.media).toEqual([]);
      expect(bounded.externalReferences).toEqual([]);
      expect(JSON.stringify(bounded)).not.toMatch(
        /PRIVATE_ACCESS|PRIVATE_ROAD|PRIVATE_ROUTE|PRIVATE_SAFETY|PRIVATE_MEDIA|PRIVATE_PROVIDER/,
      );
    });

    it("uses inclusive bbox edges, clamps WARNING bounds, and makes the 100 limit explicit", async () => {
      const edgeIds = await Promise.all([
        addMarker("edge-sw", { longitude: 104.49, latitude: 21.24 }),
        addMarker("edge-se", { longitude: 104.51, latitude: 21.24 }),
        addMarker("edge-nw", { longitude: 104.49, latitude: 21.26 }),
        addMarker("edge-ne", { longitude: 104.51, latitude: 21.26 }),
      ]);
      const edges = await publicPlaceMarkers(
        { west: 104.49, south: 21.24, east: 104.51, north: 21.26 },
        pool,
      );
      expect(edges.items.map(({ id }) => id).sort()).toEqual(edgeIds.sort());

      const clamped = await publicPlaceMarkers(
        { west: -180, south: -90, east: 180, north: 90, limit: 100 },
        pool,
      );
      expect(clamped).toMatchObject({
        bbox: { west: 104.45, south: 21.2, east: 104.62, north: 21.35 },
        clamped: true,
      });

      await addBulk("exact", 100, 104.54);
      const exact = await publicPlaceMarkers(
        { west: 104.53, south: 21.29, east: 104.55, north: 21.31 },
        pool,
      );
      expect(exact.items).toHaveLength(100);
      expect(exact).toMatchObject({ truncated: false, nextOffset: null });

      await addBulk("over", 101, 104.58);
      const first = await publicPlaceMarkers(
        { west: 104.57, south: 21.29, east: 104.59, north: 21.31 },
        pool,
      );
      expect(first.items).toHaveLength(100);
      expect(first).toMatchObject({ truncated: true, nextOffset: 100 });
      const second = await publicPlaceMarkers(
        {
          west: 104.57,
          south: 21.29,
          east: 104.59,
          north: 21.31,
          offset: first.nextOffset!,
        },
        pool,
      );
      expect(second.items).toHaveLength(1);
      expect(second).toMatchObject({ truncated: false, nextOffset: null });
    });

    it("has a GiST bbox access path", async () => {
      await pool.query("SET enable_seqscan=off");
      const plan = await pool.query<{ "QUERY PLAN": string }>(
        "EXPLAIN (COSTS OFF) SELECT id FROM place_geometries WHERE valid_to IS NULL AND geometry && ST_MakeEnvelope($1,$2,$3,$4,4326)",
        [104.45, 21.2, 104.62, 21.35],
      );
      expect(plan.rows.map((row) => row["QUERY PLAN"]).join("\n")).toMatch(
        /place_geometries_geometry_idx/,
      );
      await pool.query("RESET enable_seqscan");
    });
  },
);
