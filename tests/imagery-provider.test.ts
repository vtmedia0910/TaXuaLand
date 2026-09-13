import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadImageryManifest, releaseTileTemplate } from "../apps/web/components/spatial-viewer/imagery-provider";

describe("governed imagery provider boundary", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects the wrong manifest MIME and checksum before provider creation", async () => {
    const bytes = Buffer.from("{}");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes, { headers: { "content-type": "application/json", "content-length": String(bytes.length) } })));
    await expect(loadImageryManifest("https://assets.example.invalid/spatial/imagery/a/b/manifest.json", createHash("sha256").update(bytes).digest("hex"), new AbortController().signal)).rejects.toThrow("IMAGERY_MANIFEST_MIME");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes, { headers: { "content-type": "application/vnd.land.imagery+json", "content-length": String(bytes.length) } })));
    await expect(loadImageryManifest("https://assets.example.invalid/spatial/imagery/a/b/manifest.json", "a".repeat(64), new AbortController().signal)).rejects.toThrow("IMAGERY_MANIFEST_INTEGRITY");
  });

  it("derives only the fixed relative XYZ template beneath the manifest directory", () => {
    expect(releaseTileTemplate("https://assets.example.invalid/spatial/imagery/a/b/manifest.json", "{z}/{x}/{y}.png")).toBe("https://assets.example.invalid/spatial/imagery/a/b/{z}/{x}/{y}.png");
    expect(() => releaseTileTemplate("https://assets.example.invalid/spatial/imagery/a/b/manifest.json", "https://evil.invalid/{z}/{x}/{y}.png")).toThrow();
  });
});
