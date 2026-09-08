# Phase 0 performance baseline

The second import run measured 467 / 1,672 / 6,638 ms validation for 100 / 500 / 2,000 rows. Loading the completed 2,000-row staging review and reaching a stable terrain/marker frame took 5,894 ms on the unthrottled desktop production profile; the rendered point grid was visually inspected. These are synthetic points, not surveyed places.

Run a production build with `pnpm check`, then `pnpm --filter @land/web start`. Run `tests/e2e/performance.spec.ts` and `tests/e2e/import-performance.spec.ts` with Playwright against that server. The scripts write aggregate reports to ignored `work/`; publish only reviewed measurements. Do not run browser suites against files being rebuilt or run multiple Playwright processes sharing the same report directory.

The viewer baseline uses fresh Chrome contexts, disabled browser cache, CDP network shaping and CPU slowdown: desktop high (1440×900, 30 Mbps, 20 ms, 1× CPU), desktop median (1280×800, 15 Mbps, 40 ms, 2×), mobile modern (390×844, 10 Mbps, 50 ms, 2×), mobile constrained (360×800, 1.6 Mbps, 150 ms, 4×). These are repeatable emulated profiles on the QA workstation, not physical device certification or a production hosting SLA.

Budgets: initial public JS under 400 KiB gzip excluding lazy Cesium chunks; stable viewer within 30 seconds for broadband profiles and 120 seconds for constrained mobile. Record ready and stable times from map navigation, including lazy JS download. The homepage must not request any Cesium chunk. Dataset assets are immutable by version and cache for one year; API responses remain no-store so permissions/publication changes are not hidden by HTTP caching. Provider/source legal revocation also requires CDN asset removal/invalidation; a registry pointer alone cannot revoke copies already distributed.

Public places initially return 50 records, at most 100 per API page, with explicit paging and a 10,000 offset bound. The selected detail can add one marker outside the current page. Cesium clusters groups of at least 15 within 50 screen pixels. Only the selected marker has a text label. Requests use request-render mode, shadows are disabled, render resolution scale is capped at 1.5, screen-space error is 4, and terrain fetch concurrency is six. The release has finite levels 0–4. Finer source detail is never fabricated.

Import benchmarks upload authored synthetic XLSX files with 100, 500 and 2,000 rows, then call the actual authenticated normalization/spatial validation API against PostGIS. Parser and staging never commit these rows. Validation budget is 60 seconds, matching the application deadline; upload/parser budget is 20 seconds and maximum workbook size is 8 MiB. At the bound, a failed validation rolls back. Database indexes cover batch ordering/user rate-limit lookup, batch row membership, row error lookup, places/roads spatial search and normalized text/slug matching.

Measured 2026-09-08 on the local production server (one cold-cache sample/profile):

| Profile            | Viewer ready | First stable | Place API incl. shaped network |
| ------------------ | -----------: | -----------: | -----------------------------: |
| Desktop high       |      1.411 s |      5.844 s |                          32 ms |
| Desktop median     |      2.534 s |      6.497 s |                          55 ms |
| Mobile modern      |      2.470 s |      6.603 s |                          69 ms |
| Mobile constrained |      9.367 s |     19.541 s |                         181 ms |

Initial JS: 152,386 bytes gzip (148.8 KiB); lazy Cesium group: 1,189,151 bytes gzip (1.134 MiB). No homepage Cesium requests, client errors or horizontal overflow occurred. DEM/roads transferred approximately 454–883 KiB depending on viewport/LOD. Versioned tile responses carry the expected immutable cache header. These are single-run observations, not percentile claims.

| Synthetic rows | Workbook bytes | Upload + isolated parser | Server validation |
| -------------- | -------------: | -----------------------: | ----------------: |
| 100            |          8,992 |                   716 ms |            451 ms |
| 500            |         18,566 |                   648 ms |          1,281 ms |
| 2,000          |         53,273 |                   766 ms |          5,531 ms |

All batches reached READY_FOR_REVIEW without committing places. Workstation compilation uses a Terser workaround for a verified SWC/Cesium syntax issue; uncached local builds took about 75 seconds and reported a Windows Webpack cache snapshot warning. Runtime measurements above use the completed build. The comparatively large lazy Cesium group makes cold constrained-network startup slower; it remains within the explicit Phase 0 budget. Optimize or upgrade only with repeat production measurements and upstream regression checks.
