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
        <Link
          className="land-brand"
          href="/"
          aria-label="TÀ XÙA LAND · Trang chủ"
        >
          <BrandMark />
          <span className="land-brand-copy">
            <strong>TÀ XÙA LAND</strong>
            <small>Khám phá · Kết nối · Bảo tồn</small>
          </span>
        </Link>
        <nav className="public-nav-primary" aria-label="Điều hướng công khai">
          <Link aria-current="page" href="/map">
            <RailIcon kind="map" />
            <span>Bản đồ</span>
          </Link>
          <a href="#public-place-search">
            <RailIcon kind="search" />
            <span>Tìm kiếm</span>
          </a>
          <Link href="/">
            <RailIcon kind="home" />
            <span>Trang chủ</span>
          </Link>
        </nav>
        <nav className="public-nav-utility" aria-label="Tiện ích">
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main className="map-page">
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
    <section
      className="explorer"
      data-testid="map-shell"
      data-shell-state="INITIALIZING"
      aria-label="Bản đồ và địa điểm công khai"
    >
      <div className="explorer-map">
        <div className="spatial-viewer viewer-loading" role="status">
          <strong>Đang chuẩn bị không gian Tà Xùa</strong>
          <span>Đang tải cấu hình bản đồ công khai…</span>
        </div>
      </div>
      <div
        className="explorer-search-form explorer-search-loading"
        role="status"
      >
        Đang tải tìm kiếm địa điểm công khai…
      </div>
      <aside
        className="explorer-panel explorer-panel--default"
        aria-busy="true"
      >
        <span className="sheet-handle" aria-hidden="true" />
        <p className="explorer-kicker">KHÁM PHÁ KHÔNG GIAN</p>
        <h2>Địa điểm công khai</h2>
        <p>Đang tải dữ liệu…</p>
      </aside>
    </section>
  );
}

function BrandMark() {
  return (
    <svg className="land-brand-mark" aria-hidden="true" viewBox="0 0 82 52">
      <path
        className="brand-mountain-fill"
        d="M2 45 22 12l9 15L43 5l19 31 7-12 11 21H2Z"
      />
      <path
        className="brand-mountain-line"
        d="m4 43 18-29 9 15L43 7l19 31 7-12 10 17"
      />
      <path
        className="brand-snow-line"
        d="m15 26 7-12 5 9 4-5 4 7 8-18 7 12 4-5 8 14"
      />
      <path className="brand-ground-line" d="M2 45h78" />
    </svg>
  );
}

function RailIcon({ kind }: { kind: "map" | "search" | "home" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {kind === "map" && (
        <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Zm5-2v14m6-12v14" />
      )}
      {kind === "search" && (
        <path d="m20 20-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
      )}
      {kind === "home" && <path d="m3 11 9-7 9 7m-16 0v9h14v-9m-9 9v-6h4v6" />}
    </svg>
  );
}
