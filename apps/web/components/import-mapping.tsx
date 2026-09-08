"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImportField } from "../../../packages/contracts/src/import";
import type { importBatch } from "@land/api/imports";
import { adminRequest } from "./admin-request";
type Inspection = Awaited<ReturnType<typeof importBatch>>;
export function ImportMapping({
  inspection,
  canImport,
}: {
  inspection: Inspection;
  canImport: boolean;
}) {
  const initial = inspection.sheets.find((s) => !s.blocked),
    [sheetIndex, setSheetIndex] = useState(initial?.index ?? -1),
    [mapping, setMapping] = useState<Record<string, ImportField>>(
      initial?.mapping ?? {},
    ),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter(),
    sheet = inspection.sheets.find((s) => s.index === sheetIndex);
  return (
    <section className="card">
      <h2>Chọn sheet và mapping</h2>
      <label>
        Sheet địa điểm
        <select
          value={sheetIndex}
          disabled={!canImport || busy}
          onChange={(e) => {
            const next = inspection.sheets.find(
              (s) => s.index === Number(e.target.value),
            );
            setSheetIndex(Number(e.target.value));
            setMapping(next?.mapping ?? {});
            setConfirmed(false);
          }}
        >
          {inspection.sheets.map((s) => (
            <option key={s.index} value={s.index} disabled={s.blocked}>
              {s.name} · {s.blocked ? "Đã chặn" : `${s.rowCount} dòng`}
            </option>
          ))}
        </select>
      </label>
      {inspection.sheets
        .filter((s) => s.blocked)
        .map((s) => (
          <p key={s.index}>
            {s.name}: {s.reason}
          </p>
        ))}
      <p>
        Gợi ý dưới đây chỉ dựa trên tên cột. Kiểm tra từng mapping trước khi
        staging. Tọa độ đầu vào là vĩ độ, kinh độ.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Cột Excel</th>
              <th>Trường nhập</th>
            </tr>
          </thead>
          <tbody>
            {sheet?.headers.map((header, index) => (
              <tr key={index}>
                <td>
                  {index + 1}. {header || "(Trống)"}
                </td>
                <td>
                  <select
                    aria-label={`Mapping cột ${index + 1}`}
                    value={mapping[String(index)] ?? ""}
                    disabled={!canImport || busy}
                    onChange={(e) => {
                      setMapping((previous) => {
                        const next = { ...previous };
                        if (e.target.value)
                          next[String(index)] = e.target.value as ImportField;
                        else delete next[String(index)];
                        return next;
                      });
                      setConfirmed(false);
                    }}
                  >
                    <option value="">Bỏ qua cột</option>
                    {ImportField.options.map((field) => (
                      <option key={field}>{field}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={!canImport}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        Tôi đã kiểm tra sheet, thứ tự tọa độ và mapping.
      </label>
      <button
        disabled={!canImport || !confirmed || busy || !sheet || sheet.blocked}
        onClick={async () => {
          setBusy(true);
          setMessage("");
          try {
            await adminRequest(
              `/api/admin/imports/${inspection.batch.id}/validate`,
              "POST",
              { version: inspection.batch.version, sheetIndex, mapping },
            );
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Không staging được workbook.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Đang kiểm tra và staging…" : "Chuẩn hóa và tạo staging"}
      </button>
      {message && <p role="alert">{message}</p>}
    </section>
  );
}
