"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  PublicPlaceDetailDTO,
  PublicPlaceList,
  type PublicCategory,
} from "@land/contracts";
import type { z } from "zod";
import type {
  LayerReadiness,
  ViewerConfig,
  ViewerPoint,
} from "../../../packages/spatial-types/src/viewer";
import { SpatialViewer } from "./spatial-viewer";
import { PlaceDetail } from "./place-detail";
interface Props {
  config: ViewerConfig;
  categories: z.infer<typeof PublicCategory>[];
  initialSlug: string | null;
}
async function readJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? "Địa điểm chưa được công bố hoặc không còn khả dụng."
        : "Không tải được dữ liệu. Vui lòng thử lại.",
    );
  return response.json();
}
export function PublicExplorer(props: Props) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <Explorer {...props} />
    </QueryClientProvider>
  );
}
function Explorer({ config, categories, initialSlug }: Props) {
  const [draft, setDraft] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [offset, setOffset] = useState(0),
    [slug, setSlug] = useState(initialSlug);
  const list = useQuery({
    queryKey: ["places", query, category, offset],
    queryFn: async ({ signal }) =>
      PublicPlaceList.parse(
        await readJson(
          `/api/public/places?${new URLSearchParams({ query, ...(category ? { category } : {}), offset: String(offset) })}`,
          signal,
        ),
      ),
  });
  const detail = useQuery({
    queryKey: ["place", slug],
    enabled: !!slug,
    queryFn: async ({ signal }) =>
      PublicPlaceDetailDTO.parse(
        await readJson(
          `/api/public/places/${encodeURIComponent(slug!)}`,
          signal,
        ),
      ),
  });
  useEffect(() => {
    const restore = () =>
      setSlug(new URL(window.location.href).searchParams.get("place"));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const points = useMemo<ViewerPoint[]>(() => {
    const items = [...(list.data?.items ?? [])];
    if (detail.data && !items.some((p) => p.id === detail.data.id))
      items.push(detail.data);
    return items.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      color: p.categories[0]!.color,
      state: "CURRENT",
    }));
  }, [list.data, detail.data]);
  const placesReadiness: LayerReadiness = list.isError
    ? "FAILED"
    : list.isPending
      ? "INITIALIZING"
      : "READY";
  const select = (next: string | null) => {
    setSlug(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("place", next);
    else url.searchParams.delete("place");
    window.history.pushState(null, "", url);
  };
  const panelMode = slug
    ? "selected"
    : query || category || list.isError
      ? "results"
      : "default";
  return (
    <div
      className="explorer"
      data-testid="map-shell"
      data-shell-state="READY"
      data-panel-state={panelMode}
    >
      <div className="explorer-map">
        <SpatialViewer
          config={config}
          points={points}
          selectedId={detail.data?.id ?? null}
          placesReadiness={placesReadiness}
          onSelect={(id) => {
            const p = list.data?.items.find((p) => p.id === id);
            if (p) select(p.slug);
          }}
        />
      </div>
      <form
        className="explorer-search-form"
        aria-label="Tìm địa điểm công khai"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(draft);
          setOffset(0);
        }}
      >
        <label className="sr-only" htmlFor="public-place-search">
          Tìm địa điểm
        </label>
        <svg
          className="explorer-search-icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
        >
          <path d="m20 20-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
        </svg>
        <input
          id="public-place-search"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={120}
          placeholder="Tìm địa điểm, khu vực…"
        />
        <button
          className="explorer-search-submit"
          type="submit"
          aria-label="Tìm kiếm"
        >
          Tìm
        </button>
        <details className="explorer-search-filter">
          <summary aria-label="Lọc theo danh mục" title="Lọc theo danh mục">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 6h16M7 12h10m-7 6h4" />
            </svg>
            <span className="sr-only">Lọc theo danh mục</span>
          </summary>
          <div className="explorer-filter-popover">
            <label className="explorer-category-field">
              Danh mục
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setOffset(0);
                }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>
      </form>
      <aside
        className={`explorer-panel explorer-panel--${panelMode}`}
        aria-label="Tìm kiếm và thông tin địa điểm"
      >
        <span className="sheet-handle" aria-hidden="true" />
        {slug ? (
          <>
            <div className="explorer-panel-toolbar">
              <span>ĐỊA ĐIỂM</span>
              <button
                className="panel-close"
                type="button"
                aria-label="Đóng chi tiết"
                onClick={() => select(null)}
              >
                ×
              </button>
            </div>
            {detail.isPending && <p role="status">Đang tải chi tiết…</p>}
            {detail.isError && <p role="alert">{detail.error.message}</p>}
            {detail.data && (
              <>
                <PlaceDetail place={detail.data} />
                <Link
                  className="place-share-link"
                  href={`/places/${detail.data.slug}`}
                >
                  Mở trang địa điểm / liên kết chia sẻ
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <header className="explorer-panel-heading">
              <p className="explorer-kicker">KHÁM PHÁ KHÔNG GIAN</p>
              <div>
                <h2>Địa điểm công khai</h2>
                <span>{list.data?.items.length ?? 0} kết quả</span>
              </div>
              <p>
                Vùng phủ sản phẩm hiện tại · không phải ranh giới hành chính.
              </p>
            </header>
            {list.isPending && <p role="status">Đang tải địa điểm…</p>}
            {list.isError && (
              <p role="alert">
                {list.error.message}
                <button type="button" onClick={() => void list.refetch()}>
                  Thử lại
                </button>
              </p>
            )}
            {list.data && (
              <>
                <div className="explorer-results-heading">
                  <strong>
                    {query || category ? "Kết quả tìm kiếm" : "Khám phá"}
                  </strong>
                  <span>
                    {list.data.items.length} kết quả
                    {offset > 0 ? ` · từ ${offset + 1}` : ""}
                  </span>
                </div>
                {!list.data.items.length && (
                  <div className="explorer-empty">
                    <strong>Chưa có địa điểm phù hợp</strong>
                    <p>
                      Chỉ Place đã qua các cổng nguồn và xuất bản mới xuất hiện
                      tại đây.
                    </p>
                  </div>
                )}
                <ul className="place-results">
                  {list.data.items.map((p) => (
                    <li key={p.id}>
                      <button
                        aria-pressed={slug === p.slug}
                        onClick={() => select(p.slug)}
                      >
                        <strong>{p.name}</strong>
                        <span>
                          {p.categories.map((c) => c.name).join(" · ")}
                        </span>
                        <small>Vị trí: {p.location.verificationStatus}</small>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="pagination">
                  {offset > 0 && (
                    <button onClick={() => setOffset(Math.max(0, offset - 50))}>
                      Trang trước
                    </button>
                  )}
                  {list.data.nextOffset !== null && (
                    <button onClick={() => setOffset(list.data!.nextOffset!)}>
                      Trang tiếp
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
