import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import pg from "pg";
if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let placeId: string;
const slug = `qa-road-reference-${randomUUID()}`;
test.beforeAll(async () => {
  const road = (
    await pool.query(
      "SELECT r.name,r.source_record_id,ST_X(ST_StartPoint(r.geometry)) AS longitude,ST_Y(ST_StartPoint(r.geometry)) AS latitude FROM road_segments r JOIN dataset_releases d ON d.id=r.release_id WHERE r.external_id='way/469902122' AND d.qa_status='PUBLISHED' LIMIT 1",
    )
  ).rows[0];
  if (!road) throw Error("Named OSM comparison road is required");
  const user = (
    await pool.query("SELECT id FROM admin_users WHERE NOT disabled LIMIT 1")
  ).rows[0].id;
  const category = (
    await pool.query(
      "INSERT INTO place_categories(code,name) VALUES('QA_ROAD_REFERENCE','Mốc nguồn dùng QA') ON CONFLICT(code) DO UPDATE SET name=excluded.name RETURNING id",
    )
  ).rows[0].id;
  placeId = (
    await pool.query(
      "INSERT INTO places(name,slug,short_description,source_record_id,created_by,updated_by,publication_status,review_required) VALUES($1,$2,'Mốc đầu đoạn đường theo OSM; chỉ dùng kiểm tra hiển thị, chưa kiểm chứng thực địa.',$3,$4,$4,'PUBLISHED',false) RETURNING id",
      [`${road.name} — mốc OSM dùng QA`, slug, road.source_record_id, user],
    )
  ).rows[0].id;
  await pool.query(
    "INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs) VALUES($1,ST_SetSRID(ST_MakePoint($2,$3),4326),$4,'EPSG:4326')",
    [placeId, road.longitude, road.latitude, road.source_record_id],
  );
  await pool.query("INSERT INTO place_category_links VALUES($1,$2)", [
    placeId,
    category,
  ]);
});
test.afterAll(async () => {
  if (placeId)
    await pool.query(
      "UPDATE places SET publication_status='ARCHIVED' WHERE id=$1",
      [placeId],
    );
  await pool.end();
});
test("named OSM reference focuses on its road over real DEM without gaining verification", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto(`/map?place=${slug}`);
  const viewer = page.getByTestId("spatial-viewer");
  await expect(viewer).toHaveAttribute("data-terrain-status", "READY", {
    timeout: 60000,
  });
  await expect(viewer).toHaveAttribute("data-focused-id", placeId, {
    timeout: 20000,
  });
  await expect(viewer).toHaveAttribute("data-settled", "true", {
    timeout: 30000,
  });
  await expect(
    page.getByRole("heading", { name: "Đèo Phiêng Ban — mốc OSM dùng QA" }),
  ).toBeVisible();
  await page.screenshot({
    path: "work/qa-terrain-osm-reference.png",
    fullPage: true,
  });
  const response = await page.request.get(`/api/public/places/${slug}`);
  expect(await response.text()).not.toContain('"VERIFIED"');
});
