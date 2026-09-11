import { expect, test } from "@playwright/test";

test("corrupt terrain manifest fails closed while place search remains usable", async ({
  page,
}) => {
  await page.route("**/spatial/terrain/**/manifest.json", (route) =>
    route.fulfill({ contentType: "application/json", body: "{}" }),
  );
  await page.goto("/map");
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-terrain-status",
    "FAILED",
    { timeout: 60000 },
  );
  await expect(
    page.getByText(
      "Địa hình lỗi; lớp nền hiện tại không dùng để đánh giá địa hình",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tìm kiếm", exact: true }),
  ).toBeEnabled();
});

test("real bounded DEM and OSM roads render with attribution, stable camera and mobile layers", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [],
    tiles: string[] = [],
    failed: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/spatial/")) {
      if (!r.ok()) failed.push(`${r.status()}`);
      if (r.url().endsWith(".bin")) tiles.push(r.url());
    }
  });
  await page.goto("/map");
  const viewer = page.getByTestId("spatial-viewer");
  await expect(viewer).toHaveAttribute("data-terrain-status", "READY", {
    timeout: 60000,
  });
  await expect(viewer).toHaveAttribute("data-roads-status", "READY", {
    timeout: 30000,
  });
  await expect.poll(() => tiles.length, { timeout: 30000 }).toBeGreaterThan(0);
  await expect(viewer).toHaveAttribute("data-settled", "true", {
    timeout: 30000,
  });
  await expect(
    page.getByText("OpenStreetMap contributors", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Nguồn địa hình · TX-DEM-2026-001", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "work/qa-terrain-desktop.png" });
  const navigation = await page.evaluate(
    () => performance.getEntriesByType("navigation").length,
  );
  await page.getByRole("button", { name: "Mở lớp bản đồ" }).click();
  await page.getByLabel("Đường", { exact: true }).uncheck();
  await page.getByLabel("Đường", { exact: true }).check();
  await page.getByLabel("Địa hình", { exact: true }).uncheck();
  await page.getByLabel("Địa hình", { exact: true }).check();
  await page.getByRole("button", { name: "Nhìn từ trên", exact: true }).click();
  await expect(viewer).toHaveAttribute("data-settled", "true", {
    timeout: 20000,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(viewer).toHaveAttribute("data-rendered-width", "356", {
    timeout: 20000,
  });
  await expect(viewer).toHaveAttribute("data-settled", "true", {
    timeout: 30000,
  });
  await viewer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "work/qa-terrain-mobile.png" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    ),
  ).toBe(navigation);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
