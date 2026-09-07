import { test, expect } from "@playwright/test";
import pg from "pg";
import { randomUUID } from "node:crypto";
if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const slug = `qa-spatial-${randomUUID()}`;
let sourceId: string, placeId: string;
test.beforeAll(async () => {
  // Authored, explicitly synthetic fixture. No claim about a real place or source verification.
  sourceId = (
    await pool.query<{ id: string }>(
      "INSERT INTO sources(name,category,status,public_display) VALUES('LAND authored synthetic UI fixture','OTHER','ACTIVE','ALLOWED') RETURNING id",
    )
  ).rows[0]!.id;
  const sourceRecord = (
    await pool.query<{ id: string }>(
      "INSERT INTO source_records(source_id,raw_payload_hash) VALUES($1,repeat('b',64)) RETURNING id",
      [sourceId],
    )
  ).rows[0]!.id;
  const user = (
    await pool.query<{ id: string }>("SELECT id FROM admin_users LIMIT 1")
  ).rows[0]!.id;
  const category = (
    await pool.query<{ id: string }>(
      "INSERT INTO place_categories(code,name) VALUES('QA_PUBLIC','Dữ liệu kiểm thử') ON CONFLICT(code) DO UPDATE SET name=excluded.name RETURNING id",
    )
  ).rows[0]!.id;
  placeId = (
    await pool.query<{ id: string }>(
      "INSERT INTO places(name,slug,short_description,source_record_id,created_by,updated_by,publication_status,review_required,internal_notes) VALUES('Đỉnh kiểm thử giao diện',$1,'Điểm tổng hợp dùng kiểm thử, không phải địa danh thực.',$2,$3,$3,'PUBLISHED',false,'PRIVATE_FIXTURE') RETURNING id",
      [slug, sourceRecord, user],
    )
  ).rows[0]!.id;
  await pool.query(
    "INSERT INTO place_geometries(place_id,geometry,source_record_id,source_crs) VALUES($1,ST_SetSRID(ST_MakePoint(104.535,21.245),4326),$2,'EPSG:4326')",
    [placeId, sourceRecord],
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
  if (sourceId)
    await pool.query("UPDATE sources SET status='DISABLED' WHERE id=$1", [
      sourceId,
    ]);
  await pool.end();
});
test("public search selects real API marker and displays UNKNOWN without leaking private fields", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/map");
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 60000 },
  );
  await page.getByLabel("Tìm địa điểm", { exact: true }).fill("dinh kiem thu");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await page.getByRole("button", { name: /Đỉnh kiểm thử giao diện/ }).click();
  await expect(
    page.getByRole("heading", { name: "Đỉnh kiểm thử giao diện" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(new RegExp(`place=${slug}`));
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-settled",
    "true",
  );
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-focused-id",
    placeId,
  );
  await expect(page.locator(".explorer")).toHaveCSS("display", "grid");
  const response = await page.request.get(`/api/public/places/${slug}`);
  expect(response.status()).toBe(200);
  expect(await response.text()).not.toContain("PRIVATE_FIXTURE");
  await page.screenshot({ path: "work/qa-public-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "work/qa-public-mobile.png", fullPage: true });
  await page
    .getByRole("link", { name: "Mở trang địa điểm / liên kết chia sẻ" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Đỉnh kiểm thử giao diện" }),
  ).toBeVisible();
  await expect(page.getByText("Chưa rõ (UNKNOWN)").first()).toBeVisible();
  expect(errors).toEqual([]);
});
