import * as Cesium from "cesium";
import {
  PublicPlaceMarkerPage,
  type PublicPlaceMarkerDTO,
} from "../../../../packages/contracts/src/index";
import type { ViewerPoint } from "../../../../packages/spatial-types/src/viewer";

export const PLACE_MARKER_PAGE_SIZE = 100;
export const PLACE_MARKER_VIEWPORT_LIMIT = 500;
export const PLACE_CLUSTER_PIXEL_RANGE = 50;
export const PLACE_CLUSTER_MINIMUM_SIZE = 15;

export function createPlaceDataSource() {
  return new Cesium.CustomDataSource("LAND places");
}

export interface MarkerBbox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export function clampMarkerBbox(viewport: MarkerBbox, aoi: MarkerBbox) {
  const bbox = {
    west: Math.max(viewport.west, aoi.west),
    south: Math.max(viewport.south, aoi.south),
    east: Math.min(viewport.east, aoi.east),
    north: Math.min(viewport.north, aoi.north),
  };
  return bbox.west < bbox.east && bbox.south < bbox.north ? bbox : null;
}

export function isMeaningfulMarkerViewport(
  previous: MarkerBbox | null,
  next: MarkerBbox,
) {
  if (!previous) return true;
  const scale = Math.max(
    previous.east - previous.west,
    previous.north - previous.south,
  );
  return (
    Math.max(
      Math.abs(previous.west - next.west),
      Math.abs(previous.south - next.south),
      Math.abs(previous.east - next.east),
      Math.abs(previous.north - next.north),
    ) >=
    scale * 0.1
  );
}

export function createLatestMarkerRequest() {
  let generation = 0;
  let controller: AbortController | null = null;
  return {
    next() {
      controller?.abort();
      controller = new AbortController();
      return { generation: ++generation, signal: controller.signal };
    },
    isCurrent(value: number) {
      return value === generation;
    },
    abort() {
      controller?.abort();
      controller = null;
      generation++;
    },
  };
}

export async function loadPublicPlaceMarkers(
  bbox: MarkerBbox,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
) {
  const items: PublicPlaceMarkerDTO[] = [];
  let offset = 0;
  let requestCount = 0;
  while (items.length < PLACE_MARKER_VIEWPORT_LIMIT) {
    const response = await fetcher(
      `/api/public/places/markers?${new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(bbox).map(([key, value]) => [key, String(value)]),
        ),
        limit: String(
          Math.min(
            PLACE_MARKER_PAGE_SIZE,
            PLACE_MARKER_VIEWPORT_LIMIT - items.length,
          ),
        ),
        offset: String(offset),
      })}`,
      { signal },
    );
    if (!response.ok) throw Error("PLACE_MARKERS_FAILED");
    const page = PublicPlaceMarkerPage.parse(await response.json());
    requestCount++;
    items.push(...page.items);
    if (page.nextOffset === null)
      return {
        points: items.map(markerPoint),
        markerCount: items.length,
        requestCount,
        truncated: false,
      };
    if (items.length >= PLACE_MARKER_VIEWPORT_LIMIT)
      return {
        points: items.map(markerPoint),
        markerCount: items.length,
        requestCount,
        truncated: page.truncated,
      };
    if (page.nextOffset <= offset) throw Error("PLACE_MARKERS_PAGINATION");
    offset = page.nextOffset;
  }
  throw Error("PLACE_MARKERS_LIMIT");
}

function markerPoint(marker: PublicPlaceMarkerDTO): ViewerPoint {
  return {
    id: marker.id,
    name: marker.name,
    location: marker.position,
    color: marker.presentationCategory.color,
    state: "CURRENT",
  };
}

export function configurePlaceClustering(dataSource: Cesium.CustomDataSource) {
  dataSource.clustering.enabled = true;
  dataSource.clustering.pixelRange = PLACE_CLUSTER_PIXEL_RANGE;
  dataSource.clustering.minimumClusterSize = PLACE_CLUSTER_MINIMUM_SIZE;
}

export function resolvePickedPlaceId(
  picked: unknown,
  dataSource: Cesium.CustomDataSource,
  allowSelection: boolean,
) {
  if (!allowSelection) return null;
  const id = (picked as { id?: unknown } | undefined)?.id;
  return id instanceof Cesium.Entity && dataSource.entities.contains(id)
    ? id.id
    : null;
}

export function isClusterPick(picked: unknown) {
  return Array.isArray((picked as { id?: unknown } | undefined)?.id);
}

export function syncPlaceEntities(
  dataSource: Cesium.CustomDataSource,
  points: ViewerPoint[],
  selectedId: string | null | undefined,
  renderSignatures: Map<string, string>,
) {
  const active = new Set<string>();
  dataSource.entities.suspendEvents();
  try {
    for (const point of points) {
      active.add(point.id);
      const selected = point.id === selectedId;
      const signature = JSON.stringify([
        point.name,
        point.location.longitude,
        point.location.latitude,
        point.color,
        point.state,
        selected,
      ]);
      if (renderSignatures.get(point.id) === signature) continue;
      const properties = {
        name: point.name,
        position: Cesium.Cartesian3.fromDegrees(
          point.location.longitude,
          point.location.latitude,
        ),
        point: {
          pixelSize: selected ? 18 : 11,
          color: Cesium.Color.fromCssColorString(
            point.state === "INVALID"
              ? "#f77777"
              : selected
                ? "#ffe3a0"
                : point.color,
          ),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: selected ? point.name : "",
          font: "14px sans-serif",
          pixelOffset: new Cesium.Cartesian2(0, -26),
          fillColor: Cesium.Color.WHITE,
          showBackground: true,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      };
      const entity = dataSource.entities.getById(point.id);
      if (entity) {
        entity.name = properties.name;
        entity.position = new Cesium.ConstantPositionProperty(
          properties.position,
        );
        entity.point = new Cesium.PointGraphics(properties.point);
        entity.label = new Cesium.LabelGraphics(properties.label);
      } else dataSource.entities.add({ id: point.id, ...properties });
      renderSignatures.set(point.id, signature);
    }
    for (const id of renderSignatures.keys())
      if (!active.has(id)) {
        dataSource.entities.removeById(id);
        renderSignatures.delete(id);
      }
  } finally {
    dataSource.entities.resumeEvents();
  }
}
