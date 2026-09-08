import Link from "next/link";
import { currentAdmin } from "../../../../lib/admin-actor";
import { listImports } from "@land/api/imports";
import { listSources } from "@land/api/registry";
import { ImportUpload } from "../../../../components/import-upload";
export default async function ImportsPage() {
  const actor = await currentAdmin(),
    [batches, sources] = await Promise.all([
      listImports(actor),
      listSources(actor),
    ]);
  return (
    <>
      <h1>Excel import</h1>
      <p>Upload → inspection → mapping → staging → review → commit bản nháp.</p>
      {actor.permissions.has("import") && <ImportUpload sources={sources} />}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Workbook</th>
              <th>Trạng thái</th>
              <th>Số dòng</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link href={`/admin/imports/${b.id}`}>{b.file_name}</Link>
                </td>
                <td>{b.status}</td>
                <td>{b.total_rows}</td>
                <td>
                  {new Date(b.uploaded_at).toLocaleString("vi-VN", {
                    timeZone: "Asia/Bangkok",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
