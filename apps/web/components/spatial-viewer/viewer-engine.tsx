"use client";
import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import type {
  LayerId,
  LayerReadiness,
  ViewerDiagnostics,
} from "../../../../packages/spatial-types/src/viewer";
import type { SpatialViewerProps } from "./types";
import { loadLandTerrain } from "./terrain-provider";
import {
  cameraFlightDuration,
  initialLayerReadiness,
  regionalCameraFrame,
} from "./viewer-state";
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
const layers: { id: LayerId; label: string }[] = [
  { id: "terrain", label: "Địa hình" },
  { id: "imagery", label: "Ảnh nền" },
  { id: "roads", label: "Đường" },
  { id: "places", label: "Địa điểm" },
];
const readinessLabels: Record<LayerReadiness, string> = {
  UNAVAILABLE: "Chưa khả dụng",
  INITIALIZING: "Đang khởi tạo",
  READY: "Sẵn sàng",
  FAILED: "Lỗi",
};

function hasWebGlSupport() {
  const canvas = document.createElement("canvas");
  return Boolean(
    (window.WebGL2RenderingContext || window.WebGLRenderingContext) &&
    (canvas.getContext("webgl2") || canvas.getContext("webgl")),
  );
}

function cameraFrameValue(camera: Cesium.Camera) {
  const position = camera.positionCartographic;
  const heading = ((Cesium.Math.toDegrees(camera.heading) % 360) + 360) % 360;
  return [
    Cesium.Math.toDegrees(position.longitude).toFixed(5),
    Cesium.Math.toDegrees(position.latitude).toFixed(5),
    position.height.toFixed(1),
    heading.toFixed(2),
    Cesium.Math.toDegrees(camera.pitch).toFixed(2),
  ].join(",");
}

