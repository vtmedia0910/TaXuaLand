import { currentAdmin } from "../../../../lib/admin-actor";
import { diagnostics } from "@land/api/registry";
import { TrustBadge } from "@land/ui/trust-badge";
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
