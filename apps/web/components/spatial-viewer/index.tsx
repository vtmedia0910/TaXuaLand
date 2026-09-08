"use client";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import type { SpatialViewerProps } from "./types";
const Engine = dynamic(() => import("./viewer-engine"), {
  ssr: false,
  loading: () => (
    <div className="viewer-loading" role="status">
      Đang tải bản đồ 3D…
    </div>
  ),
});
export function SpatialViewer(props: SpatialViewerProps) {
  return (
    <ViewerBoundary>
      <Engine {...props} />
    </ViewerBoundary>
  );
}
class ViewerBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="viewer-fallback" role="status">
        <h2>Không tải được bản đồ 3D</h2>
        <p>
          Bạn vẫn có thể tìm kiếm và đọc chi tiết địa điểm. Kiểm tra kết nối rồi
          tải lại trang để thử bản đồ.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}
