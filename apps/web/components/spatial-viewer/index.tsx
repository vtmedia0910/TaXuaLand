"use client";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import type { SpatialViewerProps } from "./types";
const Engine = dynamic(() => import("./viewer-engine"), {
  ssr: false,
  loading: () => (
    <div
      className="spatial-viewer viewer-loading"
      role="status"
      data-testid="spatial-viewer"
      data-cesium-state="INITIALIZING"
    >
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
      <div
        className="spatial-viewer viewer-fallback"
        role="alert"
        data-testid="spatial-viewer"
        data-cesium-state="FAILED"
      >
        <h2>Không tải được bản đồ 3D</h2>
        <p>
          Bạn vẫn có thể tìm kiếm và đọc chi tiết địa điểm. Kiểm tra kết nối rồi
          tải lại trang để thử bản đồ.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Tải lại bản đồ 3D
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
