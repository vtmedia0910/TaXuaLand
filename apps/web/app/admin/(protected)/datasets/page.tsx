import { currentAdmin } from "../../../../lib/admin-actor";
import { listDatasets } from "@land/api/registry";
import { TrustBadge } from "@land/ui/trust-badge";
import { ReleasePublishButton } from "../../../../components/release-publish-button";
export default async function Datasets() {
  const actor = await currentAdmin(),
    datasets = await listDatasets(actor),
    canConfigure = actor.permissions.has("configure");
  return (
    <>
      <p>REGISTRY / DATASETS</p>
      <h1>Dataset & release</h1>
      <p>
        Release lưu phiên bản nguồn, CRS, datum và checksum. APPROVED chưa phải
        PUBLISHED; chỉ release đã duyệt và giao đủ object mới có thể xuất bản.
      </p>
      {datasets.length === 0 && <p>Chưa có dataset được đăng ký.</p>}
      {datasets.map((d) => (
        <section className="card" key={d.id}>
          <h2>{d.name}</h2>
          <p>
            {d.code} · {d.sourceName}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Release</th>
                  <th>CRS</th>
                  <th>Datum / resolution</th>
                  <th>Trạng thái</th>
                  <th>Checksum</th>
                  {canConfigure && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {d.releases.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.version}
                      <br />
                      {r.sourceVersion} / {r.processingVersion}
                    </td>
                    <td>
                      {r.sourceCrs} → {r.targetCrs}
                    </td>
                    <td>
                      {r.verticalDatum}
                      <br />
                      {r.resolution ?? "UNKNOWN"}
                    </td>
                    <td>
                      <TrustBadge value={r.qaStatus} />
                    </td>
                    <td className="hash">{r.checksum}</td>
                    {canConfigure && (
                      <td>
                        {r.qaStatus === "APPROVED" ? (
                          <ReleasePublishButton
                            releaseId={r.id}
                            version={r.version}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
