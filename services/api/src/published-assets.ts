import {
  ExactOrigin,
  assertDatabaseEnabled,
} from "../../../packages/config/src/deployment.ts";
import { publishedObjectKey } from "./storage/object-store.ts";

type ReleaseAsset = {
  dataset_id: string;
  release_id: string;
  kind: string;
  version: string;
  object_key: string;
  public_url: string | null;
  delivered_base: string | null;
};

/** The operator selects the origin; neither registry URLs nor request hosts select a CDN. */
export function publishedBase(
  env: Record<string, string | undefined> = process.env,
): string | null {
  assertDatabaseEnabled(env);
  if (
    (env.LAND_ENVIRONMENT ?? "LOCAL") === "LOCAL" &&
    (env.OBJECT_STORE_DRIVER ?? "local") === "local" &&
    env.VERCEL !== "1"
  )
    return null;
  const base = ExactOrigin.safeParse(env.PUBLIC_ASSET_BASE_URL);
  if (
    env.OBJECT_STORE_DRIVER !== "s3" ||
    !base.success ||
    new URL(base.data).protocol !== "https:"
  )
    throw Error("LAND public asset configuration invalid (values suppressed)");
  return new URL(base.data).origin;
}
export function spatialAssetFile(
  asset: Omit<ReleaseAsset, "public_url" | "delivered_base">,
) {
  if (
    !["TERRAIN", "ROADS"].includes(asset.kind) ||
    !/^[A-Za-z0-9_-]+$/.test(asset.version)
  )
    throw Error("Invalid LAND spatial release");
  const prefix = `spatial/${asset.kind.toLowerCase()}/`;
  const canonical = `${prefix}${asset.dataset_id}/${asset.release_id}/`;
  const legacy = `${prefix}${asset.version}/`;
  const file = asset.object_key.startsWith(canonical)
    ? asset.object_key.slice(canonical.length)
    : asset.object_key.startsWith(legacy)
      ? asset.object_key.slice(legacy.length)
      : "";
  if (
    !(
      asset.kind === "TERRAIN"
        ? /^(manifest\.json|\d+\/\d+\/\d+\.bin)$/
        : /^roads\.geojson$/
    ).test(file)
  )
    throw Error("Invalid LAND spatial asset association");
  publishedObjectKey(
    asset.kind === "TERRAIN" ? "terrain" : "roads",
    asset.dataset_id,
    asset.release_id,
    file,
  );
  return file;
}
export function resolvePublishedAsset(
  asset: ReleaseAsset,
  base: string | null,
): string | null {
  if (base) {
    if (asset.delivered_base !== base) return null;
    try {
      return `${base}/${publishedObjectKey(asset.kind === "TERRAIN" ? "terrain" : "roads", asset.dataset_id, asset.release_id, spatialAssetFile(asset))}`;
    } catch {
      return null;
    }
  }
  // Accepted Phase 0 static URLs remain LOCAL-only. Never emit an arbitrary registry URL.
  const url = asset.public_url;
  return url &&
    /^\/spatial\/(?:[A-Za-z0-9_-]+\/)+(manifest\.json|roads\.geojson)$/.test(
      url,
    ) &&
    ["/" + asset.object_key, "/spatial/" + asset.object_key].includes(url)
    ? url
    : null;
}
