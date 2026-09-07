"use client";
import dynamic from "next/dynamic";
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
  return <Engine {...props} />;
}
