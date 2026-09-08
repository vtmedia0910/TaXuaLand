import { currentAdmin } from "../../../../lib/admin-actor";
import { diagnostics } from "@land/api/registry";
import { TrustBadge } from "@land/ui/trust-badge";
import { publicLayers } from "@land/api/layers";
import { ViewerDiagnosticsPanel } from "../../../../components/viewer-diagnostics";
export default async function Diagnostics() {
  const data = await diagnostics(await currentAdmin());
  return (
    <>
      <p>OPERATIONS / DIAGNOSTICS</p>
      <h1>Chẩn đoán hệ thống</h1>
      <section className="card">
        <h2>Spatial database</h2>
        <TrustBadge value={data.database} />
        <p>
          {data.sources.length} nguồn · {data.datasets.length} dataset
        </p>
      </section>
      <ViewerDiagnosticsPanel config={await publicLayers()} />
      <h2>Nguồn và release</h2>
      {data.sources.map((source) => (
        <section className="card" key={source.id}>
          <h3>{source.name}</h3>
          <p>
            {source.status} · {source.licenseName ?? "UNKNOWN"} · Freshness:{" "}
            {source.freshnessClass}
          </p>
          <p>
            Kiểm tra nguồn: {source.lastCheckedAt ?? "UNKNOWN"} · Rà soát
            license: {source.legalReviewedAt ?? "UNKNOWN"}
          </p>
        </section>
      ))}
      {data.datasets.map((dataset) => (
        <section className="card" key={dataset.id}>
          <h3>
            {dataset.code} · {dataset.sourceName}
          </h3>
          {dataset.releases.slice(0, 5).map((release) => (
            <p key={release.id}>
              {release.version} · {release.qaStatus} · {release.sourceCrs} →{" "}
              {release.targetCrs} / {release.verticalDatum} ·{" "}
              {release.resolution ?? "UNKNOWN"} m
            </p>
          ))}
        </section>
      ))}
      <h2>Excel import · 30 batch gần nhất</h2>
      {data.imports.map((batch) => (
        <section className="card" key={batch.id}>
          <h3>
            <a href={`/admin/imports/${batch.id}`}>{batch.id}</a>
          </h3>
          <p>
            {batch.status} · Validation:{" "}
            {batch.validationDurationMs ?? "UNKNOWN"} ms
          </p>
          <p>
            {batch.totalRows} dòng · {batch.validRows} valid ·{" "}
            {batch.warningRows} warning · {batch.invalidRows} invalid ·{" "}
            {batch.duplicateRows} dòng có ứng viên trùng
          </p>
          <p>
            {batch.errors
              .map((error) => `${error.category}: ${error.count}`)
              .join(" · ") || "Không có lỗi validation"}
          </p>
          <p>
            {batch.commitResult
              ? `Commit: tạo ${batch.commitResult.created}, cập nhật ${batch.commitResult.updated}, bỏ qua ${batch.commitResult.skipped}`
              : "Chưa commit"}
          </p>
        </section>
      ))}
      <h2>Providers</h2>
      {data.providers.length === 0 && <p>Chưa cấu hình provider.</p>}
      {data.providers.map((p) => (
        <section className="card" key={p.id}>
          <h3>
            {p.id} · {p.type}
          </h3>
          <TrustBadge value={p.credentialStatus} />
          <p>
            Health: {p.healthStatus} · Kiểm tra: {p.lastCheckedAt ?? "UNKNOWN"}
          </p>
          <p>
            {p.killSwitch
              ? "Kill switch bật"
              : p.enabled
                ? "Đang bật"
                : "Đã tắt"}
          </p>
        </section>
      ))}
    </>
  );
}
