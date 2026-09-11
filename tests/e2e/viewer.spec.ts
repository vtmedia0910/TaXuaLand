import { expect, test } from "../support/browser";
import { LAND_VIEWER_BASE } from "../../packages/config/src/viewer";

test("Cesium shell, layer controls, camera reset and mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/map");
  await expect(
    page.locator('[data-testid="map-shell"][data-shell-state="READY"]'),
  ).toBeVisible();
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 60000 },
  );
  const viewer = page.getByTestId("spatial-viewer");
  await expect(viewer).toHaveAttribute("data-cesium-state", "READY");
  await expect(viewer).toHaveAttribute("data-terrain-status", "UNAVAILABLE");
  await expect(viewer).toHaveAttribute("data-imagery-status", "UNAVAILABLE");
  await expect(viewer).toHaveAttribute("data-roads-status", "UNAVAILABLE");
  await expect(viewer).toHaveAttribute("data-places-status", "READY");
  const expectRegionalCamera = async () => {
    const values = (await viewer.getAttribute("data-camera-frame"))
      ?.split(",")
      .map(Number);
    expect(values).toHaveLength(5);
    expect(values![0]).toBeCloseTo(LAND_VIEWER_BASE.initialView.longitude, 4);
    expect(values![1]).toBeCloseTo(LAND_VIEWER_BASE.initialView.latitude, 4);
    expect(values![2]).toBeCloseTo(
      LAND_VIEWER_BASE.initialView.heightMeters,
      0,
    );
    expect(values![3]).toBeCloseTo(0, 1);
    expect(values![4]).toBeCloseTo(-55, 1);
  };
  await expectRegionalCamera();
  const rail = page.locator(".public-header");
  const desktopSearch = page.locator(".explorer-search-form");
  const desktopPanel = page.locator(".explorer-panel");
  const railBox = await rail.boundingBox();
  const searchBox = await desktopSearch.boundingBox();
  const panelBox = await desktopPanel.boundingBox();
  expect(railBox).not.toBeNull();
  expect(railBox!.width).toBeLessThan(120);
  expect(railBox!.height).toBe(900);
  expect(searchBox).not.toBeNull();
  expect(searchBox!.y).toBeLessThan(40);
  expect(searchBox!.width).toBeGreaterThan(420);
  expect(panelBox).not.toBeNull();
  expect(panelBox!.height).toBeLessThan(230);
  await expect(
    page.getByText("Địa hình và ảnh nền thực chưa khả dụng"),
  ).toBeVisible();
  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType("navigation").length,
  );
  const layerControl = page.getByRole("button", { name: "Mở lớp bản đồ" });
  await layerControl.click();
  const referenceGrid = page.getByLabel("Lưới tham chiếu", { exact: true });
  await referenceGrid.focus();
  await expect(referenceGrid).toBeFocused();
  await page.keyboard.press("Space");
  await expect(referenceGrid).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(referenceGrid).toBeChecked();
  await layerControl.click();
  await page
    .locator(".cesium-host canvas")
    .evaluate((canvas) => Reflect.set(window, "__landViewerCanvas", canvas));
  const reset = page.getByRole("button", { name: "Đặt lại góc nhìn" });
  await reset.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-camera-complete",
    "true",
  );
  await expectRegionalCamera();
  expect(await page.locator(".cesium-host canvas").count()).toBe(1);
  expect(
    await page
      .locator(".cesium-host canvas")
      .evaluate(
        (canvas) => canvas === Reflect.get(window, "__landViewerCanvas"),
      ),
  ).toBe(true);
  await page.getByRole("button", { name: "Đặt lại góc nhìn" }).click();
  const canvas = page.locator(".cesium-host canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 8, box!.y + box!.height / 2);
  await page.mouse.up();
  await expect(viewer).toHaveAttribute("data-camera-motion", "INTERRUPTED");
  await page.getByRole("button", { name: "Đặt lại góc nhìn" }).click();
  await expect(viewer).toHaveAttribute("data-camera-complete", "true");
  expect(
    await page.evaluate(
      () => performance.getEntriesByType("navigation").length,
    ),
  ).toBe(navigationCount);
  await page.screenshot({ path: "work/qa-viewer-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(390);
  const mobileViewer = await viewer.boundingBox();
  const mobilePanel = await page.locator(".explorer-panel").boundingBox();
  expect(mobileViewer).not.toBeNull();
  expect(mobileViewer!.height).toBeGreaterThan(780);
  expect(mobilePanel).not.toBeNull();
  expect(mobilePanel!.y).toBeGreaterThan(480);
  expect(mobilePanel!.height).toBeLessThan(130);
  expect(844 - (mobilePanel!.y + mobilePanel!.height)).toBeGreaterThan(60);
  expect(844 - (mobilePanel!.y + mobilePanel!.height)).toBeLessThan(90);
  const mobileSearch = await desktopSearch.boundingBox();
  const mobileControls = await page.locator(".map-tools").boundingBox();
  const mobileNav = await page.locator(".public-nav-primary").boundingBox();
  expect(mobileSearch).not.toBeNull();
  expect(mobileSearch!.y).toBeGreaterThanOrEqual(60);
  expect(mobileControls).not.toBeNull();
  expect(mobileControls!.x).toBeGreaterThan(320);
  expect(mobileNav).not.toBeNull();
  expect(mobileNav!.y).toBeGreaterThan(775);
  await expect(
    page.getByRole("combobox", { name: "Danh mục", exact: true }),
  ).not.toBeVisible();
  await page.screenshot({ path: "work/qa-viewer-mobile.png" });
  expect(errors).toEqual([]);
});
test("WebGL unavailable yields a usable fallback", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/map");
  await expect(
    page.getByRole("heading", { name: "Không mở được bản đồ 3D" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-cesium-state",
    "FAILED",
  );
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-places-status",
    "READY",
  );
  const retry = page.getByRole("button", { name: "Thử lại bản đồ 3D" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await expect(retry).toBeFocused();
  await retry.click();
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-cesium-state",
    "FAILED",
  );
  await expect(retry).toBeVisible();
  await expect(page.getByLabel("Tìm kiếm và thông tin địa điểm")).toBeVisible();
  await page.screenshot({ path: "work/qa-viewer-fallback.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Tìm kiếm và thông tin địa điểm")).toBeVisible();
  await expect(retry).toBeVisible();
  const retryBox = await retry.boundingBox();
  const panelBox = await page.locator(".explorer-panel").boundingBox();
  expect(retryBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(retryBox!.y + retryBox!.height).toBeLessThan(panelBox!.y);
  await page.screenshot({ path: "work/qa-viewer-fallback-mobile.png" });
});

test("reduced motion reaches the regional frame without a normal flight", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/map");
  const viewer = page.getByTestId("spatial-viewer");
  await expect(viewer).toHaveAttribute("data-ready", "true", {
    timeout: 60000,
  });
  await page.getByRole("button", { name: "Đặt lại góc nhìn" }).click();
  await expect(viewer).toHaveAttribute("data-camera-motion", "REDUCED");
  await expect(viewer).toHaveAttribute("data-camera-complete", "true");
});
