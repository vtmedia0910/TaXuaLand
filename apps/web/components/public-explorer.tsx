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
  const select = (next: string | null) => {
    setSlug(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("place", next);
    else url.searchParams.delete("place");
    window.history.pushState(null, "", url);
  };
  return (
    <div className="explorer">
      <div className="explorer-map">
        <SpatialViewer
          config={config}
          points={points}
          selectedId={detail.data?.id ?? null}
          onSelect={(id) => {
            const p = list.data?.items.find((p) => p.id === id);
            if (p) select(p.slug);
          }}
        />
      </div>
      <aside
        className="explorer-panel"
        aria-label="Tìm kiếm và thông tin địa điểm"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draft);
            setOffset(0);
          }}
        >
          <label>
            Tìm địa điểm
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={120}
              placeholder="Tên địa điểm…"
            />
          </label>
          <label>
            Danh mục
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setOffset(0);
              }}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Tìm kiếm</button>
        </form>
        {list.isPending && <p role="status">Đang tải địa điểm…</p>}
        {list.isError && (
          <p role="alert">
            {list.error.message}
            <button onClick={() => void list.refetch()}>Thử lại</button>
          </p>
        )}
        {list.data && (
          <>
            <p>
              {list.data.items.length} kết quả
              {offset > 0 ? ` · từ ${offset + 1}` : ""}
            </p>
            {!list.data.items.length && (
              <p>
                Chưa có địa điểm công khai phù hợp. Dữ liệu chỉ xuất hiện sau
                khi được rà soát và xuất bản.
              </p>
            )}
            <ul className="place-results">
              {list.data.items.map((p) => (
                <li key={p.id}>
                  <button
                    aria-pressed={slug === p.slug}
                    onClick={() => select(p.slug)}
                  >
                    <strong>{p.name}</strong>
                    <span>{p.categories.map((c) => c.name).join(" · ")}</span>
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
        {slug && (
          <section aria-label="Chi tiết địa điểm">
            <button className="secondary" onClick={() => select(null)}>
              Đóng chi tiết
            </button>
            {detail.isPending && <p role="status">Đang tải chi tiết…</p>}
            {detail.isError && <p role="alert">{detail.error.message}</p>}
            {detail.data && (
              <>
                <PlaceDetail place={detail.data} />
                <Link href={`/places/${detail.data.slug}`}>
                  Mở trang địa điểm / liên kết chia sẻ
                </Link>
              </>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}

