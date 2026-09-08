"use client";
import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { importReview } from "@land/api/import-review";
import type {
  ViewerConfig,
  ViewerPoint,
} from "../../../packages/spatial-types/src/viewer";
import { SpatialViewer } from "./spatial-viewer";
import { adminRequest } from "./admin-request";
import { ImportCommit } from "./import-commit";
type Review = Awaited<ReturnType<typeof importReview>>;
type Row = Review["rows"][number];
export function ImportReview({
  review,
  config,
  categories,
  canImport,
}: {
  review: Review;
  config: ViewerConfig;
  categories: Array<{ id: string; name: string }>;
  canImport: boolean;
}) {
  const [selected, setSelected] = useState(review.rows[0]?.id ?? null),
    [filter, setFilter] = useState("ALL");
  const detailRef = useRef<HTMLDivElement>(null);
  const points = useMemo<ViewerPoint[]>(
    () =>
      review.rows.flatMap((row) =>
        row.normalized_data_json.location
          ? [
              {
                id: row.id,
                name: `Dòng ${row.row_number}: ${row.normalized_data_json.name || "(thiếu tên)"}`,
                location: row.normalized_data_json.location,
                color: row.validation_state === "VALID" ? "#8fe8ad" : "#f5c66c",
                state:
                  row.validation_state === "INVALID" ? "INVALID" : "CANDIDATE",
              },
            ]
          : [],
      ),
    [review.rows],
  );
  const row = review.rows.find((r) => r.id === selected);
  const visible = review.rows.filter(
    (r) =>
      filter === "ALL" ||
      r.validation_state === filter ||
      (filter === "UNREVIEWED" && r.admin_action === "REVIEW_LATER"),
  );
  return (
    <>
      <section className="card">
        <h2>Tổng hợp staging</h2>
        <div className="summary-grid">
          {Object.entries({
            "Tổng dòng": review.summary.total,
            "Hợp lệ": review.summary.valid,
            "Cảnh báo": review.summary.warnings,
            Lỗi: review.summary.invalid,
            "Có ứng viên trùng": review.summary.duplicates,
            "Thiếu tọa độ": review.summary.missingCoordinates,
            "Chưa quyết định": review.summary.unreviewed,
          }).map(([label, value]) => (
            <p key={label}>
              <strong>{value}</strong>
              <br />
              {label}
            </p>
          ))}
        </div>
        <p>
          Dòng thiếu/không hợp lệ tọa độ không được đặt lên bản đồ bằng tọa độ
          suy đoán. Điểm đỏ có vị trí đọc được nhưng còn lỗi khác.
        </p>
      </section>
      <SpatialViewer
        config={config}
        points={points}
        selectedId={selected}
        onSelect={(id) => {
          setSelected(id);
          detailRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      />
      <section className="card">
        <label>
          Lọc dòng
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["ALL", "VALID", "WARNING", "INVALID", "UNREVIEWED"].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <div className="table-scroll import-rows">
          <table>
            <thead>
              <tr>
                <th>Dòng</th>
                <th>Địa điểm</th>
                <th>Validation</th>
                <th>Quyết định</th>
                <th>Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} aria-selected={r.id === selected}>
                  <td>
                    <button onClick={() => setSelected(r.id)}>
                      Dòng {r.row_number}
                    </button>
                  </td>
                  <td>{r.normalized_data_json.name || "(Thiếu tên)"}</td>
                  <td>{r.validation_state}</td>
                  <td>{r.admin_action}</td>
                  <td>{r.issues.map((i) => i.code).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div ref={detailRef}>
        {row && (
          <RowReview
            key={`${row.id}:${review.batch.version}`}
            row={row}
            review={review}
            categories={categories}
            canImport={canImport}
          />
        )}
      </div>
      <ImportCommit
        key={review.batch.version}
        review={review}
        canImport={canImport}
      />
    </>
  );
}
function RowReview({
  row,
  review,
  categories,
  canImport,
}: {
  row: Row;
  review: Review;
  categories: Array<{ id: string; name: string }>;
  canImport: boolean;
}) {
  const original = row.normalized_data_json,
    [name, setName] = useState(original.name),
    [slug, setSlug] = useState(original.slug),
    [longitude, setLongitude] = useState(
      String(original.location?.longitude ?? ""),
    ),
    [latitude, setLatitude] = useState(
      String(original.location?.latitude ?? ""),
    ),
    [categoryIds, setCategoryIds] = useState(original.categoryIds),
    [description, setDescription] = useState(original.description),
    [action, setAction] = useState(row.admin_action),
    [target, setTarget] = useState(row.target_place_id ?? ""),
    [warnings, setWarnings] = useState(false),
    [corrected, setCorrected] = useState(false),
    [replacement, setReplacement] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  const changed =
    name !== original.name ||
    slug !== original.slug ||
    longitude !== String(original.location?.longitude ?? "") ||
    latitude !== String(original.location?.latitude ?? "") ||
    JSON.stringify(categoryIds) !== JSON.stringify(original.categoryIds) ||
    description !== original.description;
  async function save(revalidate = false) {
    setBusy(true);
    setMessage("");
    try {
      if (changed && !longitude.trim() !== !latitude.trim())
        throw Error("Nhập đủ kinh độ/vĩ độ.");
      const candidate = row.candidates.find((c) => c.id === target);
      const data = {
        ...original,
        name,
        slug,
        categoryIds,
        description,
        location:
          longitude.trim() && latitude.trim()
            ? { longitude: Number(longitude), latitude: Number(latitude) }
            : null,
      };
      await adminRequest(
        `/api/admin/imports/${review.batch.id}/rows/${row.id}`,
        "PATCH",
        {
          version: review.batch.version,
          action: revalidate ? "REVIEW_LATER" : action,
          targetPlaceId:
            !revalidate && action === "UPDATE" ? target || null : null,
          targetPlaceVersion:
            !revalidate && action === "UPDATE"
              ? (candidate?.version ?? null)
              : null,
          warningsAcknowledged: warnings,
          manualCorrectionConfirmed: corrected,
          replacementConfirmed: replacement,
          revalidate,
          ...(changed ? { data } : {}),
        },
      );
      router.refresh();
      setMessage("Đã lưu review dòng.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không lưu được review.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card editor-fields">
      <h2>Review dòng {row.row_number}</h2>
      <p>
        {row.validation_state} · {row.admin_action}
      </p>
      {row.issues.map((issue, i) => (
        <p role="status" key={i}>
          {issue.severity} · {issue.code}: {issue.message}
        </p>
      ))}
      <details>
        <summary>Dữ liệu gốc đã làm sạch và provenance</summary>
        <dl>
          {Object.entries(row.raw_data_json).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value || "(Trống)"}</dd>
            </div>
          ))}
        </dl>
        <p className="hash">SHA-256 dòng: {row.raw_payload_hash}</p>
        <p>SHA-256 workbook: {review.batch.file_hash}</p>
      </details>
      <fieldset
        disabled={
          !canImport || busy || review.batch.status !== "READY_FOR_REVIEW"
        }
        className="editor-fields"
      >
        <label>
          Tên dòng
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Slug dòng
          <input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>
        <div className="field-pair">
          <label>
            Kinh độ dòng
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </label>
          <label>
            Vĩ độ dòng
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </label>
        </div>
        <div>
          {categories.map((c) => (
            <label className="checkbox-label" key={c.id}>
              <input
                type="checkbox"
                checked={categoryIds.includes(c.id)}
                onChange={(e) =>
                  setCategoryIds((v) =>
                    e.target.checked
                      ? [...v, c.id]
                      : v.filter((id) => id !== c.id),
                  )
                }
              />
              {c.name}
            </label>
          ))}
        </div>
        <label>
          Mô tả dòng
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        {changed && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={corrected}
              onChange={(e) => setCorrected(e.target.checked)}
            />
            Tôi đã đối chiếu toàn bộ dữ liệu chỉnh sửa với dòng gốc. Dòng sẽ về
            Xem lại sau để tôi đọc kết quả kiểm tra mới; thao tác này không xác
            minh sự thật.
          </label>
        )}
        <label>
          Quyết định cho dòng
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as typeof action)}
          >
            <option value="REVIEW_LATER">Xem lại sau</option>
            <option value="CREATE">Tạo địa điểm mới</option>
            <option value="UPDATE">Cập nhật địa điểm có sẵn</option>
            <option value="SKIP">Bỏ qua</option>
          </select>
        </label>
        {action === "UPDATE" && (
          <label>
            Địa điểm đích
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Chọn ứng viên đã đối chiếu</option>
              {row.candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.slug} · v{c.version}
                </option>
              ))}
            </select>
          </label>
        )}
        {row.candidates.map((c) => (
          <p key={c.id}>
            <Link href={`/admin/places/${c.id}`} target="_blank">
              Đối chiếu {c.name}
            </Link>{" "}
            · {c.publication_status} · v{c.version}
          </p>
        ))}
        {action === "UPDATE" && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={replacement}
              onChange={(e) => setReplacement(e.target.checked)}
            />
            Tôi đã đối chiếu địa điểm đích và xác nhận thay thế toàn bộ nội
            dung/vị trí bằng dòng import; lưu lịch sử, chuyển về DRAFT và
            UNKNOWN.
          </label>
        )}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={warnings}
            onChange={(e) => setWarnings(e.target.checked)}
          />
          Tôi đã rà soát các cảnh báo và ứng viên trùng; không tự merge.
        </label>
        <button disabled={changed && !corrected} onClick={() => void save()}>
          Lưu quyết định dòng {row.row_number}
        </button>
        <button
          disabled={changed || row.validation_state === "INVALID"}
          onClick={() => void save(true)}
        >
          Kiểm tra lại dữ liệu hiện tại
        </button>
      </fieldset>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
