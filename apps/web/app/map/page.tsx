import Link from "next/link";
import { Suspense } from "react";
import { PublicExplorer } from "../../components/public-explorer";
import { publicLayers } from "@land/api/layers";
import { publicCategories } from "@land/api/public-places";
export const dynamic = "force-dynamic";
export default function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string }>;
}) {
  return (
    <>
      <header className="public-header">
        <Link className="land-brand" href="/">
          <svg aria-hidden="true" viewBox="0 0 44 36">
            <path d="M3 31 16 9l7 11 5-8 13 19H3Z" />
            <path d="m11 23 5-8 4 6 3-4 4 6" />
          </svg>
          <span>
            TÀ XÙA LAND
            <small>Không gian Tà Xùa</small>
          </span>
        </Link>
        <nav aria-label="Điều hướng công khai">
          <Link aria-current="page" href="/map">
            Khám phá
          </Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main
        className="map-page"
        data-testid="map-shell"
        data-shell-state="READY"
      >
        <h1 className="sr-only">Khám phá không gian Tà Xùa</h1>
        <Suspense fallback={<ExplorerLoading />}>
          <ExplorerData searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function ExplorerData({
  searchParams,
}: {
  searchParams: Promise<{ place?: string }>;
}) {
  const [config, categories, params] = await Promise.all([
    publicLayers(),
    publicCategories(),
    searchParams,
  ]);
  return (
    <PublicExplorer
      config={config}
      categories={categories}
      initialSlug={params.place ?? null}
    />
  );
}

function ExplorerLoading() {
  return (
    <section className="explorer" aria-label="Bản đồ và địa điểm công khai">
      <div className="explorer-map">
        <div className="spatial-viewer viewer-loading" role="status">
          <strong>Đang chuẩn bị không gian Tà Xùa</strong>
          <span>Đang tải cấu hình bản đồ công khai…</span>
        </div>
      </div>
      <aside className="explorer-panel" aria-busy="true">
        <span className="sheet-handle" aria-hidden="true" />
        <p className="explorer-kicker">KHÁM PHÁ KHÔNG GIAN</p>
        <h2>TÀ XÙA</h2>
        <p role="status">Đang tải dữ liệu địa điểm công khai…</p>
      </aside>
    </section>
  );
}
