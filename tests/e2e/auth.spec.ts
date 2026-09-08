import { readFileSync } from "node:fs";
import { expect, test } from "../support/browser";
test("admin login, protected page and logout", async ({ page }) => {
  test.setTimeout(120000);
  const clientErrors: string[] = [];
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
