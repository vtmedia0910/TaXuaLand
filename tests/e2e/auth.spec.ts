import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { expect, test } from "../support/browser";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
test.afterAll(() => pool.end());
test("admin login, protected page and logout", async ({ page }) => {
  test.setTimeout(120000);
  const clientErrors: string[] = [];
  const version = `TX-ADMIN-${randomUUID()}`;
  const source = (
    await pool.query(
      "INSERT INTO sources(name,category,status,public_display,redistribution,derivatives,caching,license_reference) VALUES('Synthetic publication UI','OTHER','ACTIVE','ALLOWED','ALLOWED','ALLOWED','ALLOWED','https://example.invalid/license') RETURNING id",
    )
  ).rows[0].id;
  const dataset = (
    await pool.query(
      "INSERT INTO datasets(code,name,kind,source_id) VALUES($1,'Synthetic publication UI','IMAGERY',$2) RETURNING id",
      [randomUUID(), source],
    )
  ).rows[0].id;
  const release = (
    await pool.query(
      "INSERT INTO dataset_releases(dataset_id,version,source_version,pipeline_version,source_crs,target_crs,bbox,license,checksum,qa_status) VALUES($1,$2,'fixture','test','EPSG:4326','EPSG:4326',ST_MakeEnvelope(104,21,105,22,4326),'Synthetic',repeat('a',64),'APPROVED') RETURNING id",
      [dataset, version],
    )
  ).rows[0].id;
  await pool.query(
    "INSERT INTO dataset_assets(release_id,zone,object_key,checksum,byte_size,content_type,public_url) VALUES($1,'published',$2,repeat('a',64),1,'application/octet-stream',$3)",
    [release, `${version}/asset.bin`, `/spatial/${version}/asset.bin`],
  );
  await pool.query(
    "INSERT INTO pipeline_runs(dataset_id,release_id,processing_version,status,manifest) VALUES($1,$2,'test','COMPLETED','{}')",
    [dataset, release],
  );
  page.on("pageerror", (error) => clientErrors.push(error.message));
  const credentials = JSON.parse(
    readFileSync(
      process.env.E2E_CREDENTIALS_FILE ?? "work/local-admin.json",
      "utf8",
    ),
  ) as { email: string; password: string };
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu").fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dữ liệu không gian" }),
  ).toBeVisible({ timeout: 30000 });
  await page.screenshot({
    path: "work/qa-admin-auth-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Nguồn dữ liệu", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nguồn dữ liệu", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "work/qa-sources.png", fullPage: true });
  await page
    .getByRole("link", { name: "Dataset & release", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dataset & release", exact: true }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: `Xuất bản release ${version}` })
    .click();
  await expect(page.getByText("PUBLISHED", { exact: true })).toBeVisible();
  expect(
    (
      await pool.query(
        "SELECT id FROM audit_events WHERE subject_id=$1 AND action='DATASET_RELEASE_PUBLISHED'",
        [release],
      )
    ).rowCount,
  ).toBe(1);
  expect(
    await page.evaluate(
      async () =>
        (
          await fetch("/api/admin/datasets/not-a-uuid/publish", {
            method: "POST",
          })
        ).status,
    ),
  ).toBe(400);
  expect(
    await page.evaluate(
      async (release) =>
        (
          await fetch(`/api/admin/datasets/${release}/publish`, {
            method: "POST",
          })
        ).status,
      release,
    ),
  ).toBe(409);
  await page.getByRole("link", { name: "Chẩn đoán", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Chẩn đoán hệ thống" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Kiểm tra viewer", exact: true })
    .click();
  await expect(page.getByTestId("stable-frame-ms")).toHaveText(/^\d+$/, {
    timeout: 60000,
  });
  if (!process.env.E2E_CORE)
    await expect(page.getByTestId("viewer-diagnostics")).toContainText(
      "TX-DEM-2026-001",
    );
  await page.screenshot({ path: "work/qa-diagnostics.png", fullPage: true });
  const diagnosticResponse = await page.evaluate(async () => {
    const response = await fetch("/api/admin/diagnostics");
    return { status: response.status, body: await response.text() };
  });
  expect(diagnosticResponse.status).toBe(200);
  expect(diagnosticResponse.body).not.toMatch(
    /storage_key|raw_data_json|password_hash|DATABASE_URL/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "work/qa-diagnostics-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const previousSession = (await page.context().cookies()).find(
    (cookie) => cookie.name === "land_session",
  )?.value;
  expect(Boolean(previousSession)).toBe(true);
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "work/qa-admin-login-mobile.png",
    fullPage: true,
  });
  expect((await page.request.get("/api/admin/session")).status()).toBe(401);
  expect(
    (
      await page.request.get("/api/admin/session", {
        headers: { Cookie: `land_session=${previousSession}` },
      })
    ).status(),
  ).toBe(401);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(clientErrors).toEqual([]);
});
