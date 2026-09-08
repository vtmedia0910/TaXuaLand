import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { test, expect } from "../support/browser";
import ExcelJS from "exceljs";
test("workbook upload, mapping, map preview and explicit row review", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const credentials = JSON.parse(
    readFileSync(
      process.env.E2E_CREDENTIALS_FILE ?? "work/local-admin.json",
      "utf8",
    ),
  ) as { email: string; password: string };
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu").fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/imports");
  await page
    .getByRole("combobox", { name: "Nguồn của lô import" })
    .selectOption({ label: "LAND development fixtures" });
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("Địa điểm").addRows([
    ["Tên", "Tọa Độ", "Slug"],
    [
      "Synthetic review point",
      "21.26254,104.53036",
      `qa-import-${randomUUID()}`,
    ],
    ["Synthetic invalid point", "21.28,104.56"],
    ["Missing location", ""],
  ]);
  workbook.getWorksheet("Địa điểm")!.getCell("A3").value = "";
  workbook.addWorksheet("Tài khoản").addRows([
    ["Username", "Password"],
    ["synthetic", "PRIVATE_QA_ONLY"],
  ]);
  await page.getByLabel("Workbook Excel").setInputFiles({
    name: "qa-review.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  });
  await page
    .getByRole("button", { name: "Tải lên và kiểm tra workbook" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Chọn sheet và mapping" }),
  ).toBeVisible({ timeout: 25000 });
  await expect(page.getByText(/Tài khoản: Sheet ẩn/)).toBeVisible();
  expect(await page.content()).not.toContain("PRIVATE_QA_ONLY");
  await page
    .getByLabel("Tôi đã kiểm tra sheet, thứ tự tọa độ và mapping.")
    .check();
  await page.getByRole("button", { name: "Chuẩn hóa và tạo staging" }).click();
  await expect(
    page.getByRole("heading", { name: "Tổng hợp staging" }),
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Dòng 3", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Review dòng 3" }),
  ).toBeVisible();
  await page.locator(".cesium-host canvas").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("spatial-viewer")).toHaveAttribute(
    "data-settled",
    "true",
    { timeout: 30000 },
  );
  await page.screenshot({ path: "work/qa-import-preview.png" });
  await page
    .getByRole("combobox", { name: "Quyết định cho dòng" })
    .selectOption("SKIP");
  await page.getByRole("button", { name: "Lưu quyết định dòng 3" }).click();
  await expect(page.getByText("INVALID · SKIP", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: "Dòng 2", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Quyết định cho dòng" })
    .selectOption("CREATE");
  await page
    .getByLabel(
      "Tôi đã rà soát các cảnh báo và ứng viên trùng; không tự merge.",
    )
    .check();
  await page.getByRole("button", { name: "Lưu quyết định dòng 2" }).click();
  await expect(
    page.getByText("WARNING · CREATE", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("heading", { name: "Review dòng 2" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: "work/qa-import-review-mobile.png" });
  await page.getByRole("button", { name: "Dòng 4", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Quyết định cho dòng" })
    .selectOption("SKIP");
  await page.getByRole("button", { name: "Lưu quyết định dòng 4" }).click();
  await expect(page.getByText("INVALID · SKIP", { exact: true })).toBeVisible();
  await page
    .getByLabel(
      "Tôi xác nhận các quyết định đã lưu và ghi lô này vào bản nháp.",
    )
    .check();
  await page
    .getByRole("button", { name: "Commit vào bản nháp", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Đã commit vào bản nháp" }),
  ).toBeVisible({ timeout: 15000 });
  const result = page.getByRole("region", { name: "Kết quả commit" });
  await expect(result).toContainText("Tạo mới: 1 · Cập nhật: 0 · Bỏ qua: 2");
  await result.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "work/qa-import-commit-mobile.png" });
  const placePath = await result
    .getByRole("link", { name: "Mở bản nháp" })
    .getAttribute("href");
  const placeId = placePath!.split("/").at(-1)!;
  const place = await page.evaluate(async (id) => {
    const response = await fetch(`/api/admin/places/${id}`);
    if (!response.ok) throw Error(`Read draft ${response.status}`);
    return response.json();
  }, placeId);
  expect(place.place.publication_status).toBe("DRAFT");
  expect(place.geometry.verification_status).toBe("UNKNOWN");
  const cleanup = await page.evaluate(
    async ({ id, version }) =>
      (
        await fetch(`/api/admin/places/${id}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ version }),
        })
      ).status,
    { id: placeId, version: place.place.version },
  );
  expect(cleanup).toBe(200);
  expect(errors).toEqual([]);
});
