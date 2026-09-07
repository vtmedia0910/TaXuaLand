import Link from 'next/link';
export default function Home() {
  return (
    <main>
      <p>TÀ XÙA LAND</p>
      <h1>Nền tảng không gian</h1>
      <p>Khám phá địa điểm qua vị trí, nguồn dữ liệu và trạng thái xác minh.</p>
      <Link href="/map">Mở bản đồ Tà Xùa</Link>
    </main>
  );
}
