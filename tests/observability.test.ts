import { expect, it, vi } from "vitest";
import { handle } from "../services/api/src/http";
import { errorCategory } from "../services/api/src/observability";
import { ImportDiagnostic } from "../services/api/src/import-diagnostics";
import { DatasetReleaseDiagnostic } from "../services/api/src/registry";
it("normalizes PostgreSQL JSON timestamps with explicit offsets for dataset diagnostics", () => {
  const timestamp = "2026-09-08T06:02:03.123456+07:00";
  const result = DatasetReleaseDiagnostic.parse({
    id: "bb861c26-f954-4778-b13c-8f497fbb7a8c",
    version: "test",
    sourceVersion: "test",
    processingVersion: "test",
    sourceCrs: "EPSG:4326",
    targetCrs: "EPSG:4326",
    verticalDatum: "WGS84_ELLIPSOID",
    resolution: 60,
    license: "test",
    checksum: "test",
    qaStatus: "PUBLISHED",
    generatedAt: timestamp,
    publishedAt: timestamp,
  });
  expect(result.generatedAt).toBe("2026-09-07T23:02:03.123Z");
  expect(result.publishedAt).toBe(result.generatedAt);
});
it("logs actionable allowlisted errors without driver detail, URL values or credentials", async () => {
  const output = vi.spyOn(console, "info").mockImplementation(() => {});
  try {
    const response = await handle(
      new Request(
        "http://localhost/api/admin/places/private-secret?token=hidden",
      ),
      async () => {
        throw {
          code: "23505",
          detail: "password=private-secret",
          query: "SELECT confidential",
        };
      },
    );
    expect(response.status).toBe(500);
    const log = JSON.parse(output.mock.calls[0]![0] as string);
    expect(log).toMatchObject({
      path: "/api/admin/places/:id",
      errorCategory: "DATABASE_CONSTRAINT",
    });
    expect(response.headers.get("x-correlation-id")).toBe(log.correlationId);
    expect(JSON.stringify(log)).not.toMatch(
      /private-secret|hidden|confidential|password/,
    );
    expect(await response.text()).not.toMatch(
      /23505|private-secret|confidential/,
    );
    expect(errorCategory({ code: "password=secret" })).toBe("UNEXPECTED");
  } finally {
    output.mockRestore();
  }
});
it("import diagnostics strips raw rows, file keys and committed place IDs", () => {
  const result = ImportDiagnostic.parse({
    id: "bb861c26-f954-4778-b13c-8f497fbb7a8c",
    status: "COMMITTED",
    uploadedAt: new Date().toISOString(),
    validationDurationMs: 123,
    totalRows: 1,
    validRows: 1,
    warningRows: 0,
    invalidRows: 0,
    duplicateRows: 0,
    errors: [],
    commitResult: { created: 1, updated: 0, skipped: 0, placeIds: ["private"] },
    raw_data_json: { secret: "private" },
    storage_key: "private",
  });
  expect(JSON.stringify(result)).not.toContain("private");
});