export default function ViewerEngine(props: SpatialViewerProps) {
  const host = useRef<HTMLDivElement>(null),
    viewer = useRef<Cesium.Viewer | null>(null),
    placeLayer = useRef<Cesium.CustomDataSource | null>(null),
    roadLayer = useRef<Cesium.DataSource | null>(null),
    terrain = useRef<Cesium.TerrainProvider | null>(null),
    cameraTransition = useRef(0),
    cameraMoving = useRef(false),
    callbacks = useRef(props);
  const telemetry = useRef<ViewerDiagnostics | null>(null);
  const reducedMotion = useRef(false);
  const [ready, setReady] = useState(false),
    [generation, setGeneration] = useState(0),
    [retry, setRetry] = useState(0),
    [settled, setSettled] = useState(false),
    [focusedId, setFocusedId] = useState<string | null>(null),
    [failed, setFailed] = useState(false),
    [failureReason, setFailureReason] = useState<
      "WEBGL_UNAVAILABLE" | "CESIUM_FAILED" | null
    >(null),
    [cameraMotion, setCameraMotion] = useState<
      "IDLE" | "ANIMATED" | "REDUCED" | "INTERRUPTED"
    >("IDLE"),
    [cameraComplete, setCameraComplete] = useState(false),
    [cameraFrame, setCameraFrame] = useState(""),
    [notice, setNotice] = useState(""),
    [layerReadiness, setLayerReadiness] = useState(() =>
      initialLayerReadiness(props.config),
    ),
    [terrainDetails, setTerrainDetails] = useState(""),
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
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotion.current = media.matches;
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let disposed = false,
      instance: Cesium.Viewer | null = null,
      handler: Cesium.ScreenSpaceEventHandler | null = null;
    const cleanup: Array<() => void> = [];
    const controller = new AbortController();
    cleanup.push(() => controller.abort());
    const start = performance.now();
    const startingLayers = initialLayerReadiness(props.config);
    const diagnostics: ViewerDiagnostics = {
      initialized: false,
      webgl: false,
      layers: { ...startingLayers },
      terrainRelease: props.config.terrainRelease,
      roadsRelease: props.config.roadsRelease,
      failedRequests: 0,
      initializationMs: null,
      firstFrameMs: null,
      firstStableFrameMs: null,
      clientErrors: 0,
      placeLayerMs: null,
    };
    telemetry.current = diagnostics;
    const emit = () => callbacks.current.onDiagnostics?.({ ...diagnostics });
    const setLayer = (id: LayerId, state: LayerReadiness) => {
      diagnostics.layers[id] = state;
      setLayerReadiness({ ...diagnostics.layers });
      emit();
    };
    const failRenderableLayers = () => {
      for (const id of ["terrain", "imagery", "roads"] as const)
        if (diagnostics.layers[id] !== "UNAVAILABLE")
          diagnostics.layers[id] = "FAILED";
      diagnostics.layers.places =
        callbacks.current.placesReadiness ?? diagnostics.layers.places;
      setLayerReadiness({ ...diagnostics.layers });
    };
    async function initialize() {
      if (!host.current || props.forceFallback || !hasWebGlSupport())
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
      const initial = regionalCameraFrame(props.config, true);
      v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          initial.longitude,
          initial.latitude,
          initial.heightMeters,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(initial.headingDegrees),
          pitch: Cesium.Math.toRadians(initial.pitchDegrees),
          roll: 0,
        },
      });
      setCameraFrame(cameraFrameValue(v.camera));
      setCameraComplete(true);
      const points = new Cesium.CustomDataSource("LAND places");
      points.clustering.enabled = true;
      points.clustering.pixelRange = 50;
      points.clustering.minimumClusterSize = 15;
      placeLayer.current = points;
      await v.dataSources.add(points);
      if (disposed) return;
      setLayer("places", callbacks.current.placesReadiness ?? "READY");
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
        cameraTransition.current++;
        v.camera.cancelFlight();
        cameraMoving.current = false;
        setCameraMotion("INTERRUPTED");
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
      const interruptFlight = () => {
        cameraTransition.current++;
        v.camera.cancelFlight();
        cameraMoving.current = false;
        setCameraMotion("INTERRUPTED");
      };
      for (const eventType of [
        Cesium.ScreenSpaceEventType.MIDDLE_DOWN,
        Cesium.ScreenSpaceEventType.RIGHT_DOWN,
        Cesium.ScreenSpaceEventType.WHEEL,
        Cesium.ScreenSpaceEventType.PINCH_START,
      ])
        handler.setInputAction(interruptFlight, eventType);
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
      let stableFrames = 0;
      cleanup.push(
        v.camera.moveStart.addEventListener(() => {
          cameraMoving.current = true;
          setCameraComplete(false);
          setSettled(false);
        }),
      );
      cleanup.push(
        v.camera.moveEnd.addEventListener(() => {
          cameraMoving.current = false;
          setCameraComplete(true);
          v.scene.requestRender();
        }),
      );
      const first = v.scene.postRender.addEventListener(() => {
        setRenderedWidth(v.scene.canvas.clientWidth);
        setRenderState(
          `tiles:${v.scene.globe.tilesLoaded};data:${v.dataSourceDisplay.ready};frames:${Math.min(stableFrames, 2)}`,
        );
        if (
          !cameraMoving.current &&
          v.scene.globe.tilesLoaded &&
          v.dataSourceDisplay.ready &&
          (!props.config.terrainUrl ||
            diagnostics.layers.terrain === "READY") &&
          (!props.config.roadsUrl || diagnostics.layers.roads === "READY")
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
            diagnostics.layers.terrain !== "FAILED" &&
            diagnostics.layers.roads !== "FAILED"
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
          diagnostics.webgl = false;
          failRenderableLayers();
          setReady(false);
          setFailureReason("CESIUM_FAILED");
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
          setLayer("terrain", "READY");
          cleanup.push(
            provider.errorEvent.addEventListener(() => {
              diagnostics.failedRequests++;
              setLayer("terrain", "FAILED");
              setNotice(
                "Có tile địa hình không tải được hoặc sai checksum. Không dùng vùng thiếu dữ liệu để đánh giá địa hình.",
              );
              emit();
            }),
          );
        } catch {
          if (disposed) return;
          diagnostics.failedRequests++;
          setLayer("terrain", "FAILED");
          setNotice(
            "Không tải được terrain release. Lớp nền hiện tại không thể dùng để đánh giá địa hình.",
          );
        }
      } else
        setNotice(
          "Chưa có terrain release được duyệt. Lưới tham chiếu không mô tả địa hình thực.",
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
          setLayer("roads", "READY");
          if (!disposed) v.scene.requestRender();
        } catch {
          if (disposed) return;
          setLayer("roads", "FAILED");
          diagnostics.failedRequests++;
          setNotice("Không tải được lớp đường.");
        }
      }
      emit();
      // Rebuild/focus after real providers replace the initial ellipsoid.
      setGeneration((value) => value + 1);
      v.scene.requestRender();
    }
    initialize().catch((error: unknown) => {
      if (!disposed) {
        diagnostics.clientErrors++;
        failRenderableLayers();
        setReady(false);
        setFailed(true);
        setFailureReason(
          error instanceof Error && error.message === "WEBGL_UNAVAILABLE"
            ? "WEBGL_UNAVAILABLE"
            : "CESIUM_FAILED",
        );
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
  }, [props.config, props.forceFallback, retry]);
  useEffect(() => {
    if (!props.placesReadiness || !telemetry.current) return;
    telemetry.current.layers.places = props.placesReadiness;
    setLayerReadiness({ ...telemetry.current.layers });
    callbacks.current.onDiagnostics?.({ ...telemetry.current });
  }, [props.placesReadiness]);
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
      cameraTransition.current++;
      v.camera.cancelFlight();
      const duration = cameraFlightDuration(reducedMotion.current);
      setCameraMotion(duration === 0 ? "REDUCED" : "ANIMATED");
      // Entity bounding sphere uses the rendered terrain-clamped position.
      // A zero-height geographic target would focus below a mountain marker.
      void v
        .flyTo(entity, {
          offset: new Cesium.HeadingPitchRange(
            0,
            Cesium.Math.toRadians(-70),
            3500,
          ),
          duration,
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
      if (!v.isDestroyed()) v.camera.cancelFlight();
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
      frame = regionalCameraFrame(
        props.config,
        reducedMotion.current,
        overhead,
      );
    if (v && !v.isDestroyed()) {
      const transition = ++cameraTransition.current;
      v.camera.cancelFlight();
      cameraMoving.current = frame.durationSeconds !== 0;
      setCameraComplete(false);
      setSettled(false);
      setCameraMotion(frame.durationSeconds === 0 ? "REDUCED" : "ANIMATED");
      const view = {
        destination: Cesium.Cartesian3.fromDegrees(
          frame.longitude,
          frame.latitude,
          frame.heightMeters,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(frame.headingDegrees),
          pitch: Cesium.Math.toRadians(frame.pitchDegrees),
          roll: 0,
        },
      };
      if (frame.durationSeconds === 0) {
        v.camera.setView(view);
        cameraMoving.current = false;
        setCameraFrame(cameraFrameValue(v.camera));
        setCameraComplete(true);
        v.scene.requestRender();
      } else
        v.camera.flyTo({
          ...view,
          duration: frame.durationSeconds,
          complete: () => {
            if (cameraTransition.current !== transition) return;
            cameraTransition.current++;
            cameraMoving.current = false;
            setCameraFrame(cameraFrameValue(v.camera));
            setCameraComplete(true);
            v.scene.requestRender();
          },
        });
      if (frame.durationSeconds !== 0)
        window.setTimeout(
          () => {
            if (cameraTransition.current !== transition || v.isDestroyed())
              return;
            cameraTransition.current++;
            v.camera.cancelFlight();
            v.camera.setView(view);
            cameraMoving.current = false;
            setCameraFrame(cameraFrameValue(v.camera));
            setCameraComplete(true);
            v.scene.requestRender();
          },
          frame.durationSeconds * 1000 + 250,
        );
    }
  };
  return (
    <section className="viewer-with-source">
      <div
        className="spatial-viewer"
        data-testid="spatial-viewer"
        data-ready={ready && !failed ? "true" : "false"}
        data-cesium-state={failed ? "FAILED" : ready ? "READY" : "INITIALIZING"}
        data-camera-motion={cameraMotion}
        data-camera-complete={cameraComplete ? "true" : "false"}
        data-camera-frame={cameraFrame}
        data-settled={settled ? "true" : "false"}
        data-focused-id={focusedId ?? ""}
        data-terrain-status={layerReadiness.terrain}
        data-imagery-status={layerReadiness.imagery}
        data-roads-status={layerReadiness.roads}
        data-places-status={layerReadiness.places}
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
          <div className="viewer-fallback" role="alert">
            <h2>Không mở được bản đồ 3D</h2>
            <p>
              {failureReason === "WEBGL_UNAVAILABLE"
                ? "Thiết bị hoặc trình duyệt chưa cung cấp WebGL."
                : "Cesium không thể khởi tạo trong trình duyệt này."}{" "}
              Bạn vẫn có thể tìm và đọc thông tin địa điểm bên cạnh.
            </p>
            <button
              type="button"
              onClick={() => {
                setReady(false);
                setFailed(false);
                setFailureReason(null);
                setSettled(false);
                setLayerReadiness(initialLayerReadiness(props.config));
                setRetry((value) => value + 1);
              }}
            >
              Thử lại bản đồ 3D
            </button>
          </div>
        ) : (
          <>
            <div className="map-tools" aria-label="Điều khiển bản đồ">
              <details className="map-layer-control">
                <summary
                  role="button"
                  aria-label="Mở lớp bản đồ"
                  title="Lớp bản đồ"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m12 3 8 4-8 4-8-4 8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4" />
                  </svg>
                </summary>
                <div className="map-layer-menu">
                  <div className="map-layer-menu-heading">
                    <strong>Lớp bản đồ</strong>
                    <small>Hiển thị và trạng thái</small>
                  </div>
                  <label className="map-tool-base">
                    <input
                      type="checkbox"
                      aria-label="Lưới tham chiếu"
                      checked={visible.imagery}
                      onChange={(event) =>
                        setVisible((value) => ({
                          ...value,
                          imagery: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      Lưới tham chiếu
                      <small>Nền trung tính đang dùng</small>
                    </span>
                  </label>
                  {layers
                    .filter((layer) => layer.id !== "imagery")
                    .map((layer) => (
                      <label key={layer.id}>
                        <input
                          type="checkbox"
                          aria-label={layer.label}
                          checked={
                            visible[layer.id] &&
                            layerReadiness[layer.id] !== "UNAVAILABLE" &&
                            layerReadiness[layer.id] !== "FAILED"
                          }
                          disabled={
                            layerReadiness[layer.id] === "UNAVAILABLE" ||
                            layerReadiness[layer.id] === "FAILED"
                          }
                          onChange={(event) =>
                            setVisible((value) => ({
                              ...value,
                              [layer.id]: event.target.checked,
                            }))
                          }
                        />
                        <span>
                          {layer.label}
                          <small>
                            {readinessLabels[layerReadiness[layer.id]]}
                          </small>
                        </span>
                      </label>
                    ))}
                  <div className="map-layer-status">
                    <span>Ảnh nền</span>
                    <strong>{readinessLabels[layerReadiness.imagery]}</strong>
                  </div>
                  {notice && (
                    <p className="map-layer-notice" role="status">
                      {notice}
                    </p>
                  )}
                </div>
              </details>
              <button
                className="map-tool-button"
                type="button"
                aria-label="Đặt lại góc nhìn"
                title="Đặt lại góc nhìn"
                onClick={() => reset()}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m4 11 8-7 8 7m-14 0v9h12v-9m-8 9v-6h4v6" />
                </svg>
              </button>
              <button
                className="map-tool-button map-tool-overhead"
                type="button"
                aria-label="Nhìn từ trên"
                title="Nhìn từ trên"
                onClick={() => reset(true)}
              >
                <span aria-hidden="true">3D</span>
              </button>
            </div>
            {!ready && (
              <div className="viewer-loading" role="status">
                Đang khởi tạo Cesium…
              </div>
            )}
            {(layerReadiness.terrain === "FAILED" ||
              (layerReadiness.terrain === "UNAVAILABLE" &&
                layerReadiness.imagery === "UNAVAILABLE")) && (
              <p className="map-fallback-label">
                <strong>Lưới tham chiếu</strong>
                <span>
                  {layerReadiness.terrain === "FAILED"
                    ? "Địa hình lỗi; lớp nền hiện tại không dùng để đánh giá địa hình"
                    : "Địa hình và ảnh nền thực chưa khả dụng"}
                </span>
              </p>
            )}
          </>
        )}
      </div>
      <ul
        className="sr-only"
        aria-label="Trạng thái sẵn sàng của lớp bản đồ"
        aria-live="polite"
      >
        {layers.map((layer) => (
          <li key={layer.id}>
            <span>{layer.label}</span>
            <strong>{readinessLabels[layerReadiness[layer.id]]}</strong>
          </li>
        ))}
      </ul>
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
