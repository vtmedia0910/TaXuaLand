import Link from "next/link";
import { currentAdmin } from "../../../../lib/admin-actor";
import { listPlaces } from "@land/api/places";
import { listCategories } from "@land/api/categories";
import { listSources } from "@land/api/registry";
import { AdminPlaceList } from "../../../../components/admin-place-list";
import { CategoryCreate } from "../../../../components/category-create";
export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const actor = await currentAdmin(),
    params = await searchParams;
  const [rows, categories, sources] = await Promise.all([
    listPlaces(
      actor,
      Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    ),
    listCategories(actor),
    listSources(actor),
  ]);
  return (
    <>
      <h1>Địa điểm</h1>
      <Link href="/admin/places/new">Tạo địa điểm</Link>
      {actor.permissions.has("edit") && <CategoryCreate />}
      <form className="filter-grid" method="get">
        <label>
          Tìm tên
          <input name="query" defaultValue={params.query} />
        </label>
        <label>
          Danh mục
          <select name="categoryId" defaultValue={params.categoryId}>
            <option value="">Tất cả</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Xuất bản
          <select
            name="publicationStatus"
            defaultValue={params.publicationStatus}
          >
            <option value="">Tất cả</option>
            {["DRAFT", "PUBLISHED", "ARCHIVED"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Xác minh vị trí
          <select
            name="verificationStatus"
            defaultValue={params.verificationStatus}
          >
            <option value="">Tất cả</option>
            {["UNKNOWN", "DECLARED", "VERIFIED", "EXPIRED"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Nguồn
          <select name="sourceId" defaultValue={params.sourceId}>
            <option value="">Tất cả</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-label">
          <input
            name="missingCoordinate"
            value="true"
            type="checkbox"
            defaultChecked={params.missingCoordinate === "true"}
          />
          Thiếu tọa độ
        </label>
        <label className="checkbox-label">
          <input
            name="stale"
            value="true"
            type="checkbox"
            defaultChecked={params.stale === "true"}
          />
          Đã hết hạn
        </label>
        <button>Lọc địa điểm</button>
      </form>
      <AdminPlaceList rows={rows} permissions={[...actor.permissions]} />
      <nav className="pagination">
        {Number(params.offset ?? 0) > 0 && (
          <Link
            href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter((e): e is [string, string] => !!e[1])), offset: String(Math.max(0, Number(params.offset) - 50)) })}`}
          >
            Trang trước
          </Link>
        )}
        {rows.length === 50 && (
          <Link
            href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter((e): e is [string, string] => !!e[1])), offset: String(Number(params.offset ?? 0) + 50) })}`}
          >
            Trang tiếp
          </Link>
        )}
      </nav>
    </>
  );
}
