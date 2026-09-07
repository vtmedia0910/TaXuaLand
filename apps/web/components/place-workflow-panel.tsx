"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { getPlace } from "@land/api/places";
import { adminRequest } from "./admin-request";
type Record = Awaited<ReturnType<typeof getPlace>>;
export function PlaceWorkflowPanel({
  record,
  permissions,
  dirty,
}: {
  record: Record;
  permissions: string[];
  dirty: boolean;
}) {
  const [subject, setSubject] = useState("LOCATION"),
    [status, setStatus] = useState("UNKNOWN"),
    [method, setMethod] = useState(""),
    [evidence, setEvidence] = useState(""),
    [freshness, setFreshness] = useState("UNKNOWN"),
    [expiry, setExpiry] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [warnings, setWarnings] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function act(action: "verify" | "publish" | "archive") {
    setBusy(true);
    setMessage("");
    try {
      const locationStatus = record.geometryEffectiveStatus;
      const data =
        action === "verify"
          ? {
              version: record.place.version,
              subject: subject.startsWith("SAFETY:") ? "SAFETY" : subject,
              ...(subject.startsWith("SAFETY:")
                ? { safetyNoteId: subject.split(":")[1] }
                : {}),
              status,
              method: method.trim() || null,
              evidenceSourceRecordId: evidence.trim() || null,
              freshnessPolicy: freshness,
              expiresAt: expiry ? new Date(expiry).toISOString() : null,
              confirmed,
            }
          : action === "publish"
            ? {
                version: record.place.version,
                reviewed,
                warningsAcknowledged: warnings,
                acknowledgedLocationStatus: locationStatus,
              }
            : { version: record.place.version };
      await adminRequest(
        `/api/admin/places/${record.place.id}${action === "archive" ? "" : `/${action}`}`,
        action === "archive" ? "DELETE" : "POST",
        data,
      );
      setConfirmed(false);
      setReviewed(false);
      setMessage("Đã ghi nhận thao tác và audit.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="card">
        <h2>Xác minh</h2>
        <p>
          Trạng thái vị trí hiện tại: {record.geometryEffectiveStatus}. Việc
          chọn VERIFIED cần bằng chứng, phương pháp và chính sách độ mới rõ
          ràng.
        </p>
        <p>
          Lần xác minh:{" "}
          {record.geometry?.verified_at
            ? new Date(record.geometry.verified_at).toLocaleString("vi-VN")
            : "UNKNOWN"}
        </p>
        {permissions.includes("verify") && (
          <fieldset disabled={dirty || busy}>
            <label>
              Nội dung cần xác minh
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setConfirmed(false);
                }}
              >
                <option value="LOCATION">Vị trí</option>
                <option value="ACCESS">Thông tin tiếp cận</option>
                {record.verificationRecords
                  .filter((r) => r.subject === "SAFETY")
                  .map((r, i) => (
                    <option key={r.id} value={`SAFETY:${r.id}`}>
                      Ghi chú an toàn {i + 1}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Trạng thái mới
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setConfirmed(false);
                }}
              >
                {["UNKNOWN", "DECLARED", "VERIFIED"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Phương pháp xác minh
              <input
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Ghi rõ cách đối chiếu thực tế"
                maxLength={200}
              />
            </label>
            <label>
              ID source record làm bằng chứng
              <input
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="UUID của bản ghi bằng chứng"
              />
            </label>
            <p>
              ID này phải trỏ đến bản ghi nguồn có sẵn. Không dùng sự tồn tại
              của tọa độ làm bằng chứng xác minh.
            </p>
            <label>
              Chính sách độ mới
              <select
                value={freshness}
                onChange={(e) => setFreshness(e.target.value)}
              >
                {["UNKNOWN", "NO_EXPIRY", "EXPIRES"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Hết hạn (giờ trên thiết bị)
              <input
                type="datetime-local"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Tôi chịu trách nhiệm về bằng chứng và xác nhận thay đổi xác minh.
            </label>
            <button
              type="button"
              disabled={!confirmed}
              onClick={() => void act("verify")}
            >
              Ghi nhận xác minh
            </button>
          </fieldset>
        )}
        <details>
          <summary>Lịch sử và bằng chứng hiện có</summary>
          {record.geometryHistory.map((g) => (
            <p key={g.id}>
              {g.latitude}, {g.longitude} · {g.verification_status} ·{" "}
              {g.verification_method ?? "UNKNOWN"} ·{" "}
              {new Date(g.valid_from).toLocaleString("vi-VN")}
              {g.valid_to ? " — đã đóng" : " — hiện tại"}
            </p>
          ))}
          {record.verificationRecords.map((r) => (
            <p key={`${r.subject}:${r.id}`}>
              {r.subject} · {r.verification_status} · Bằng chứng:{" "}
              {r.evidence_source_record_id ?? "UNKNOWN"}
            </p>
          ))}
        </details>
      </section>
      <section className="card">
        <h2>Xuất bản</h2>
        <p>
          {record.place.publication_status} · Phiên bản {record.place.version}
        </p>
        {record.warnings.map((w) => (
          <p role="alert" key={w.code}>
            {w.code}: {w.message}
          </p>
        ))}
        {dirty && (
          <p>Lưu bản nháp và rà soát lại trước khi xác minh hoặc xuất bản.</p>
        )}
        {permissions.includes("publish") && (
          <fieldset disabled={dirty || busy}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              Tôi đã rà soát nội dung, nguồn và trạng thái xác minh vị trí đang
              hiển thị.
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={warnings}
                onChange={(e) => setWarnings(e.target.checked)}
              />
              Tôi đã kiểm tra và chấp nhận các cảnh báo không chặn.
            </label>
            <button
              type="button"
              disabled={
                !reviewed ||
                record.warnings.some((w) => w.severity === "INVALID")
              }
              onClick={() => void act("publish")}
            >
              Xuất bản địa điểm
            </button>
          </fieldset>
        )}
        {permissions.includes("edit") && (
          <details>
            <summary>Lưu trữ địa điểm</summary>
            <p>Ẩn địa điểm khỏi công khai, giữ dữ liệu và lịch sử.</p>
            <button
              disabled={dirty || busy}
              onClick={() => void act("archive")}
            >
              Xác nhận lưu trữ địa điểm
            </button>
          </details>
        )}
      </section>
      {message && <p role="status">{message}</p>}
    </>
  );
}
