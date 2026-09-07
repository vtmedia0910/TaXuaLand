import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
test("admin login, protected page and logout", async ({ page }) => {
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
  ).toBeVisible();
  await page.screenshot({
    path: "work/qa-admin-auth-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "work/qa-admin-login-mobile.png",
    fullPage: true,
  });
  expect((await page.request.get("/api/admin/session")).status()).toBe(401);
});
