import { currentAdmin } from "../../../../lib/admin-actor";
import { listSources } from "@land/api/registry";
import { TrustBadge } from "@land/ui/trust-badge";
export default async function Sources() {
  const sources = await listSources(await currentAdmin());
  return (
    <>
      <p>REGISTRY / SOURCES</p>
      <h1>Nguồn dữ liệu</h1>
      <p>
        Authority của nguồn và trạng thái xác minh địa điểm là hai thông tin độc
        lập.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nguồn / authority</th>
              <th>License</th>
              <th>Hiển thị / phân phối</th>
              <th>CRS / freshness</th>
              <th>Kiểm tra gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.name}
                  <br />
                  <TrustBadge value={s.authorityLevel} />
                </td>
                <td>
                  {s.licenseName ?? "UNKNOWN"}
                  {s.licenseReference && (
                    <>
                      <br />
                      <a
                        href={s.licenseReference}
                        rel="noreferrer"
                        target="_blank"
                      >
                        License reference
                      </a>
                    </>
                  )}
                </td>
                <td>
                  <TrustBadge value={s.publicDisplay} />
                  <br />
                  <TrustBadge value={s.redistribution} />
                </td>
                <td>
                  {s.sourceCrs}
                  <br />
                  {s.freshnessClass}
                </td>
                <td>{s.lastCheckedAt ?? "UNKNOWN"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!sources.length && (
        <p>
          Chưa đăng ký nguồn. Nguồn chưa được phép công khai không thể xuất bản.
        </p>
      )}
    </>
  );
}
