"use client";
import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import type {
  LayerId,
  ViewerDiagnostics,
} from "../../../../packages/spatial-types/src/viewer";
import type { SpatialViewerProps } from "./types";
import { loadLandTerrain } from "./terrain-provider";
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
const layers: { id: LayerId; label: string }[] = [
  { id: "terrain", label: "Địa hình" },
  { id: "imagery", label: "Lưới nền" },
  { id: "roads", label: "Đường" },
  { id: "places", label: "Địa điểm" },
];
export default function ViewerEngine(props: SpatialViewerProps) {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<Cesium.Viewer | null>(null),
    placeLayer = useRef<Cesium.CustomDataSource | null>(null),
    roadLayer = useRef<Cesium.DataSource | null>(null),
    terrain = useRef<Cesium.TerrainProvider | null>(null),
    callbacks = useRef(props);
  const telemetry = useRef<ViewerDiagnostics | null>(null);
  const [ready, setReady] = useState(false),
    [generation, setGeneration] = useState(0),
    [settled, setSettled] = useState(false),
    [focusedId, setFocusedId] = useState<string | null>(null),
    [failed, setFailed] = useState(false),
    [notice, setNotice] = useState(""),
    [terrainState, setTerrainState] = useState("UNCONFIGURED"),
    [terrainDetails, setTerrainDetails] = useState(""),
    [roadsState, setRoadsState] = useState("UNCONFIGURED"),
    [renderedWidth, setRenderedWidth] = useState(0),
    [renderState, setRenderState] = useState("INITIALIZING"),
    [visible, setVisible] = useState<Record<LayerId, boolean>>({
      terrain: true,
      imagery: true,
      roads: true,
      places: true,
    });
  const visibility = useRef(visible);
  useEffect(() => {
    visibility.current = visible;
  }, [visible]);
  useEffect(() => {
    callbacks.current = props;
  }, [props]);
  useEffect(() => {
    let disposed = false,
      instance: Cesium.Viewer | null = null,
      handler: Cesium.ScreenSpaceEventHandler | null = null;
    const cleanup: Array<() => void> = [];
    const controller = new AbortController();
    cleanup.push(() => controller.abort());
    const start = performance.now();
    const diagnostics: ViewerDiagnostics = {
      initialized: false,
      webgl: false,
      terrainStatus: "UNCONFIGURED",
      imageryStatus: "PLACEHOLDER",
      terrainRelease: props.config.terrainRelease,
      roadsRelease: props.config.roadsRelease,
      failedRequests: 0,
      initializationMs: null,
      firstFrameMs: null,
      firstStableFrameMs: null,
      roadsStatus: "UNCONFIGURED",
      clientErrors: 0,
      placeLayerMs: null,
    };
    telemetry.current = diagnostics;
    const emit = () => callbacks.current.onDiagnostics?.({ ...diagnostics });
    async function initialize() {
      if (!host.current || props.forceFallback)
        throw Error("WEBGL_UNAVAILABLE");
      window.CESIUM_BASE_URL = "/cesium/";
      Cesium.Ion.defaultAccessToken = "";
      instance = new Cesium.Viewer(host.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayer: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        shadows: false,
        shouldAnimate: false,
        showRenderLoopErrors: false,
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        contextOptions: {
          webgl: { alpha: false, powerPreference: "high-performance" },
        },
      });
      if (disposed) {
        instance.destroy();
        return;
      }
      viewer.current = instance;
      const v = instance;
      v.resolutionScale = Math.min(window.devicePixelRatio, 1.5);
      v.scene.globe.baseColor = Cesium.Color.fromCssColorString("#233c45");
      v.scene.globe.depthTestAgainstTerrain = true;
      v.scene.globe.maximumScreenSpaceError = 4;
      const imagery = v.imageryLayers.addImageryProvider(
        new Cesium.GridImageryProvider({
          cells: 8,
          color: Cesium.Color.fromCssColorString("#89a8a0").withAlpha(0.2),
          backgroundColor: Cesium.Color.fromCssColorString("#243c42"),
          glowWidth: 0,
        }),
      );
      imagery.show = true;
      terrain.current = v.terrainProvider;
      v.scene.screenSpaceCameraController.minimumZoomDistance =
        props.config.minimumCameraHeight;
      v.scene.screenSpaceCameraController.maximumZoomDistance =
        props.config.maximumCameraHeight;
      const initial = props.config.initialView;
      v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          initial.longitude,
          initial.latitude,
          initial.heightMeters,
        ),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-55), roll: 0 },
      });
      const points = new Cesium.CustomDataSource("LAND places");
      points.clustering.enabled = true;
      points.clustering.pixelRange = 50;
      points.clustering.minimumClusterSize = 15;
      placeLayer.current = points;
      await v.dataSources.add(points);
      if (disposed) return;
      handler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas);
      const positionAt = (screen: Cesium.Cartesian2) => {
        const ray = v.camera.getPickRay(screen);
        if (!ray) return null;
        const cartesian = v.scene.globe.pick(ray, v.scene);
        if (!cartesian) return null;
        const geo = Cesium.Cartographic.fromCartesian(cartesian);
        return {
          longitude: Cesium.Math.toDegrees(geo.longitude),
          latitude: Cesium.Math.toDegrees(geo.latitude),
        };
      };
      handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
        const selected = v.scene.pick(event.position);
        if (Cesium.defined(selected) && selected.id instanceof Cesium.Entity) {
          callbacks.current.onSelect?.(selected.id.id);
        } else if (callbacks.current.picker) {
          const candidate = positionAt(event.position);
          if (candidate) callbacks.current.onCandidate?.(candidate);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      let dragging = false;
      handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
        if (!callbacks.current.picker) return;
        const selected = v.scene.pick(event.position);
        if (
          selected?.id instanceof Cesium.Entity &&
          selected.id.id === "candidate"
        ) {
          dragging = true;
          v.scene.screenSpaceCameraController.enableRotate = false;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      handler.setInputAction((event: { endPosition: Cesium.Cartesian2 }) => {
        if (!dragging) return;
        const position = positionAt(event.endPosition);
        if (position) callbacks.current.onCandidate?.(position);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      handler.setInputAction(() => {
        dragging = false;
        v.scene.screenSpaceCameraController.enableRotate = true;
      }, Cesium.ScreenSpaceEventType.LEFT_UP);
      cleanup.push(
        v.camera.moveEnd.addEventListener(() => {
          const p = v.camera.positionCartographic,
            b = callbacks.current.config.aoi;
          const lon = Cesium.Math.toDegrees(p.longitude),
            lat = Cesium.Math.toDegrees(p.latitude);
          if (
            lon < b.west - 0.15 ||
            lon > b.east + 0.15 ||
            lat < b.south - 0.15 ||
            lat > b.north + 0.15
          )
            v.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(
                Math.max(b.west - 0.15, Math.min(b.east + 0.15, lon)),
                Math.max(b.south - 0.15, Math.min(b.north + 0.15, lat)),
                Math.min(
                  p.height,
                  callbacks.current.config.maximumCameraHeight,
                ),
              ),
            });
        }),
      );
      diagnostics.initialized = true;
      diagnostics.webgl = true;
      diagnostics.initializationMs = Math.round(performance.now() - start);
      setReady(true);
      setGeneration((value) => value + 1);
      emit();
      let cameraMoving = false;
      let stableFrames = 0;
      cleanup.push(
        v.camera.moveStart.addEventListener(() => {
          cameraMoving = true;
          setSettled(false);
        }),
      );
      cleanup.push(
        v.camera.moveEnd.addEventListener(() => {
          cameraMoving = false;
          v.scene.requestRender();
        }),
      );
      const first = v.scene.postRender.addEventListener(() => {
        setRenderedWidth(v.scene.canvas.clientWidth);
        setRenderState(
          `tiles:${v.scene.globe.tilesLoaded};data:${v.dataSourceDisplay.ready};frames:${Math.min(stableFrames, 2)}`,
        );
        if (
          !cameraMoving &&
          v.scene.globe.tilesLoaded &&
          v.dataSourceDisplay.ready &&
          (!props.config.terrainUrl || diagnostics.terrainStatus === "READY") &&
          (!props.config.roadsUrl || diagnostics.roadsStatus === "READY")
        ) {
          stableFrames++;
          setSettled(stableFrames >= 2);
          if (stableFrames >= 2 && diagnostics.firstStableFrameMs === null) {
            diagnostics.firstStableFrameMs = Math.round(
              performance.now() - start,
            );
            emit();
          }
          if (stableFrames === 1) v.scene.requestRender();
        } else {
          stableFrames = 0;
          setSettled(false);
          if (
            diagnostics.terrainStatus !== "FAILED" &&
            diagnostics.roadsStatus !== "FAILED"
          )
            v.scene.requestRender();
        }
        if (diagnostics.firstFrameMs === null) {
          diagnostics.firstFrameMs = Math.round(performance.now() - start);
          emit();
        }
      });
      cleanup.push(first);
      cleanup.push(
        v.scene.renderError.addEventListener(() => {
          diagnostics.clientErrors++;
          emit();
          setFailed(true);
        }),
      );
      if (props.config.terrainUrl) {
        try {
          if (!props.config.terrainChecksum)
            throw Error("TERRAIN_CHECKSUM_REQUIRED");
          const { provider, manifest } = await loadLandTerrain(
            props.config.terrainUrl,
            props.config.terrainChecksum,
            controller.signal,
          );
          if (disposed) return;
          setTerrainDetails(
            `${manifest.source} · DSM ${manifest.resolutionMeters} m · ${manifest.verticalDatum}. ${manifest.liabilityNotice}`,
          );
          terrain.current = provider;
          setSettled(false);
          if (visibility.current.terrain) v.terrainProvider = provider;
          const ramp = document.createElement("canvas");
          ramp.width = 256;
          ramp.height = 1;
          const context = ramp.getContext("2d");
          if (context) {
            const gradient = context.createLinearGradient(0, 0, 256, 0);
            for (const [stop, color] of [
              [0, "#1b4b47"],
              [0.25, "#427554"],
              [0.5, "#8d9b62"],
              [0.75, "#b6a480"],
              [1, "#e5ddca"],
            ] as const)
              gradient.addColorStop(stop, color);
            context.fillStyle = gradient;
            context.fillRect(0, 0, 256, 1);
            v.scene.globe.material = Cesium.Material.fromType("ElevationRamp", {
              image: ramp,
              minimumHeight: manifest.heightRangeMeters[0],
              maximumHeight: manifest.heightRangeMeters[1],
            });
          }
          v.scene.requestRender();
          diagnostics.terrainStatus = "READY";
          setTerrainState("READY");
          cleanup.push(
            provider.errorEvent.addEventListener(() => {
              diagnostics.failedRequests++;
              diagnostics.terrainStatus = "FAILED";
              setTerrainState("FAILED");
              setNotice(
                "Có tile địa hình không tải được hoặc sai checksum. Không dùng vùng thiếu dữ liệu để đánh giá địa hình.",
              );
              emit();
            }),
          );
        } catch {
          if (disposed) return;
          diagnostics.terrainStatus = "FAILED";
          diagnostics.failedRequests++;
          setTerrainState("FAILED");
          setNotice(
            "Không tải được terrain release. Lớp nền hiện tại không thể dùng để đánh giá địa hình.",
          );
        }
      } else
        setNotice(
          "Chưa có terrain release được duyệt. Lưới nền không mô tả địa hình thực.",
        );
      if (props.config.roadsUrl) {
        try {
          v.creditDisplay.addStaticCredit(
            new Cesium.Credit(
              '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>',
              true,
            ),
          );
          const roads = await Cesium.GeoJsonDataSource.load(
            props.config.roadsUrl,
            {
              clampToGround: true,
              stroke: Cesium.Color.fromCssColorString("#f4c873"),
              strokeWidth: 3,
            },
          );
          if (disposed) return;
          roadLayer.current = roads;
          roads.show = visibility.current.roads;
          await v.dataSources.add(roads);
          setRoadsState("READY");
          diagnostics.roadsStatus = "READY";
          if (!disposed) v.scene.requestRender();
        } catch {
          if (disposed) return;
          setRoadsState("FAILED");
          diagnostics.roadsStatus = "FAILED";
          diagnostics.failedRequests++;
          setNotice("Không tải được lớp đường.");
        }
      }
      emit();
      // Rebuild/focus after real providers replace the initial ellipsoid.
      setGeneration((value) => value + 1);
      v.scene.requestRender();
    }
    initialize().catch(() => {
      if (!disposed) {
        diagnostics.clientErrors++;
        setFailed(true);
        emit();
      }
    });
    return () => {
      disposed = true;
      cleanup.forEach((fn) => fn());
      handler?.destroy();
      if (instance && !instance.isDestroyed()) instance.destroy();
      viewer.current = null;
      placeLayer.current = null;
      roadLayer.current = null;
      terrain.current = null;
    };
  }, [props.config, props.forceFallback]);
  useEffect(() => {
    const v = viewer.current,
      ds = placeLayer.current;
    if (!ready || !v || !ds || v.isDestroyed()) return;
    const layerStart = performance.now();
    ds.entities.removeAll();
    for (const p of props.points ?? []) {
      const selected = p.id === props.selectedId;
      ds.entities.add({
        id: p.id,
        name: p.name,
        position: Cesium.Cartesian3.fromDegrees(
          p.location.longitude,
          p.location.latitude,
        ),
        point: {
          pixelSize: selected ? 18 : 11,
          color: Cesium.Color.fromCssColorString(
            p.state === "INVALID" ? "#f77777" : selected ? "#ffe3a0" : p.color,
          ),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Infinity,
        },
        label: {
          text: selected ? p.name : "",
          font: "14px sans-serif",
          pixelOffset: new Cesium.Cartesian2(0, -26),
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Infinity,
        },
      });
    }
    v.scene.requestRender();
    if (telemetry.current) {
      telemetry.current.placeLayerMs = Math.round(
        performance.now() - layerStart,
      );
      callbacks.current.onDiagnostics?.({ ...telemetry.current });
    }
  }, [ready, generation, props.points, props.selectedId]);
  useEffect(() => {
    const v = viewer.current;
    if (!ready || !v || v.isDestroyed()) return;
    if (callbacks.current.picker && !props.focusRequest) return;
    const p = callbacks.current.points?.find((p) => p.id === props.selectedId);
    const entity = p && placeLayer.current?.entities.getById(p.id);
    let cancelled = false;
    if (p && entity) {
      setFocusedId(null);
      // Entity bounding sphere uses the rendered terrain-clamped position.
      // A zero-height geographic target would focus below a mountain marker.
      void v
        .flyTo(entity, {
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-70),
            3500,
          ),
          duration: 1,
        })
        .then((completed) => {
          if (!cancelled && completed && !v.isDestroyed()) {
            setFocusedId(p.id);
            v.scene.requestRender();
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [ready, generation, props.selectedId, props.focusRequest]);
  useEffect(() => {
    const v = viewer.current;
    if (!ready || !v || v.isDestroyed()) return;
    if (placeLayer.current) placeLayer.current.show = visible.places;
    if (roadLayer.current) roadLayer.current.show = visible.roads;
    v.imageryLayers.get(0).show = visible.imagery;
    if (terrain.current)
      v.terrainProvider = visible.terrain
        ? terrain.current
        : new Cesium.EllipsoidTerrainProvider();
    v.scene.requestRender();
  }, [ready, generation, visible]);
  const reset = (overhead = false) => {
    const v = viewer.current,
      p = props.config.initialView;
    if (v && !v.isDestroyed()) {
      setSettled(false);
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          p.longitude,
          p.latitude,
          p.heightMeters,
        ),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(overhead ? -90 : -55),
          roll: 0,
        },
        duration: 1,
        complete: () => v.scene.requestRender(),
      });
    }
  };
  return (
    <section className="viewer-with-source">
      <div
        className="spatial-viewer"
        data-testid="spatial-viewer"
        data-ready={ready && !failed ? "true" : "false"}
        data-settled={settled ? "true" : "false"}
        data-focused-id={focusedId ?? ""}
        data-terrain-status={terrainState}
        data-roads-status={roadsState}
        data-rendered-width={renderedWidth}
        data-render-state={renderState}
      >
        <div
          ref={host}
          className="cesium-host"
          hidden={failed}
          aria-label="Bản đồ không gian 3D"
        />
        {failed ? (
          <div className="viewer-fallback" role="status">
            <h2>Không mở được bản đồ 3D</h2>
            <p>
              Thiết bị hoặc trình duyệt chưa hỗ trợ WebGL. Bạn vẫn có thể tìm và
              đọc thông tin địa điểm bên cạnh.
            </p>
          </div>
        ) : (
          <>
            <div className="map-tools" aria-label="Lớp bản đồ">
              {layers.map((layer) => (
                <label key={layer.id}>
                  <input
                    type="checkbox"
                    checked={visible[layer.id]}
                    onChange={(event) =>
                      setVisible((v) => ({
                        ...v,
                        [layer.id]: event.target.checked,
                      }))
                    }
                  />
                  {layer.label}
                </label>
              ))}
              <button type="button" onClick={() => reset()}>
                Đặt lại góc nhìn
              </button>
              <button type="button" onClick={() => reset(true)}>
                Nhìn từ trên
              </button>
            </div>
            {!ready && (
              <div className="viewer-loading" role="status">
                Đang khởi tạo Cesium…
              </div>
            )}
            {notice && <p className="map-notice">{notice}</p>}
          </>
        )}
      </div>
      {terrainDetails && (
        <details className="terrain-attribution">
          <summary>Nguồn địa hình · {props.config.terrainRelease}</summary>
          <p>{terrainDetails}</p>
          <p>
            Cao độ xử lý không xác minh thực địa; độ chính xác tại địa điểm:
            UNKNOWN.
          </p>
        </details>
      )}
    </section>
  );
}
