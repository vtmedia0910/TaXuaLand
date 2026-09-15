import { randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "../infra/migrate";
import { publicPlaceMarkers } from "../services/api/src/public-places";

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
        contentProviderState?: "ENABLED" | "DISABLED" | "KILLED";
        geometry?: "CURRENT" | "HISTORICAL" | "MISSING";
        geometryRecordArchived?: boolean;
        geometrySourceArchived?: boolean;
        geometrySourceStatus?: string;
        geometryPublicDisplay?: "ALLOWED" | "DENIED" | "UNKNOWN";
        geometryProviderState?: "ENABLED" | "DISABLED" | "KILLED";
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
          "INSERT INTO sources(name,category,status,public_display,provider_id,archived_at) VALUES($1,'PLACES',$2,$3,$4,$5) RETURNING id",
          [
            `${slug} content`,
            options.contentSourceStatus ?? "ACTIVE",
            options.contentPublicDisplay ?? "ALLOWED",
            await provider(options.contentProviderState),
            options.contentSourceArchived ? new Date() : null,
          ],
        )
      ).rows[0]!.id;
      const geometrySource = (
        await pool.query<{ id: string }>(
          "INSERT INTO sources(name,category,status,public_display,provider_id,archived_at) VALUES($1,'PLACES',$2,$3,$4,$5) RETURNING id",
          [
            `${slug} geometry`,
            options.geometrySourceStatus ?? "ACTIVE",
            options.geometryPublicDisplay ?? "ALLOWED",
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
          "INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs,valid_from,valid_to) VALUES($1,ST_SetSRID(ST_MakePoint($2,$3),4326),$4,'EPSG:4326',$5,$6)",
          [
            placeId,
            options.longitude ?? 104.47,
            options.latitude ?? 21.22,
            geometryRecord,
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
        /PRIVATE_MARKER_FIXTURE|source_record|provider|internal|audit|actor|evidence|publicationStatus/,
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
