"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { importReview } from "@land/api/import-review";
import { adminRequest } from "./admin-request";
export function ImportCommit({
  review,
  canImport,
}: {
  review: Awaited<ReturnType<typeof importReview>>;
  canImport: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  const result = review.batch.commit_result;
  if (result)
    return (
      <section className="card" aria-label="Kết quả commit">
        <h2>Đã commit vào bản nháp</h2>
        <p>
          Tạo mới: {result.created} · Cập nhật: {result.updated} · Bỏ qua:{" "}
          {result.skipped}
        </p>
        <p>
          Các quan sát import giữ UNKNOWN; xuất bản cần review riêng trong địa
          điểm.
        </p>
        <ul>
          {result.rows.map((r) => (
            <li key={r.rowNumber}>
              Dòng {r.rowNumber} · {r.action}
              {r.placeId && (
                <>
                  {" "}
                  · <Link href={`/admin/places/${r.placeId}`}>Mở bản nháp</Link>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  const counts = { CREATE: 0, UPDATE: 0, SKIP: 0, REVIEW_LATER: 0 };
  for (const row of review.rows) counts[row.admin_action]++;
  async function commit() {
    setBusy(true);
    setMessage("");
    try {
      await adminRequest(
        `/api/admin/imports/${review.batch.id}/commit`,
        "POST",
        { version: review.batch.version, confirmed },
      );
      setConfirmed(false);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Chưa commit được lô.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card editor-fields">
      <h2>Commit các quyết định đã lưu</h2>
      <p>
        Tạo mới: {counts.CREATE} · Cập nhật: {counts.UPDATE} · Bỏ qua:{" "}
        {counts.SKIP} · Chưa quyết định: {counts.REVIEW_LATER}
      </p>
      <p>
        Toàn bộ lô được ghi trong một transaction. Lỗi ở bất kỳ dòng nào sẽ hủy
        toàn bộ lần ghi. Dòng cập nhật thay thế nội dung và vị trí đã chọn, lưu
        lịch sử, đưa địa điểm về DRAFT và quan sát import về UNKNOWN.
      </p>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={busy || !canImport}
        />
        Tôi xác nhận các quyết định đã lưu và ghi lô này vào bản nháp.
      </label>
      <button
        disabled={
          !canImport ||
          !confirmed ||
          busy ||
          counts.REVIEW_LATER > 0 ||
          review.batch.status !== "READY_FOR_REVIEW"
        }
        onClick={() => void commit()}
      >
        {busy ? "Đang ghi lô…" : "Commit vào bản nháp"}
      </button>
      {message && <p role="alert">{message}</p>}
    </section>
  );
}
