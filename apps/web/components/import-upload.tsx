"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function ImportUpload({
  sources,
}: {
  sources: Array<{ id: string; name: string; status: string }>;
}) {
  const [file, setFile] = useState<File | null>(null),
    [sourceId, setSourceId] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  const retry = useRef<{
    file: File;
    sourceId: string;
    requestId: string;
  } | null>(null);
  return (
    <form
      className="card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!file || !sourceId) return;
        setBusy(true);
        setMessage("");
        try {
          if (file.size > 8 * 1024 * 1024) throw Error("File vượt 8 MiB.");
          if (
            !retry.current ||
            retry.current.file !== file ||
            retry.current.sourceId !== sourceId
          )
            retry.current = { file, sourceId, requestId: crypto.randomUUID() };
          const digest = Array.from(
            new Uint8Array(
              await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
            ),
            (b) => b.toString(16).padStart(2, "0"),
          ).join("");
          const response = await fetch("/api/admin/imports/upload-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              requestId: retry.current.requestId,
              sourceId,
              name: file.name,
              mime:
                file.type ||
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              size: file.size,
              sha256: digest,
            }),
          });
          const result = await response.json();
          if (!response.ok) {
            if (response.status === 410) retry.current = null;
            throw Error(result.error?.message ?? "Upload thất bại.");
          }
          if (result.upload) {
            const uploaded = await fetch(result.upload.url, {
              method: result.upload.method,
              headers: result.upload.headers,
              body: file,
              credentials:
                result.transport === "local" ? "same-origin" : "omit",
            });
            // A retry can find an immutable object from a prior successful PUT.
            if (!uploaded.ok && uploaded.status !== 412)
              throw Error("Upload workbook thất bại. Thử lại cùng file.");
          }
          const finalized = await fetch(
            `/api/admin/imports/${result.id}/finalize-upload`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            },
          );
          if (!finalized.ok)
            throw Error(
              (await finalized.json()).error?.message ??
                "Không thể kiểm tra workbook.",
            );
          retry.current = null;
          router.push(`/admin/imports/${result.id}`);
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Upload thất bại.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Tải workbook</h2>
      <p>
        Chỉ .xlsx, tối đa 8 MiB và 2.000 dòng/sheet. Sheet tài khoản, sheet ẩn
        và macro không được nhập. Upload chỉ bắt đầu inspection, chưa tạo địa
        điểm.
      </p>
      <label>
        Nguồn của lô import
        <select
          required
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
        >
          <option value="">Chọn nguồn đã đăng ký</option>
          {sources
            .filter((s) => s.status !== "DISABLED")
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Workbook Excel
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <button disabled={busy || !file || !sourceId}>
        {busy ? "Đang kiểm tra workbook…" : "Tải lên và kiểm tra workbook"}
      </button>
      {message && <p role="alert">{message}</p>}
    </form>
  );
}
