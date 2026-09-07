"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { listPlaces } from "@land/api/places";
import { adminRequest } from "./admin-request";
export function AdminPlaceList({
  rows,
  permissions,
}: {
  rows: Awaited<ReturnType<typeof listPlaces>>;
  permissions: string[];
}) {
  const [selected, setSelected] = useState<string[]>([]),
    [confirmed, setConfirmed] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function bulk(action: "ARCHIVE" | "PUBLISH") {
    setBusy(true);
    setError("");
    try {
      await adminRequest("/api/admin/places/bulk", "POST", {
        action,
        confirmed,
        items: rows
          .filter((r) => selected.includes(r.id))
          .map((r) => ({
            id: r.id,
            version: r.version,
            ...(action === "PUBLISH"
              ? {
                  reviewed: true,
                  warningsAcknowledged: false,
                  acknowledgedLocationStatus:
                    r.verification_status ?? "UNKNOWN",
                }
              : {}),
          })),
      });
      setSelected([]);
      setConfirmed(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Chọn</th>
              <th>Địa điểm</th>
              <th>Trạng thái</th>
              <th>Vị trí</th>
              <th>Nguồn</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Chọn ${p.name}`}
                    checked={selected.includes(p.id)}
                    onChange={(e) => {
                      setSelected((v) =>
                        e.target.checked
                          ? [...v, p.id]
                          : v.filter((id) => id !== p.id),
                      );
                      setConfirmed(false);
                    }}
                  />
                </td>
                <td>
                  <Link href={`/admin/places/${p.id}`}>{p.name}</Link>
                  <small className="block-text">{p.slug}</small>
                </td>
                <td>
                  {p.publication_status}
                  <br />
                  {p.verification_status ?? "UNKNOWN"}
                </td>
                <td>
                  {p.latitude == null
                    ? "Thiếu tọa độ"
                    : `${p.latitude}, ${p.longitude}`}
                </td>
                <td>{p.source_name ?? "UNKNOWN"}</td>
                <td>
                  {new Date(p.updated_at).toLocaleString("vi-VN", {
                    timeZone: "Asia/Bangkok",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p>Chưa có địa điểm phù hợp.</p>}
      {selected.length > 0 && (
        <section className="card">
          <p>
            {selected.length} địa điểm được chọn. Xuất bản hàng loạt chỉ áp dụng
            cho bản ghi qua toàn bộ kiểm tra và không có cảnh báo chưa xử lý.
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Tôi đã rà soát các địa điểm được chọn và xác nhận thao tác.
          </label>
          <div className="action-row">
            {permissions.includes("edit") && (
              <button
                disabled={!confirmed || busy}
                onClick={() => void bulk("ARCHIVE")}
              >
                Lưu trữ các địa điểm đã chọn
              </button>
            )}
            {permissions.includes("publish") && (
              <button
                disabled={!confirmed || busy}
                onClick={() => void bulk("PUBLISH")}
              >
                Xuất bản các địa điểm đã chọn
              </button>
            )}
          </div>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
