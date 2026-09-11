"use client";
import { useState } from "react";
import { SpatialViewer } from "./spatial-viewer";
import type {
  ViewerConfig,
  ViewerDiagnostics,
} from "../../../packages/spatial-types/src/viewer";

export function ViewerDiagnosticsPanel({ config }: { config: ViewerConfig }) {
  const [enabled, setEnabled] = useState(false);
  const [data, setData] = useState<ViewerDiagnostics | null>(null);
  return (
    <section className="card">
      <h2>Viewer trong trình duyệt này</h2>
      <p>
        Phép đo cục bộ từ lúc khởi tạo Cesium. Khung ổn định cần camera dừng và
        tile/data source đã sẵn sàng.
      </p>
      <button onClick={() => setEnabled(!enabled)}>
        {enabled ? "Dừng kiểm tra viewer" : "Kiểm tra viewer"}
      </button>
      {enabled && <SpatialViewer config={config} onDiagnostics={setData} />}
      {data && (
        <dl data-testid="viewer-diagnostics">
          <dt>Cesium / WebGL</dt>
          <dd>
            {data.initialized ? "READY" : "NOT_READY"} /{" "}
            {data.webgl ? "SUPPORTED" : "UNAVAILABLE"}
          </dd>
          <dt>Terrain / imagery / roads / Places</dt>
          <dd>
            {data.layers.terrain} / {data.layers.imagery} / {data.layers.roads}{" "}
            / {data.layers.places}
          </dd>
          <dt>Release terrain / roads</dt>
          <dd>
            {data.terrainRelease ?? "UNKNOWN"} /{" "}
            {data.roadsRelease ?? "UNKNOWN"}
          </dd>
          <dt>Khởi tạo / khung đầu / khung ổn định (ms)</dt>
          <dd>
            {data.initializationMs ?? "UNKNOWN"} /{" "}
            {data.firstFrameMs ?? "UNKNOWN"} /{" "}
            <span data-testid="stable-frame-ms">
              {data.firstStableFrameMs ?? "UNKNOWN"}
            </span>
          </dd>
          <dt>Lớp điểm (ms)</dt>
          <dd>{data.placeLayerMs ?? "UNKNOWN"}</dd>
          <dt>Yêu cầu lỗi / lỗi client</dt>
          <dd>
            {data.failedRequests} / {data.clientErrors}
          </dd>
        </dl>
      )}
    </section>
  );
}
