import { expect, test } from "../support/browser";
test("Cesium shell, layer controls, camera reset and mobile viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/map");
  await expect(page.getByTestId("map-shell")).toHaveAttribute(
    "data-shell-state",
    "READY",
  );
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 60000 },
  );
  const viewer = page.getByTestId("spatial-viewer");
  await expect(viewer).toHaveAttribute("data-cesium-state", "READY");
  await expect(viewer).toHaveAttribute("data-terrain-status", "UNAVAILABLE");
  await expect(viewer).toHaveAttribute("data-imagery-status", "READY");
  await expect(viewer).toHaveAttribute("data-roads-status", "UNAVAILABLE");
  await expect(viewer).toHaveAttribute("data-places-status", "READY");
  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType("navigation").length,
  );
  await page.getByLabel("Lưới nền", { exact: true }).uncheck();
  await page.getByLabel("Lưới nền", { exact: true }).check();
  await page
    .locator(".cesium-host canvas")
    .evaluate((canvas) => Reflect.set(window, "__landViewerCanvas", canvas));
  await page.getByRole("button", { name: "Đặt lại góc nhìn" }).click();
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-camera-complete",
    "true",
  );
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
  await page.screenshot({ path: "work/qa-viewer-mobile.png" });
  expect(errors).toEqual([]);
});
test("WebGL unavailable yields a usable fallback", async ({ page }) => {
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
  const retry = page.getByRole("button", { name: "Thử lại bản đồ 3D" });
  await expect(retry).toBeVisible();
  await retry.focus();
  await expect(retry).toBeFocused();
  await expect(page.getByLabel("Tìm kiếm và thông tin địa điểm")).toBeVisible();
  await page.screenshot({ path: "work/qa-viewer-fallback.png" });
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
