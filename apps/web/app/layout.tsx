import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "TÀ XÙA LAND",
  description: "Nền tảng dữ liệu không gian Tà Xùa",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
