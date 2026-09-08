import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
test("production upload and spatial validation baseline for 100/500/2000 rows", async ({
  page,
}) => {
  test.setTimeout(240000);
  const credentials = JSON.parse(
    await readFile("work/local-admin.json", "utf8"),
  ) as { email: string; password: string };
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu").fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const sourceId = await page.evaluate(async () => {
    const sources = (await (await fetch("/api/admin/sources")).json()) as {
      id: string;
      name: string;
    }[];
    return sources.find((s) => s.name === "LAND development fixtures")!.id;
  });
  const results = [];
  for (const count of [100, 500, 2000]) {
    const workbook = new ExcelJS.Workbook(),
      sheet = workbook.addWorksheet("Benchmark"),
      prefix = randomUUID();
    sheet.addRow(["Tên", "Slug", "Tọa Độ"]);
    for (let i = 0; i < count; i++)
      sheet.addRow([
        `Synthetic benchmark ${i}`,
        `perf-${prefix}-${i}`,
        `${21.22 + Math.floor(i / 50) * 0.002},${104.46 + (i % 50) * 0.002}`,
      ]);
    const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
    const result = await page.evaluate(
      async ({ sourceId, bytes, count }) => {
        const start = performance.now();
        const upload = await fetch(`/api/admin/imports?sourceId=${sourceId}`, {
          method: "POST",
          headers: {
            "content-type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "x-file-name": `synthetic-benchmark-${count}.xlsx`,
          },
          body: new Uint8Array(bytes),
        });
        const uploadMs = Math.round(performance.now() - start);
        if (!upload.ok) throw Error(`Upload ${upload.status}`);
        const { id } = (await upload.json()) as { id: string };
        const validateStart = performance.now();
        const validate = await fetch(`/api/admin/imports/${id}/validate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            version: 1,
            sheetIndex: 0,
            mapping: { "0": "name", "1": "slug", "2": "coordinates" },
          }),
        });
        if (!validate.ok) throw Error(`Validation ${validate.status}`);
        const validationHttpMs = Math.round(performance.now() - validateStart);
        const detail = await (await fetch(`/api/admin/imports/${id}`)).json();
        return {
          id,
          uploadMs,
          validationHttpMs,
          validationMs: detail.batch.validation_duration_ms,
          rows: detail.batch.total_rows,
          status: detail.batch.status,
        };
      },
      { sourceId, bytes: Array.from(bytes), count },
    );
    expect(result.status).toBe("READY_FOR_REVIEW");
    expect(result.rows).toBe(count);
    expect(result.validationMs).toBeLessThan(60000);
    results.push({ count, bytes: bytes.length, ...result });
  }
  await writeFile(
    "work/import-performance-baseline.json",
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        fixture:
          "Synthetic coordinates; all rows remain staging, no commit or verification",
        results,
      },
      null,
      2,
    ),
  );
  const reviewStart = performance.now();
  await page.goto(`/admin/imports/${results.at(-1)!.id}`);
  const viewer = page.getByTestId("spatial-viewer");
  await expect(viewer).toHaveAttribute("data-settled", "true", {
    timeout: 60000,
  });
  const reviewMs = Math.round(performance.now() - reviewStart);
  expect(reviewMs).toBeLessThan(30000);
  await viewer.screenshot({ path: "work/qa-import-2000-points.png" });
  await writeFile(
    "work/import-review-performance.json",
    JSON.stringify(
      {
        count: 2000,
        reviewMs,
        status: "STAGING_ONLY",
        measuredAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
});
