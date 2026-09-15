import { describe, expect, it } from "vitest";
import type { ViewerPoint } from "../packages/spatial-types/src/viewer";
import {
  clampMarkerBbox,
  configurePlaceClustering,
  createLatestMarkerRequest,
  createPlaceDataSource,
  isClusterPick,
  isMeaningfulMarkerViewport,
  loadPublicPlaceMarkers,
  PLACE_CLUSTER_MINIMUM_SIZE,
  PLACE_CLUSTER_PIXEL_RANGE,
  resolvePickedPlaceId,
  syncPlaceEntities,
} from "../apps/web/components/spatial-viewer/place-markers";

const bbox = { west: 104.45, south: 21.2, east: 104.62, north: 21.35 };

function marker(index: number) {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    slug: `marker-${index}`,
    name: `Marker ${index}`,
    position: {
      longitude: 104.46 + (index % 100) * 0.0001,
      latitude: 21.21 + (index % 100) * 0.0001,
    },
    presentationCategory: {
      id: "10000000-0000-4000-8000-000000000000",
      code: "FIXTURE",
      name: "Synthetic fixture",
      color: "#0ea5ab",
    },
  };
}

function markerFetcher(total: number) {
  return (async (input: string | URL | Request) => {
    const url = new URL(String(input), "http://land.test");
    const offset = Number(url.searchParams.get("offset"));
    const limit = Number(url.searchParams.get("limit"));
    const items = Array.from(
      { length: Math.max(0, Math.min(limit, total - offset)) },
      (_, index) => marker(offset + index),
    );
    const nextOffset =
      offset + items.length < total ? offset + items.length : null;
    return Response.json({
      items,
      bbox,
      clamped: false,
      truncated: nextOffset !== null,
      nextOffset,
    });
  }) as typeof fetch;
}

describe("public Place viewport marker loading", () => {
  it.each([
    ["empty result", 0, 0, 1, false],
    ["one page", 100, 100, 1, false],
    ["multi-page bounded load", 250, 250, 3, false],
    ["ceiling-sized result", 500, 500, 5, false],
    ["truncation at ceiling", 501, 500, 5, true],
  ])("loads %s", async (_name, total, count, requests, truncated) => {
    const result = await loadPublicPlaceMarkers(
      bbox,
      new AbortController().signal,
      markerFetcher(total),
    );
    expect(result).toMatchObject({
      markerCount: count,
      requestCount: requests,
      truncated,
    });
    expect(result.points).toHaveLength(count);
  });

  it("clamps requests to the AOI and ignores insignificant moveEnd changes", () => {
    expect(
      clampMarkerBbox({ west: -180, south: -90, east: 180, north: 90 }, bbox),
    ).toEqual(bbox);
    expect(
      clampMarkerBbox({ west: 0, south: 0, east: 1, north: 1 }, bbox),
    ).toBeNull();
    expect(isMeaningfulMarkerViewport(null, bbox)).toBe(true);
    expect(
      isMeaningfulMarkerViewport(bbox, {
        ...bbox,
        west: bbox.west + 0.001,
      }),
    ).toBe(false);
    expect(
      isMeaningfulMarkerViewport(bbox, {
        ...bbox,
        west: bbox.west + 0.02,
      }),
    ).toBe(true);
  });

  it("aborts stale camera generations and accepts only the latest", () => {
    const requests = createLatestMarkerRequest();
    const stale = requests.next();
    const current = requests.next();
    expect(stale.signal.aborted).toBe(true);
    expect(requests.isCurrent(stale.generation)).toBe(false);
    expect(requests.isCurrent(current.generation)).toBe(true);
    requests.abort();
    expect(current.signal.aborted).toBe(true);
    expect(requests.isCurrent(current.generation)).toBe(false);
  });

  it("does not treat a cluster pick as a Place selection", () => {
    const dataSource = createPlaceDataSource();
    configurePlaceClustering(dataSource);
    const entity = dataSource.entities.add({ id: marker(1).id });
    const other = createPlaceDataSource().entities.add({ id: "road" });
    expect(dataSource.clustering).toMatchObject({
      enabled: true,
      pixelRange: PLACE_CLUSTER_PIXEL_RANGE,
      minimumClusterSize: PLACE_CLUSTER_MINIMUM_SIZE,
    });
    expect(resolvePickedPlaceId({ id: entity }, dataSource, true)).toBe(
      entity.id,
    );
    expect(resolvePickedPlaceId({ id: entity }, dataSource, false)).toBeNull();
    expect(isClusterPick({ id: [entity] })).toBe(true);
    expect(resolvePickedPlaceId({ id: [entity] }, dataSource, true)).toBeNull();
    expect(resolvePickedPlaceId({ id: other }, dataSource, true)).toBeNull();
  });

  it("reuses, updates, and removes entities while reconciling 500 markers", () => {
    const dataSource = createPlaceDataSource();
    const renderSignatures = new Map<string, string>();
    const points: ViewerPoint[] = Array.from({ length: 500 }, (_, index) => ({
      id: marker(index).id,
      name: `Marker ${index}`,
      location: marker(index).position,
      color: "#0ea5ab",
      state: "CURRENT",
    }));
    syncPlaceEntities(dataSource, points, null, renderSignatures);
    const unchanged = dataSource.entities.getById(points[0]!.id);
    const initialPosition = unchanged?.position?.getValue();
    syncPlaceEntities(dataSource, points, null, renderSignatures);
    expect(dataSource.entities.values).toHaveLength(500);
    expect(dataSource.entities.getById(points[0]!.id) === unchanged).toBe(true);
    const updatedPoint = {
      ...points[0]!,
      name: "Updated marker",
      location: { longitude: 104.6, latitude: 21.3 },
      color: "#112233",
    };
    syncPlaceEntities(
      dataSource,
      [updatedPoint, ...points.slice(1)],
      null,
      renderSignatures,
    );
    expect(dataSource.entities.getById(points[0]!.id)).toBe(unchanged);
    expect(unchanged?.name).toBe("Updated marker");
    expect(unchanged?.point?.pixelSize?.getValue()).toBe(11);
    expect(unchanged?.point?.color?.getValue()).toMatchObject({
      red: 17 / 255,
      green: 34 / 255,
      blue: 51 / 255,
      alpha: 1,
    });
    expect(unchanged?.position?.getValue()).not.toEqual(initialPosition);
    syncPlaceEntities(
      dataSource,
      [updatedPoint, ...points.slice(1)],
      updatedPoint.id,
      renderSignatures,
    );
    expect(dataSource.entities.getById(points[0]!.id)).toBe(unchanged);
    expect(unchanged?.point?.pixelSize?.getValue()).toBe(18);
    expect(dataSource.entities.getById(points[1]!.id)).toBeDefined();
    syncPlaceEntities(dataSource, points.slice(0, -1), null, renderSignatures);
    expect(dataSource.entities.values).toHaveLength(499);
    expect(dataSource.entities.getById(points.at(-1)!.id)).toBeUndefined();
    expect(renderSignatures.has(points.at(-1)!.id)).toBe(false);
    syncPlaceEntities(dataSource, [], null, renderSignatures);
    expect(dataSource.entities.values).toHaveLength(0);
    expect(renderSignatures).toHaveLength(0);
  });
});
