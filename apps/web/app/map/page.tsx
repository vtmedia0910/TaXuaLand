import Link from "next/link";
import { PublicExplorer } from "../../components/public-explorer";
import { publicLayers } from "@land/api/layers";
import { publicCategories } from "@land/api/public-places";
export const dynamic = "force-dynamic";
export default async function MapPage({
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
    <>
      <header className="public-header">
        <Link href="/">TÀ XÙA LAND</Link>
        <nav>
          <Link href="/map">Bản đồ</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>
      <main className="map-page">
        <div className="map-intro">
          <p>KHÔNG GIAN TÀ XÙA</p>
          <h1>Khám phá từ bản đồ</h1>
          <p>Vị trí, nguồn dữ liệu và trạng thái xác minh.</p>
        </div>
        <PublicExplorer
          config={config}
          categories={categories}
          initialSlug={params.place ?? null}
        />
      </main>
    </>
  );
}
