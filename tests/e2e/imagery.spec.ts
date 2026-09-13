import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { expect, test } from "../support/browser";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const datasetId = randomUUID();
const releaseId = randomUUID();
const sourceLock = "a".repeat(64);
const tile = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAABH0lEQVR42u3QAQEAAAQAIJcMsML/LSywQE0oAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBQnWMBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeGgBrI8BwZ7F0tsAAAAASUVORK5CYII=",
  "base64",
);
const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const version = "TX-IMAGERY-S2L2A-20260527T034216Z-001";
const manifest = {
  format: "LAND_IMAGERY_V1",
  datasetCode: "TX_IMAGERY_BASE",
  releaseVersion: version,
  source: {
    name: "Synthetic governed imagery",
    collection: "sentinel-2-c1-l2a",
    itemId: "S2C_T48QVJ_20260527T033930_L2A",
    productId:
      "S2C_MSIL2A_20260527T032511_N0512_R018_T48QVJ_20260527T082311.SAFE",
    sourceLockSha256: sourceLock,
    assets: {
      item: {
        sha256: "b".repeat(64),
        bytes: 1,
        mediaType: "application/geo+json",
      },
      visual: {
        sha256: "c".repeat(64),
        bytes: 1,
        mediaType:
          "image/tiff; application=geotiff; profile=cloud-optimized",
      },
      scl: {
        sha256: "d".repeat(64),
        bytes: 1,
        mediaType:
          "image/tiff; application=geotiff; profile=cloud-optimized",
      },
    },
    sensingAt: "2026-05-27T03:42:16.849Z",
    generatedAt: "2026-05-27T08:23:11Z",
    acquiredAt: "2026-09-12T00:00:00Z",
  },
  processing: {
    version: "e2e",
    processedAt: "2026-09-12T00:00:00Z",
    tools: { rasterio: "e2e", gdal: "e2e", proj: "e2e", libpng: "e2e" },
  },
  sourceCrs: "EPSG:32648",
  targetCrs: "EPSG:3857",
  aoi: {
    id: randomUUID(),
    version: "CORE-QA-001",
    srid: 4326,
    bbox: [104.45, 21.2, 104.62, 21.35],
    outsidePolicy: "WARNING",
    canonicalGeoJson:
      '{"type":"Polygon","coordinates":[[[104.45,21.2],[104.45,21.35],[104.62,21.35],[104.62,21.2],[104.45,21.2]]]}',
    sha256: "e".repeat(64),
    authoritySemantics: "Synthetic Core E2E coverage.",
  },
  bbox: [104.45, 21.2, 104.62, 21.35],
  nativeResolutionMeters: { visual: 10, sclQa: 20 },
  delivery: {
    scheme: "WEB_MERCATOR_XYZ",
    tileSize: 256,
    minimumLevel: 0,
    maximumLevel: 0,
    resolutionAtMaximumLevelMeters: 156543.03392804097,
    tileUrlTemplate: "{z}/{x}/{y}.png",
  },
  quality: {
    sceneCloudPercent: 8.2,
    obstructionThresholdPercent: 10,
    aoiObstructionPercent: 5.86,
    obstructionClasses: [3, 8, 9, 10, 11],
    validPixelCount: 100,
    obstructedPixelCount: 6,
    nodataPixelCount: 0,
    saturatedPixelCount: 0,
    aoiContained: true,
  },
  rights: {
    licenseName: "Synthetic licence",
    licenseReference: "https://example.invalid/license",
    publicNotice: "Contains modified Copernicus Sentinel data 2026",
    acquisitionNotice: "Synthetic local fixture.",
  },
  verificationStatus: "UNKNOWN",
  accuracy: "UNKNOWN",
  limitations: [
    "Resolution is not positional accuracy.",
    "Cloud screening is not field verification.",
  ],
  tileCount: 1,
  tiles: {
    "0/0/0.png": {
      bytes: tile.length,
      sha256: sha256(tile),
      mediaType: "image/png",
    },
  },
};
const manifestBytes = Buffer.from(JSON.stringify(manifest));
const manifestPath = `/spatial/imagery/${datasetId}/${releaseId}/manifest.json`;

