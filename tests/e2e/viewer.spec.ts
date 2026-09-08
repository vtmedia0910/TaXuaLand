import { expect, test } from "../support/browser";
test("Cesium shell, layer controls, camera reset and mobile viewport", async ({
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
  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType("navigation").length,
  );
  await page.getByLabel("Lưới nền", { exact: true }).uncheck();
  await page.getByLabel("Lưới nền", { exact: true }).check();
  await page.getByRole("button", { name: "Đặt lại góc nhìn" }).click();
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-settled",
    "true",
  );
  expect(await page.locator(".cesium-host canvas").count()).toBe(1);
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
  await page.screenshot({ path: "work/qa-viewer-fallback.png" });
});
