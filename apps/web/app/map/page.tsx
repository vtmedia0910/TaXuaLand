import Link from "next/link";
import { SpatialViewer } from "../../components/spatial-viewer";
import { publicLayers } from "@land/api/layers";
export const dynamic = "force-dynamic";
export default async function MapPage() {
  const config = await publicLayers();
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
        <SpatialViewer config={config} />
      </main>
    </>
  );
}
