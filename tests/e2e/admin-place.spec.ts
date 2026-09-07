import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import pg from "pg";
if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let sourceId: string;
const slug = `qa-editor-${randomUUID()}`;
test.beforeAll(async () => {
  sourceId = (
    await pool.query<{ id: string }>(
      "INSERT INTO sources(name,category,status,public_display) VALUES('LAND authored editor fixture','OTHER','ACTIVE','ALLOWED') RETURNING id",
    )
  ).rows[0]!.id;
  await pool.query(
    "INSERT INTO place_categories(code,name) VALUES('QA_EDITOR','Kiểm thử Admin') ON CONFLICT(code) DO NOTHING",
  );
});
test.afterAll(async () => {
  await pool.query(
    "UPDATE places SET publication_status='ARCHIVED' WHERE slug=$1",
    [slug],
  );
  if (sourceId)
    await pool.query("UPDATE sources SET status='DISABLED' WHERE id=$1", [
      sourceId,
    ]);
  await pool.end();
});
test("Admin creates and corrects map location, preserves history, reviews and publishes UNKNOWN", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const credentials = JSON.parse(
    readFileSync("work/local-admin.json", "utf8"),
  ) as { email: string; password: string };
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu").fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/places/new");
  await page
    .getByLabel("Tên địa điểm", { exact: true })
    .fill("Điểm kiểm thử Admin");
  await page.getByLabel("Slug", { exact: true }).fill(slug);
  await page
    .getByRole("combobox", { name: "Nguồn dữ liệu", exact: true })
    .selectOption(sourceId);
  await page.getByLabel("Kiểm thử Admin", { exact: true }).check();
  await page.getByLabel("Kinh độ (longitude)", { exact: true }).fill("104.535");
  await page.getByLabel("Vĩ độ (latitude)", { exact: true }).fill("21.245");
  await page
    .getByLabel("Mô tả ngắn", { exact: true })
    .fill("Dữ liệu tổng hợp kiểm thử editor, không phải địa danh thực.");
  await page
    .getByRole("button", { name: "Đưa camera tới vị trí đề xuất" })
    .click();
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-focused-id",
    "candidate",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/places\/[0-9a-f-]{36}$/, {
    timeout: 20000,
  });
  const id = page.url().split("/").at(-1)!;
  await page.getByLabel("Kinh độ (longitude)", { exact: true }).fill("104.537");
  await expect(
    page.getByRole("button", { name: "Lưu bản nháp", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Đưa camera tới vị trí đề xuất" })
    .click();
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-focused-id",
    "candidate",
  );
  const canvas = page.locator(".cesium-host canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  // Drag the visible candidate at the center of the fly-to target.
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 24,
    box!.y + box!.height / 2 + 20,
    { steps: 6 },
  );
  await page.mouse.up();
  await expect(
    page.getByLabel("Kinh độ (longitude)", { exact: true }),
  ).not.toHaveValue("104.537");
  await page.screenshot({ path: "work/qa-admin-picker.png" });
  await page.getByLabel(/Xác nhận đổi vị trí/).check();
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(
    page.getByText("DRAFT · Phiên bản 2", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  const record = await (
    await page.request.get(`/api/admin/places/${id}`)
  ).json();
  expect(record.geometryHistory).toHaveLength(2);
  expect(record.geometry.verification_status).toBe("UNKNOWN");
  await page.getByLabel(/Tôi đã rà soát nội dung, nguồn/).check();
  await page
    .getByRole("button", { name: "Xuất bản địa điểm", exact: true })
    .click();
  await expect(
    page.getByText("PUBLISHED · Phiên bản 3", { exact: true }),
  ).toBeVisible();
  expect((await page.request.get(`/api/public/places/${slug}`)).status()).toBe(
    200,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("heading", { name: "Xuất bản", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "work/qa-admin-publish-mobile.png" });
  expect(errors).toEqual([]);
});
