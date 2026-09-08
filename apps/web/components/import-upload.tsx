"use client";
import { useState } from "react";
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
          const response = await fetch(
            `/api/admin/imports?sourceId=${sourceId}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  file.type ||
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "X-File-Name": encodeURIComponent(file.name),
              },
              body: file,
            },
          );
          const result = await response.json();
          if (!response.ok)
            throw Error(result.error?.message ?? "Upload thất bại.");
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
