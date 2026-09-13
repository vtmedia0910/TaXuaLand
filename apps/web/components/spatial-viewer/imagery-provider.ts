import * as Cesium from "cesium";
import { ImageryManifest } from "../../../../packages/spatial-types/src/imagery";
import type { GovernedLayerMetadata } from "../../../../packages/spatial-types/src/viewer";
import { boundedBytes, sha256 } from "./asset-integrity";

export function releaseTileTemplate(manifestUrl: string, template: string) {
  if (template !== "{z}/{x}/{y}.png") throw Error("IMAGERY_TEMPLATE_INVALID");
  const absolute = new URL(manifestUrl, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  return `${absolute.href.slice(0, absolute.href.lastIndexOf("/") + 1)}${template}`;
}

export async function loadImageryManifest(url: string, expectedHash: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw Error("IMAGERY_MANIFEST_HTTP");
  if (response.headers.get("content-type")?.split(";", 1)[0] !== "application/vnd.land.imagery+json") throw Error("IMAGERY_MANIFEST_MIME");
  const bytes = await boundedBytes(response, 1024 * 1024);
  if (await sha256(bytes) !== expectedHash) throw Error("IMAGERY_MANIFEST_INTEGRITY");
  return ImageryManifest.parse(JSON.parse(new TextDecoder().decode(bytes)));
}

export async function loadLandImagery(url: string, expectedHash: string, expectedRelease: string, metadata: GovernedLayerMetadata, signal: AbortSignal) {
  const manifest = await loadImageryManifest(url, expectedHash, signal);
  if (manifest.releaseVersion !== expectedRelease || manifest.bbox.some((coordinate, index) => coordinate !== metadata.bbox[index])) throw Error("IMAGERY_RELEASE_MISMATCH");
  const creditElement = document.createElement("span");
  creditElement.textContent = `${metadata.attribution} · `;
  const link = document.createElement("a");
  link.href = metadata.licenseReference; link.textContent = metadata.licenseName; link.target = "_blank"; link.rel = "noopener noreferrer";
  creditElement.append(link);
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: releaseTileTemplate(url, manifest.delivery.tileUrlTemplate),
    tilingScheme: new Cesium.WebMercatorTilingScheme(),
    rectangle: Cesium.Rectangle.fromDegrees(...manifest.bbox),
    tileWidth: 256,
    tileHeight: 256,
    minimumLevel: manifest.delivery.minimumLevel,
    maximumLevel: manifest.delivery.maximumLevel,
    hasAlphaChannel: true,
    enablePickFeatures: false,
    credit: new Cesium.Credit(creditElement.innerHTML, true),
  });
  const requestImage = provider.requestImage.bind(provider);
  let resolveReady!: () => void;
  const firstTileReady = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  provider.requestImage = (x, y, level, request) => {
    const result = requestImage(x, y, level, request);
    result?.then(() => resolveReady(), () => undefined);
    return result;
  };
  return { provider, manifest, firstTileReady };
}
