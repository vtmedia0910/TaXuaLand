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
        <Link href="/">TÀ XÙA LAND</Link>
        <nav>
          <Link href="/map">Bản đồ</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main
        className="map-page"
        data-testid="map-shell"
        data-shell-state="READY"
      >
        <div className="map-intro">
          <p>KHÔNG GIAN TÀ XÙA</p>
          <h1>Khám phá từ bản đồ</h1>
          <p>Vị trí, nguồn dữ liệu và trạng thái xác minh.</p>
        </div>
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
          Đang chuẩn bị cấu hình không gian…
        </div>
      </div>
      <aside className="explorer-panel" aria-busy="true">
        <p role="status">Đang tải dữ liệu địa điểm công khai…</p>
      </aside>
    </section>
  );
}
