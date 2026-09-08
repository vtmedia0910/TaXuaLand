import ExcelJS from "exceljs";
import yauzl from "yauzl";
import {
  IMPORT_LIMITS,
  type InspectedWorkbook,
} from "../../contracts/src/import.ts";
export function cleanText(value: string): string {
  return value
    .replace(
      // Strip untrusted control characters before storing or displaying cell text.
      // eslint-disable-next-line no-control-regex
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g,
      "",
    )
    .trim();
}
const normalized = (v: string) =>
  v
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const sensitive = (v: string) =>
  /(password|matkhau|apikey|secret|credential|taikhoan|account|username|dangnhap|accesstoken|privatekey)/.test(
    normalized(v),
  );
const secretValue =
  /(?:\b(?:password|api[_ -]?key|secret|token)\s*[:=]\s*\S+)|(?:\bsk-[A-Za-z0-9_-]{12,})|(?:\bgh[pousr]_[A-Za-z0-9]{20,})/gi;
/** Decompress every ZIP entry sequentially to validate actual sizes before ExcelJS sees it. Nothing is extracted to disk. */
export async function inspectZip(bytes: Buffer): Promise<void> {
  if (
    bytes.length > IMPORT_LIMITS.uploadBytes ||
    bytes.length < 4 ||
    bytes.readUInt32LE(0) !== 0x04034b50
  )
    throw Error("INVALID_XLSX_CONTAINER");
  const zip = await new Promise<yauzl.ZipFile>((resolve, reject) =>
    yauzl.fromBuffer(
      bytes,
      { lazyEntries: true, validateEntrySizes: true, strictFileNames: true },
      (error, file) => (error ? reject(error) : resolve(file!)),
    ),
  );
  let expanded = 0,
    count = 0;
  const names = new Set<string>();
  await new Promise<void>((resolve, reject) => {
    const fail = (error: unknown) => {
      zip.close();
      reject(error);
    };
    zip.on("error", fail);
    zip.on("end", () => {
      if (!names.has("[Content_Types].xml") || !names.has("xl/workbook.xml"))
        fail(Error("INVALID_XLSX_STRUCTURE"));
      else resolve();
    });
    zip.on("entry", (entry: yauzl.Entry) => {
      if (
        ++count > IMPORT_LIMITS.entries ||
        entry.uncompressedSize > IMPORT_LIMITS.entryBytes ||
        (entry.generalPurposeBitFlag & 1) !== 0 ||
        names.has(entry.fileName) ||
        /vba|macrosheet|embeddings\//i.test(entry.fileName)
      ) {
        fail(Error("UNSUPPORTED_OR_OVERSIZED_XLSX"));
        return;
      }
      names.add(entry.fileName);
      if (entry.fileName.endsWith("/")) {
        zip.readEntry();
        return;
      }
      zip.openReadStream(entry, (error, stream) => {
        if (error || !stream) {
          fail(Error("CORRUPT_XLSX_ENTRY"));
          return;
        }
        const chunks: Buffer[] = [];
        let entrySize = 0;
        stream.on("error", fail);
        stream.on("data", (chunk: Buffer) => {
          expanded += chunk.length;
          entrySize += chunk.length;
          if (
            expanded > IMPORT_LIMITS.expandedBytes ||
            entrySize > IMPORT_LIMITS.entryBytes
          ) {
            stream.destroy();
            fail(Error("EXPANDED_SIZE_LIMIT"));
            return;
          }
          if (
            entry.fileName.endsWith(".xml") ||
            entry.fileName.endsWith(".rels")
          )
            chunks.push(chunk);
        });
        stream.on("end", () => {
          if (
            chunks.length &&
            /<!DOCTYPE|<!ENTITY|macroEnabled|vbaProject/i.test(
              Buffer.concat(chunks).toString("utf8"),
            )
          ) {
            fail(Error("ACTIVE_XML_NOT_SUPPORTED"));
            return;
          }
          zip.readEntry();
        });
      });
    });
    zip.readEntry();
  });
}
export async function parseWorkbook(bytes: Buffer): Promise<InspectedWorkbook> {
  await inspectZip(bytes);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    bytes as unknown as Parameters<typeof workbook.xlsx.load>[0],
  );
  if (workbook.worksheets.length > IMPORT_LIMITS.sheets)
    throw Error("SHEET_LIMIT");
  const sheets: InspectedWorkbook["sheets"] = [];
  let textBytes = 0;
  for (const [index, sheet] of workbook.worksheets.entries()) {
    const name = cleanText(sheet.name).replace(secretValue, "[REDACTED]");
    if (
      sheet.rowCount > IMPORT_LIMITS.rowsPerSheet + 20 ||
      sheet.columnCount > IMPORT_LIMITS.columns
    )
      throw Error("WORKSHEET_DIMENSION_LIMIT");
    let headerRow = 1;
    while (
      headerRow <= Math.min(sheet.rowCount, 20) &&
      sheet.getRow(headerRow).actualCellCount === 0
    )
      headerRow++;
    const headers = Array.from({ length: sheet.columnCount }, (_, column) =>
      cleanText(sheet.getRow(headerRow).getCell(column + 1).text),
    );
    const blocked =
      sheet.state !== "visible" || sensitive(name) || headers.some(sensitive);
    if (blocked) {
      sheets.push({
        index,
        name,
        blocked: true,
        reason:
          "Sheet ẩn hoặc có thông tin tài khoản/credential; không được mapping.",
        headerRow,
        headers: [],
        rows: [],
      });
      continue;
    }
    const rows: InspectedWorkbook["sheets"][number]["rows"] = [];
    for (
      let rowNumber = headerRow + 1;
      rowNumber <= sheet.rowCount;
      rowNumber++
    ) {
      const row = sheet.getRow(rowNumber);
      if (!row.actualCellCount) continue;
      const cells = Array.from({ length: sheet.columnCount }, (_, column) => {
        const cell = row.getCell(column + 1),
          value = cell.value;
        let text = "",
          issue: InspectedWorkbook["sheets"][number]["rows"][number]["cells"][number]["issue"] =
            null;
        if (value == null) text = "";
        else if (value instanceof Date) {
          if (!Number.isFinite(value.getTime())) issue = "UNSUPPORTED_CELL";
          else text = value.toISOString();
        } else if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        )
          text = String(value);
        else if ("formula" in value || "sharedFormula" in value)
          issue = "FORMULA_NOT_IMPORTED";
        else if ("richText" in value)
          text = value.richText.map((r) => r.text).join("");
        else if ("hyperlink" in value) text = String(value.hyperlink);
        else issue = "UNSUPPORTED_CELL";
        text = cleanText(text);
        const redacted = text.replace(secretValue, "[REDACTED]");
        if (redacted !== text) {
          text = redacted;
          issue = "SENSITIVE_VALUE_REDACTED";
        }
        if (text.length > 10000) throw Error("CELL_TEXT_LIMIT");
        textBytes += Buffer.byteLength(text);
        if (textBytes > IMPORT_LIMITS.textBytes)
          throw Error("WORKBOOK_TEXT_LIMIT");
        return { text, issue };
      });
      rows.push({ rowNumber, cells });
    }
    if (rows.length > IMPORT_LIMITS.rowsPerSheet) throw Error("ROW_LIMIT");
    sheets.push({
      index,
      name,
      blocked: false,
      reason: null,
      headerRow,
      headers: headers.map((v) =>
        v.replace(secretValue, "[REDACTED]").slice(0, 200),
      ),
      rows,
    });
  }
  return { sheets, parserVersion: "land-xlsx-1" };
}
