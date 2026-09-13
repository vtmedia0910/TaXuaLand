# Phase 1 Slice 1C data-enablement implementation plan

**Goal:** Produce locally verified, immutable `APPROVED` road and imagery
candidate contracts and add the minimum future-publication/Cesium support,
without any production/provider mutation.

**Architecture:** Reuse the existing Dataset/Release/asset/pipeline/delivery
model. Add dedicated roads and imagery registrars, narrow `IMAGERY` branches to
the existing delivery/publication/public projection, and a native Cesium URL
template adapter beneath the existing persistent viewer. PostGIS remains the
authority; local artifacts remain ignored and unpublished.

**Stack:** TypeScript/Node 24, PostgreSQL/PostGIS, Python Rasterio/GDAL/PROJ,
Next.js 16/React 19, CesiumJS, Vitest, Playwright.

## Task 1 — Lock contracts with failing tests

- Add focused pure tests for road candidate validation, imagery source lock,
  AOI/SCL policy, strict `LAND_IMAGERY_V1`, and tile-set integrity.
- Add PostGIS integration cases for exact replay, conflict/rollback, rights,
  receipt, retirement, provider, and public-safe projection when a disposable
  test database is available.
- Run each targeted suite and retain the expected RED evidence.

## Task 2 — Build governed local candidates

- Add `pipelines/imagery.lock.json` with the exact Item and required asset
  identities, metadata, and upstream checksums.
- Add a bounded acquisition command that streams Item JSON, TCI, and SCL only,
  computes LAND SHA-256, and rejects identity/metadata/checksum drift.
- Add a deterministic Rasterio pipeline that uses authoritative AOI bounds,
  proves containment, computes SCL obstruction, and emits clipped evidence plus
  alpha PNG Web Mercator XYZ tiles at levels 0–14 and a canonical strict
  manifest.
- Run roads and imagery pipelines locally; record feature/tile counts, metrics,
  tool versions, and hashes without adding generated GIS assets to Git.

## Task 3 — Register at APPROVED only

- Add dedicated road and imagery registrars with exact Source/Dataset/Release
  identities, source records/assets/pipeline/audit evidence, immutable conflict
  checks, transaction rollback, and exact-replay idempotency.
- Register road geometries as valid non-empty SRID-4326 LineStrings covered by
  the Release bbox; keep verification `UNKNOWN`.
- Exercise disposable PostGIS QA only through `DATABASE_TEST_URL`; never use
  production credentials. Document the existing least-privilege runtime read
  contract without granting production permissions.

## Task 4 — Add the narrow future-publication path

- Extend published-asset validation, object delivery, publication readiness,
  and `publicLayers` for one eligible imagery manifest and its exact tile set.
- Keep URLs server-derived and receipt/provider/rights/release gated; strip raw
  provenance and all internal/provider secrets.
- Add governed road/imagery metadata to `ViewerConfig`; retain every prohibited
  roads claim as an explicit limitation.

## Task 5 — Integrate Cesium independently

- Validate and hash the imagery manifest before constructing Cesium's native
  `UrlTemplateImageryProvider`.
- Keep the neutral grid beneath the optional imagery layer. Restore it for
  absent, revoked, initialization, request, or decode failure; do not disturb
  terrain, roads, Places, or recreate the viewer on layer toggles.
- Reuse the current visual system; no redesign, ImageGen, terrain change, or
  Slice 1D behavior.

## Task 6 — Verify, review, and deliver

- Run targeted tests, local candidate QA, `pnpm check`,
  `pnpm test:e2e:core`, secret scan, and `git diff --check`; distinguish
  unavailable disposable DB/browser/provider evidence from PASS.
- Use Playwright for focused browser observation if the local runtime and
  isolated QA database are available.
- Run the required standards/spec code review, update `docs/status/CURRENT.md`,
  stage exact paths, create a logical commit on a dedicated remote feature
  branch using the repository's documented read-only-`.git` fallback, and open
  a PR to `main`. Do not merge.