test.beforeAll(async () => {
  const sourceId = (
    await pool.query(
      "INSERT INTO sources(name,category,license_name,license_reference,status,public_display,redistribution,derivatives,caching) VALUES('Synthetic governed imagery','IMAGERY','Synthetic licence','https://example.invalid/license','ACTIVE','ALLOWED','ALLOWED','ALLOWED','ALLOWED') RETURNING id",
    )
  ).rows[0].id;
  await pool.query(
    "INSERT INTO datasets(id,code,name,kind,source_id) VALUES($1,$2,'Synthetic imagery','IMAGERY',$3)",
    [datasetId, `TX_IMAGERY_E2E_${datasetId.replaceAll("-", "")}`, sourceId],
  );
  await pool.query(
    "INSERT INTO dataset_releases(id,dataset_id,version,source_version,pipeline_version,source_crs,target_crs,vertical_datum,bbox,resolution,license,checksum,qa_status) VALUES($1,$2,$3,$4,'e2e','EPSG:32648','EPSG:3857','UNKNOWN',ST_MakeEnvelope(104.45,21.2,104.62,21.35,4326),10,'Synthetic',$5,'APPROVED')",
    [releaseId, datasetId, version, sourceLock, sha256(manifestBytes)],
  );
  await pool.query(
    "INSERT INTO dataset_assets(release_id,zone,object_key,checksum,byte_size,content_type,public_url) VALUES($1,'published',$2,$3,$4,'application/vnd.land.imagery+json',$5)",
    [
      releaseId,
      manifestPath.slice(1),
      sha256(manifestBytes),
      manifestBytes.length,
      manifestPath,
    ],
  );
  await pool.query(
    "INSERT INTO pipeline_runs(dataset_id,release_id,processing_version,status,finished_at,manifest) VALUES($1,$2,'e2e','COMPLETED',now(),$3)",
    [
      datasetId,
      releaseId,
      {
        publicMetadata: {
          sourceName: "Synthetic governed imagery",
          licenseName: "Synthetic licence",
          licenseReference: "https://example.invalid/license",
          attribution: "Contains modified Copernicus Sentinel data 2026",
          acquisitionNotice: "Synthetic local fixture.",
          sourceTimestamp: "2026-05-27T03:42:16.849Z",
          bbox: manifest.bbox,
          nativeResolutionMeters: 10,
          deliveryResolutionMeters: manifest.delivery.resolutionAtMaximumLevelMeters,
          verificationStatus: "UNKNOWN",
          accuracy: "UNKNOWN",
          limitations: manifest.limitations,
        },
      },
    ],
  );
  await pool.query(
    "UPDATE dataset_releases SET qa_status='PUBLISHED',published_at=now() WHERE id=$1",
    [releaseId],
  );
});

test.afterAll(async () => {
  await pool.query(
    "UPDATE dataset_releases SET qa_status='RETIRED' WHERE id=$1",
    [releaseId],
  );
  await pool.end();
});

async function routeManifest(page: import("@playwright/test").Page) {
  await page.route(`**${manifestPath}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/vnd.land.imagery+json",
      body: manifestBytes,
    }),
  );
}

test("governed imagery becomes ready only after a tile and toggles without recreating Cesium", async ({
  page,
}) => {
  let allowTile!: () => void;
  let sawTile!: () => void;
  const tileGate = new Promise<void>((resolve) => (allowTile = resolve));
  const tileRequested = new Promise<void>((resolve) => (sawTile = resolve));
  await routeManifest(page);
  await page.route("**/spatial/imagery/**/0/0/0.png", async (route) => {
    sawTile();
    await tileGate;
    await route.fulfill({ status: 200, contentType: "image/png", body: tile });
  });
  await page.goto("/map", { waitUntil: "domcontentloaded" });
  const viewer = page.getByTestId("spatial-viewer");
  await tileRequested;
  await expect(viewer).toHaveAttribute("data-imagery-status", "INITIALIZING");
  allowTile();
  await expect(viewer).toHaveAttribute("data-imagery-status", "READY", {
    timeout: 30000,
  });
  await page
    .locator(".cesium-host canvas")
    .evaluate((canvas) => Reflect.set(window, "__imageryViewerCanvas", canvas));
  await page.getByRole("button", { name: "Mở lớp bản đồ" }).click();
  const toggle = page.getByLabel("Ảnh Sentinel-2", { exact: true });
  await toggle.uncheck();
  await toggle.check();
  expect(
    await page
      .locator(".cesium-host canvas")
      .evaluate(
        (canvas) => canvas === Reflect.get(window, "__imageryViewerCanvas"),
      ),
  ).toBe(true);
});

test("imagery tile failure restores the neutral grid without failing Places", async ({
  page,
}) => {
  await routeManifest(page);
  await page.route("**/spatial/imagery/**/0/0/0.png", (route) =>
    route.fulfill({ status: 500, body: "fixture failure" }),
  );
  await page.goto("/map");
  const viewer = page.getByTestId("spatial-viewer");
  await expect(viewer).toHaveAttribute("data-imagery-status", "FAILED", {
    timeout: 30000,
  });
  await expect(viewer).toHaveAttribute("data-places-status", "READY");
  await expect(viewer).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByText("Ảnh nền lỗi; đang dùng lưới tham chiếu trung tính"),
  ).toBeVisible();
});
