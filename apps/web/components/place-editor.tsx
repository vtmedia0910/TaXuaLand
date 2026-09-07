"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlaceInput } from "@land/api/place-input";
import type { getPlace } from "@land/api/places";
import type { listSources } from "@land/api/registry";
import type { listCategories } from "@land/api/categories";
import { makeSlug } from "../../../packages/domain/src/index";
import type {
  ViewerConfig,
  ViewerPoint,
} from "../../../packages/spatial-types/src/viewer";
import { SpatialViewer } from "./spatial-viewer";
import { PlaceWorkflowPanel } from "./place-workflow-panel";
import { adminRequest } from "./admin-request";
interface Props {
  record: Awaited<ReturnType<typeof getPlace>> | null;
  sources: Awaited<ReturnType<typeof listSources>>;
  categories: Awaited<ReturnType<typeof listCategories>>;
  config: ViewerConfig;
  permissions: string[];
}
function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label>
      {label}
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
export function PlaceEditor({
  record,
  sources,
  categories,
  config,
  permissions,
}: Props) {
  const initial =
    record?.data ??
    ({
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      areaName: "",
      internalNotes: "",
      sourceId: null,
      sourceObservedAt: null,
      location: null,
      horizontalAccuracyMeters: null,
      geometryChangeConfirmed: false,
      categoryIds: [],
      visitContext: {
        bestSeasonText: "",
        recommendedTimeText: "",
        difficulty: "",
        audienceText: "",
        guideRequirement: "",
      },
      accessContext: {
        accessMethodText: "",
        roadConditionText: "",
        routeNote: "",
        observedAt: null,
      },
      safetyNotes: [],
      media: [],
      externalReferences: [],
    } satisfies PlaceInput);
  const [data, setData] = useState<PlaceInput>(initial),
    [longitude, setLongitude] = useState(
      String(initial.location?.longitude ?? ""),
    ),
    [latitude, setLatitude] = useState(
      String(initial.location?.latitude ?? ""),
    ),
    [focus, setFocus] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [sourceRecords, setSourceRecords] = useState<
      Array<{ id: string; collected_at: string | null; notes: string }>
    >([]);
  const router = useRouter();
  const canEdit = permissions.includes("edit");
  const [candidateWarnings, setCandidateWarnings] = useState<
    Array<{ code: string; message: string }>
  >([]);
  const position = useMemo(
    () =>
      longitude.trim() &&
      latitude.trim() &&
      Number.isFinite(Number(longitude)) &&
      Number.isFinite(Number(latitude)) &&
      Math.abs(Number(longitude)) <= 180 &&
      Math.abs(Number(latitude)) <= 90
        ? { longitude: Number(longitude), latitude: Number(latitude) }
        : null,
    [longitude, latitude],
  );
  const invalidPosition =
    !position && (longitude.trim() !== "" || latitude.trim() !== "");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch("/api/admin/spatial/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(position),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw Error("Validation unavailable");
          return response.json() as Promise<
            Array<{ code: string; message: string }>
          >;
        })
        .then(setCandidateWarnings)
        .catch(() => {
          if (!controller.signal.aborted)
            setCandidateWarnings([
              {
                code: "VALIDATION_UNAVAILABLE",
                message:
                  "Chưa kiểm tra được vị trí với PostGIS. Không thể coi vị trí là hợp lệ.",
              },
            ]);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position]);
  const changedGeometry =
    JSON.stringify(initial.location) !== JSON.stringify(position) ||
    initial.horizontalAccuracyMeters !== data.horizontalAccuracyMeters;
  const dirty =
    JSON.stringify(data) !== JSON.stringify(initial) || changedGeometry;
  const points = useMemo<ViewerPoint[]>(() => {
    const all: ViewerPoint[] = [];
    if (record?.geometry)
      all.push({
        id: "current",
        name: "Vị trí đã lưu",
        location: {
          longitude: record.geometry.longitude,
          latitude: record.geometry.latitude,
        },
        color: "#6fc7ff",
        state: "CURRENT",
      });
    const lastVerified = record?.geometryHistory.find(
      (g) =>
        g.verification_status === "VERIFIED" && g.id !== record.geometry?.id,
    );
    if (lastVerified)
      all.push({
        id: "last-verified",
        name: "Vị trí đã xác minh trước đây",
        location: {
          longitude: lastVerified.longitude,
          latitude: lastVerified.latitude,
        },
        color: "#afebbd",
        state: "CURRENT",
      });
    if (position)
      all.push({
        id: "candidate",
        name: "Vị trí đề xuất",
        location: position,
        color: "#f4c873",
        state: "CANDIDATE",
      });
    return all;
  }, [record, position]);
  function update<K extends keyof PlaceInput>(key: K, value: PlaceInput[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      if (invalidPosition)
        throw new Error(
          "Tọa độ chưa hợp lệ. Nhập đủ kinh độ/vĩ độ, không tự đảo thứ tự.",
        );
      const input = PlaceInput.parse({ ...data, location: position });
      const result = await adminRequest<{ id: string }>(
        record ? `/api/admin/places/${record.place.id}` : "/api/admin/places",
        record ? "PATCH" : "POST",
        record ? { version: record.place.version, data: input } : input,
      );
      if (record) router.refresh();
      else router.replace(`/admin/places/${result.id}`);
      setMessage("Đã lưu bản nháp.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không lưu được dữ liệu.");
    } finally {
      setBusy(false);
    }
  }
  async function showRecords() {
    if (!data.sourceId) return;
    try {
      setSourceRecords(
        await adminRequest(
          `/api/admin/sources/${data.sourceId}/records`,
          "GET",
        ),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Không tải được nguồn.");
    }
  }
  return (
    <>
      <Link href="/admin/places">← Danh sách địa điểm</Link>
      <h1>{record ? record.place.name : "Tạo địa điểm"}</h1>
      <p>Mỗi lần sửa lưu thành bản nháp. Dữ liệu thiếu giữ là UNKNOWN.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={!canEdit || busy}>
          <section className="card editor-fields">
            <h2>Thông tin cơ bản</h2>
            <Field
              label="Tên địa điểm"
              value={data.name}
              onChange={(v) => update("name", v)}
            />
            <Field
              label="Slug"
              value={data.slug}
              onChange={(v) => update("slug", v)}
            />
            <button
              type="button"
              className="secondary"
              onClick={() => update("slug", makeSlug(data.name))}
            >
              Tạo slug từ tên
            </button>
            <Field
              label="Khu vực"
              value={data.areaName}
              onChange={(v) => update("areaName", v)}
            />
            <Field
              label="Mô tả ngắn"
              value={data.shortDescription}
              onChange={(v) => update("shortDescription", v)}
              multiline
            />
            <Field
              label="Nội dung"
              value={data.description}
              onChange={(v) => update("description", v)}
              multiline
            />
          </section>
          <section className="card editor-fields">
            <h2>Nguồn và provenance</h2>
            <label>
              Nguồn dữ liệu
              <select
                value={data.sourceId ?? ""}
                onChange={(e) => {
                  update("sourceId", e.target.value || null);
                  setSourceRecords([]);
                }}
              >
                <option value="">Chưa có nguồn</option>
                {sources.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    disabled={s.status === "DISABLED"}
                  >
                    {s.name} · {s.authorityLevel}
                  </option>
                ))}
              </select>
            </label>
            {data.sourceId && (
              <p>
                Quyền hiển thị công khai:{" "}
                {sources.find((s) => s.id === data.sourceId)?.publicDisplay ??
                  "UNKNOWN"}
                . Nguồn không tự xác minh vị trí.
              </p>
            )}
            <label>
              Ngày ghi nhận nguồn
              <input
                type="date"
                value={data.sourceObservedAt?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  update(
                    "sourceObservedAt",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
            </label>
            <Field
              label="Ghi chú nội bộ"
              value={data.internalNotes}
              onChange={(v) => update("internalNotes", v)}
              multiline
            />
          </section>
          <section className="card editor-fields">
            <h2>Danh mục</h2>
            {categories.map((c) => (
              <label className="checkbox-label" key={c.id}>
                <input
                  type="checkbox"
                  checked={data.categoryIds.includes(c.id)}
                  onChange={(e) =>
                    update(
                      "categoryIds",
                      e.target.checked
                        ? [...data.categoryIds, c.id]
                        : data.categoryIds.filter((id) => id !== c.id),
                    )
                  }
                />
                {c.name}
              </label>
            ))}
            {!categories.length && (
              <p>
                Chưa có danh mục. Thêm danh mục qua màn quản lý trước khi xuất
                bản.
              </p>
            )}
          </section>
          <section className="card editor-fields">
            <h2>Vị trí · WGS84 / EPSG:4326</h2>
            <div className="field-pair">
              <Field
                label="Kinh độ (longitude)"
                value={longitude}
                onChange={(v) => {
                  setLongitude(v);
                  update("geometryChangeConfirmed", false);
                }}
              />
              <Field
                label="Vĩ độ (latitude)"
                value={latitude}
                onChange={(v) => {
                  setLatitude(v);
                  update("geometryChangeConfirmed", false);
                }}
              />
            </div>
            <label>
              Độ chính xác ngang (m), để trống nếu UNKNOWN
              <input
                type="number"
                min="0"
                step="any"
                value={data.horizontalAccuracyMeters ?? ""}
                onChange={(e) => {
                  update(
                    "horizontalAccuracyMeters",
                    e.target.value === "" ? null : Number(e.target.value),
                  );
                  update("geometryChangeConfirmed", false);
                }}
              />
            </label>
            {invalidPosition && (
              <p role="alert">
                Tọa độ không hợp lệ hoặc thiếu một thành phần. Không tự đảo kinh
                độ/vĩ độ.
              </p>
            )}
            {candidateWarnings.map((w) => (
              <p role="status" key={w.code}>
                {w.code}: {w.message}
              </p>
            ))}
            <button
              type="button"
              disabled={!position}
              onClick={() => setFocus((v) => v + 1)}
            >
              Đưa camera tới vị trí đề xuất
            </button>
            <p>
              Nhấp bản đồ để đặt điểm đề xuất; kéo điểm vàng để điều chỉnh. Xanh
              dương: vị trí đã lưu. Xanh nhạt: vị trí xác minh trước đây (nếu
              có).
            </p>
            <SpatialViewer
              config={config}
              points={points}
              selectedId="candidate"
              picker={canEdit}
              focusRequest={focus}
              onCandidate={(p) => {
                setLongitude(String(p.longitude));
                setLatitude(String(p.latitude));
                update("geometryChangeConfirmed", false);
              }}
            />
            {record && changedGeometry && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={data.geometryChangeConfirmed}
                  onChange={(e) =>
                    update("geometryChangeConfirmed", e.target.checked)
                  }
                />
                Xác nhận đổi vị trí/độ chính xác; bản cũ được giữ trong lịch sử
                và vị trí mới trở về UNKNOWN.
              </label>
            )}
            <p>
              AOI {config.aoi.version} · {config.aoi.source}
            </p>
            {record?.nearbyRoad ? (
              <p>
                Đường được lập bản đồ gần nhất:{" "}
                {record.nearbyRoad.name ?? "Không có tên"} · cách{" "}
                {Math.round(record.nearbyRoad.distance_m)} m · release{" "}
                {record.nearbyRoad.version}. Khoảng cách không xác nhận khả năng
                tiếp cận hay an toàn.
              </p>
            ) : (
              <p>
                Chưa có ngữ cảnh đường đã công bố trong phạm vi 5 km (UNKNOWN).
              </p>
            )}
          </section>
          <section className="card editor-fields">
            <h2>Thông tin tham quan</h2>
            {(
              [
                ["bestSeasonText", "Mùa phù hợp"],
                ["recommendedTimeText", "Thời gian phù hợp"],
                ["difficulty", "Độ khó"],
                ["audienceText", "Đối tượng"],
                ["guideRequirement", "Yêu cầu hướng dẫn viên"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={data.visitContext[key]}
                onChange={(v) =>
                  update("visitContext", { ...data.visitContext, [key]: v })
                }
              />
            ))}
          </section>
          <section className="card editor-fields">
            <h2>Thông tin tiếp cận</h2>
            {(
              [
                ["accessMethodText", "Phương thức tiếp cận"],
                ["roadConditionText", "Mô tả tình trạng đường"],
                ["routeNote", "Ghi chú đường đi"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={data.accessContext[key]}
                onChange={(v) =>
                  update("accessContext", { ...data.accessContext, [key]: v })
                }
                multiline
              />
            ))}
            <label>
              Ngày ghi nhận tiếp cận
              <input
                type="date"
                value={data.accessContext.observedAt?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  update("accessContext", {
                    ...data.accessContext,
                    observedAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
              />
            </label>
          </section>
          <section className="card editor-fields">
            <h2>Ghi chú an toàn</h2>
            {data.safetyNotes.map((note, index) => (
              <div className="repeat-row" key={index}>
                <Field
                  label={`Ghi chú an toàn ${index + 1}`}
                  value={note.note}
                  onChange={(v) =>
                    update(
                      "safetyNotes",
                      data.safetyNotes.map((s, i) =>
                        i === index ? { ...s, note: v } : s,
                      ),
                    )
                  }
                  multiline
                />
                {(["observedAt", "expiresAt"] as const).map((key) => (
                  <label key={key}>
                    {key === "observedAt" ? "Ngày ghi nhận" : "Ngày hết hạn"}
                    <input
                      type="date"
                      value={note[key]?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        update(
                          "safetyNotes",
                          data.safetyNotes.map((s, i) =>
                            i === index
                              ? {
                                  ...s,
                                  [key]: e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : null,
                                }
                              : s,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "safetyNotes",
                      data.safetyNotes.filter((_, i) => i !== index),
                    )
                  }
                >
                  Bỏ ghi chú {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={data.safetyNotes.length >= 30}
              onClick={() =>
                update("safetyNotes", [
                  ...data.safetyNotes,
                  { note: "", observedAt: null, expiresAt: null },
                ])
              }
            >
              Thêm ghi chú an toàn
            </button>
          </section>
          <section className="card editor-fields">
            <h2>Media</h2>
            {data.media.map((m, index) => (
              <div className="repeat-row" key={index}>
                <label>
                  Loại media
                  <select
                    value={m.mediaType}
                    onChange={(e) =>
                      update(
                        "media",
                        data.media.map((v, i) =>
                          i === index
                            ? {
                                ...v,
                                mediaType: e.target.value as typeof m.mediaType,
                              }
                            : v,
                        ),
                      )
                    }
                  >
                    {["IMAGE", "VIDEO_LINK", "PANORAMA_360", "DRONE_IMAGE"].map(
                      (t) => (
                        <option key={t}>{t}</option>
                      ),
                    )}
                  </select>
                </label>
                {(
                  [
                    ["sourceUrl", "URL media HTTPS"],
                    ["title", "Tiêu đề media"],
                    ["altText", "Mô tả thay thế"],
                  ] as const
                ).map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    value={m[key] ?? ""}
                    onChange={(v) =>
                      update(
                        "media",
                        data.media.map((row, i) =>
                          i === index ? { ...row, [key]: v } : row,
                        ),
                      )
                    }
                  />
                ))}
                <label>
                  Ngày chụp
                  <input
                    type="date"
                    value={m.capturedAt?.slice(0, 10) ?? ""}
                    onChange={(e) =>
                      update(
                        "media",
                        data.media.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                capturedAt: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "media",
                      data.media.filter((_, i) => i !== index),
                    )
                  }
                >
                  Bỏ media {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={data.media.length >= 50}
              onClick={() =>
                update("media", [
                  ...data.media,
                  {
                    mediaType: "IMAGE",
                    sourceUrl: "",
                    title: null,
                    altText: "",
                    capturedAt: null,
                  },
                ])
              }
            >
              Thêm media
            </button>
          </section>
          <section className="card editor-fields">
            <h2>Liên kết ngoài</h2>
            {data.externalReferences.map((ref, index) => (
              <div key={index} className="repeat-row">
                <Field
                  label="Nhà cung cấp liên kết"
                  value={ref.provider}
                  onChange={(v) =>
                    update(
                      "externalReferences",
                      data.externalReferences.map((r, i) =>
                        i === index ? { ...r, provider: v } : r,
                      ),
                    )
                  }
                />
                <Field
                  label="URL liên kết HTTPS"
                  value={ref.externalUrl}
                  onChange={(v) =>
                    update(
                      "externalReferences",
                      data.externalReferences.map((r, i) =>
                        i === index ? { ...r, externalUrl: v } : r,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "externalReferences",
                      data.externalReferences.filter((_, i) => i !== index),
                    )
                  }
                >
                  Bỏ liên kết {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={data.externalReferences.length >= 20}
              onClick={() =>
                update("externalReferences", [
                  ...data.externalReferences,
                  { provider: "", externalUrl: "" },
                ])
              }
            >
              Thêm liên kết ngoài
            </button>
          </section>
          {canEdit && (
            <button
              type="submit"
              disabled={
                invalidPosition ||
                (!!record && changedGeometry && !data.geometryChangeConfirmed)
              }
            >
              Lưu bản nháp
            </button>
          )}
        </fieldset>
      </form>
      {message && <p role="status">{message}</p>}
      {record && (
        <>
          <section className="card">
            <h2>Bản ghi nguồn</h2>
            <button
              disabled={!data.sourceId}
              onClick={() => void showRecords()}
            >
              Xem các bản ghi của nguồn
            </button>
            {sourceRecords.map((r) => (
              <p className="hash" key={r.id}>
                {r.id} · {r.collected_at ?? "UNKNOWN"} · {r.notes}
              </p>
            ))}
          </section>
          <PlaceWorkflowPanel
            record={record}
            permissions={permissions}
            dirty={dirty}
          />
          <section className="card">
            <h2>Tóm tắt audit</h2>
            {record.audit.map((event, i) => (
              <p key={i}>
                {event.action} ·{" "}
                {new Date(event.created_at).toLocaleString("vi-VN")} ·{" "}
                {event.correlation_id}
              </p>
            ))}
          </section>
        </>
      )}
    </>
  );
}
