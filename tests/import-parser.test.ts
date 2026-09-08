import ExcelJS from "exceljs";
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  parseWorkbook,
  inspectZip,
} from "../packages/import/src/workbook-parser";
import {
  normalizeImportRow,
  suggestMapping,
  mapsCoordinateCandidate,
} from "../packages/import/src/normalize";
import { inspectWorkbookIsolated } from "../services/api/src/import-worker";
import { ColumnMapping, IMPORT_LIMITS } from "../packages/contracts/src/import";
async function fixture() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Địa điểm");
  sheet.addRows([
    ["Tên", "Tọa Độ", "Danh mục", "URL Google Map", "URL Ảnh"],
    [
      "Điểm tổng hợp kiểm thử",
      "21.26254175667024, 104.53036202410956",
      "VIEWPOINT",
      "https://www.google.com/maps?query=21.26,104.53",
      "https://example.invalid/fixture.jpg",
    ],
    ["Thiếu tọa độ", "", "Không rõ", "", ""],
    ["Công thức", { formula: "1+1", result: 2 }, "", "", ""],
  ]);
  const accounts = workbook.addWorksheet("Tài khoản");
  accounts.addRows([
    ["Username", "Password"],
    ["synthetic-user", "SYNTHETIC_PRIVATE_VALUE"],
  ]);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
function fakeZip(name: string, declaredSize: number) {
  const filename = Buffer.from(name),
    local = Buffer.alloc(30),
    central = Buffer.alloc(46),
    end = Buffer.alloc(22);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(declaredSize, 22);
  local.writeUInt16LE(filename.length, 26);
  central.writeUInt32LE(0x02014b50);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(declaredSize, 24);
  central.writeUInt16LE(filename.length, 28);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + filename.length, 12);
  end.writeUInt32LE(local.length + filename.length, 16);
  return Buffer.concat([local, filename, central, filename, end]);
}
describe("untrusted workbook parser and deterministic normalization", () => {
  it("preserves coordinate precision and excludes credential sheets and formulas", async () => {
    const workbook = await parseWorkbook(await fixture());
    expect(workbook.sheets[1]?.blocked).toBe(true);
    expect(JSON.stringify(workbook)).not.toContain("SYNTHETIC_PRIVATE_VALUE");
    const sheet = workbook.sheets[0]!,
      mapping = suggestMapping(sheet.headers);
    expect(mapping).toMatchObject({ "0": "name", "1": "coordinates" });
    const row = normalizeImportRow(sheet.rows[0]!, mapping, randomUUID(), [
      { id: randomUUID(), code: "VIEWPOINT", name: "Điểm nhìn" },
    ]);
    expect(row.data.location).toEqual({
      latitude: 21.26254175667024,
      longitude: 104.53036202410956,
    });
    expect(row.data.sourceObservedAt).toBeNull();
    expect(row.data.geometryChangeConfirmed).toBe(false);
    expect(row.issues).toEqual([]);
    expect(
      normalizeImportRow(sheet.rows[1]!, mapping, randomUUID(), []).issues.some(
        (i) => i.code === "MISSING_COORDINATE",
      ),
    ).toBe(true);
    expect(sheet.rows[2]?.cells[1]?.issue).toBe("FORMULA_NOT_IMPORTED");
  });
  it("runs the parser in a resource-limited process without application credentials", async () => {
    const result = await inspectWorkbookIsolated(await fixture());
    expect(result.sheets[0]?.rows.length).toBe(3);
  }, 30000);
  it("rejects corrupt, macro and oversized containers before workbook parsing", async () => {
    await expect(inspectZip(Buffer.from("not a zip"))).rejects.toThrow();
    await expect(inspectZip(fakeZip("xl/vbaProject.bin", 0))).rejects.toThrow();
    await expect(
      inspectZip(
        fakeZip("xl/worksheets/sheet1.xml", IMPORT_LIMITS.expandedBytes + 1),
      ),
    ).rejects.toThrow();
  });
  it("requires explicit name mapping and never derives verified or primary location from URL", () => {
    expect(ColumnMapping.safeParse({ "0": "coordinates" }).success).toBe(false);
    expect(
      mapsCoordinateCandidate("https://www.google.com/maps?query=21.26,104.53"),
    ).toEqual({ latitude: 21.26, longitude: 104.53 });
    expect(
      mapsCoordinateCandidate(
        "https://example.invalid/maps?query=21.26,104.53",
      ),
    ).toBeNull();
  });
});
