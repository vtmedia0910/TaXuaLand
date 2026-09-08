import { expect, test } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const profiles = [
  {
    name: "desktop-high",
    width: 1440,
    height: 900,
    mobile: false,
    cpu: 1,
    mbps: 30,
    latency: 20,
  },
  {
    name: "desktop-median",
    width: 1280,
    height: 800,
    mobile: false,
    cpu: 2,
    mbps: 15,
    latency: 40,
  },
  {
    name: "mobile-modern",
    width: 390,
    height: 844,
    mobile: true,
    cpu: 2,
    mbps: 10,
    latency: 50,
  },
  {
    name: "mobile-constrained",
    width: 360,
    height: 800,
    mobile: true,
    cpu: 4,
    mbps: 1.6,
    latency: 150,
  },
];
test("production cold-cache device/network baseline", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(240000);
  const manifest = JSON.parse(
    await readFile("apps/web/.next/react-loadable-manifest.json", "utf8"),
  ) as Record<string, { files: string[] }>;
  const lazy = Object.entries(manifest)
    .find(([key]) => key.includes("viewer-engine"))![1]
    .files.filter((file) => file.endsWith(".js"));
  const results = [];
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: profile,
      isMobile: profile.mobile,
      hasTouch: profile.mobile,
      deviceScaleFactor: profile.mobile ? 2 : 1,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.latency,
      downloadThroughput: (profile.mbps * 1024 * 1024) / 8,
      uploadThroughput: (1024 * 1024) / 8,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${baseURL}/`);
    const homeScripts = await page.evaluate(() =>
      performance.getEntriesByType("resource").map((r) => r.name),
    );
    expect(
      homeScripts.some((url) => lazy.some((file) => url.endsWith(file))),
    ).toBe(false);
    const start = performance.now();
    await page.goto(`${baseURL}/map`);
    const viewer = page.getByTestId("spatial-viewer");
    await expect(viewer).toHaveAttribute("data-ready", "true", {
      timeout: 120000,
    });
    const readyMs = Math.round(performance.now() - start);
    await expect(viewer).toHaveAttribute("data-settled", "true", {
      timeout: 60000,
    });
    const stableMs = Math.round(performance.now() - start);
    const resources = await page.evaluate(() =>
      performance.getEntriesByType("resource").map((entry) => {
        const r = entry as PerformanceResourceTiming;
        return {
          path: new URL(r.name).pathname,
          bytes: r.encodedBodySize,
          durationMs: Math.round(r.duration),
        };
      }),
    );
    const scripts = resources.filter(
      (r) => r.path.startsWith("/_next/static/") && r.path.endsWith(".js"),
    );
    let initialGzipBytes = 0,
      lazyGzipBytes = 0;
    for (const r of scripts) {
      const bytes = gzipSync(
        await readFile(`apps/web/.next/${r.path.slice(7)}`),
      ).length;
      if (lazy.some((file) => r.path.endsWith(file))) lazyGzipBytes += bytes;
      else initialGzipBytes += bytes;
    }
    expect(
      scripts.some((r) => lazy.some((file) => r.path.endsWith(file))),
    ).toBe(true);
    expect(initialGzipBytes).toBeLessThan(400 * 1024);
    expect(stableMs).toBeLessThan(
      profile.mobile && profile.cpu === 4 ? 120000 : 30000,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(profile.width);
    await viewer.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `work/qa-performance-${profile.name}.png` });
    const api = await page.request.get(`${baseURL}/api/public/places`);
    const places = await api.json();
    expect(places.items.length).toBeLessThanOrEqual(100);
    const tile = resources.find((r) => r.path.endsWith(".bin"))!;
    const asset = await page.request.get(`${baseURL}${tile.path}`);
    expect(asset.headers()["cache-control"]).toContain("immutable");
    expect(errors).toEqual([]);
    results.push({
      profile,
      readyMs,
      stableMs,
      initialGzipBytes,
      lazyGzipBytes,
      terrainBytes: resources
        .filter((r) => r.path.startsWith("/spatial/"))
        .reduce((n, r) => n + r.bytes, 0),
      placeApiMs:
        resources.find((r) => r.path === "/api/public/places")?.durationMs ??
        null,
      errors: errors.length,
    });
    await context.close();
  }
  await writeFile(
    "work/performance-baseline.json",
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        environment:
          "Local production Next server; Chrome CDP emulation, not physical devices",
        results,
      },
      null,
      2,
    ),
  );
});
