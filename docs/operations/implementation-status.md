# Phase 0 implementation and acceptance ledger

Initial inspection: remote repository empty; no existing source to overwrite. Node 24.13.0, pnpm 11.19.0, GitHub authentication available. Docker/PostgreSQL not found on PATH.
The complete 2,497-line supplied specification was read before source edits.

Milestones (in order):

1. Repository foundation — PASS: install, lint, typecheck, unit test and production build; HTTP 200 and real browser screenshot inspected on 2026-09-07.
2. Domain contracts and ADRs — PASS: 21 unit tests, lint, typecheck, production build; parser and trust transitions exercised directly. ADRs 001–008 recorded.
3. Database + PostGIS — PASS: real PostgreSQL 17.11/PostGIS 3.6.2; fresh disposable database migrations and repeat migration; spatial/geodesic query, GiST indexes, immutable geometry history. All 25 tests, lint, typecheck and build pass. GitHub CI for milestones 1–2 also passed.
4. Admin authentication/authorization — PASS: 30 tests including real session/role/expiry integration, lint/typecheck/build; HTTP 401/200/403 checks; Playwright login/logout passed and desktop/mobile screenshots inspected. Runtime uses separate land_app role.
5. Place application services/CRUD — PASS: 32 tests, lint/typecheck/build, real HTTP create/read/archive; geometry confirmation and history, optimistic concurrency, source records, categories/media/references, immutable content snapshots, accent-insensitive search.
6. Source/dataset registries — PASS: 34 tests, lint/typecheck/build, authenticated Playwright navigation through source/dataset/diagnostics pages and screenshots inspected. Strict permissions metadata and safe provider DTOs; no production datasets asserted.
7. Cesium shell — PASS: 34 tests, lint/typecheck/build and 2 Playwright viewer tests. Desktop/mobile rendering, layer toggle, camera reset without reload and WebGL fallback inspected. Lazy client chunk, local Cesium workers, request-render mode and cleanup implemented. Neutral grid explicitly labeled; real terrain/roads proof remains milestone 13.
8. Public place layer — PASS: 35 tests, lint/typecheck/build; real PostGIS public DTO boundaries exclude drafts, disabled/unknown-rights sources and denied media; Vietnamese search and category filters. Playwright search/select/fly-to/share with authored synthetic fixture and desktop/mobile screenshots inspected; viewer regressions pass. Fixture archived after QA; UNKNOWN retained independently for location and content.
9. Admin spatial editor — PASS: 36 tests, lint/typecheck/build; real browser create, drag candidate, explicit correction, geometry history, review and publish UNKNOWN; desktop picker/mobile publication screenshots inspected. Permission/evidence/version gates and atomic bulk rollback tested in disposable PostGIS. Live candidate validation, operational AOI, metric road-context boundary, category creation and list filters included. Authentication/public-view regressions pass. GitHub CI milestones 6–8 passed.
10. Excel parser/staging — PASS: 41 tests, lint/typecheck/build; isolated XLSX parser, ZIP/resource/macro/formula/credential-sheet boundaries; real PostGIS staging and duplicate/AOI checks, no place mutation. Live authenticated HTTP upload 201 → validate 200 → READY_FOR_REVIEW, invalid row and blocked account sheet confirmed. Seven-day private inspection retention command exercised. Production dependency audit has no known vulnerabilities; GitHub CI milestone 9 passed.
11. Import review/map preview — PASS: 41 tests, lint/typecheck/build; authenticated Playwright upload, mapping, invalid marker, explicit row decisions and immutable review history. Desktop/mobile screenshots inspected; mobile overflow assertion passes. No place mutation before commit.
12. Import commit — PASS: 47 tests, lint/typecheck/build. Atomic rollback, concurrent idempotent retries, current duplicate/AOI/version gates, explicit replacement, immutable provenance and UNKNOWN geometry history tested in PostGIS. Real authenticated browser commits through land_app; mobile result inspected, synthetic place archived after QA. Narrow AOI read-lock function fixes runtime permission failure without AOI edit grants.
13. Terrain/asset pipeline — PASS: reproducible hash-pinned Copernicus DSM + EGM2008 vertical conversion and OSM road extract; all 341 tiles pass integrity/seam checks, 208 road segments pass PostGIS validation. Published release/assets immutable. Lint/typecheck, 49 tests and production build pass. Five browser scenarios pass: real DEM/roads desktop/mobile, named OSM reference, controls, WebGL fallback, corrupt-manifest rejection. Screenshots inspected. Field accuracy/control points remain UNKNOWN; local QA publication is not production deployment.
14. Observability — pending.
15. Mobile/performance — pending.
16. Security/end-to-end QA — pending.
17. Operations/release candidate — pending.

No completion claim is made for untested or externally unverified criteria. Source licensing, factual verification and terrain control-point review require documented evidence before production approval.

Git delivery: milestones 1–9 were committed and pushed individually. Git writes were blocked during milestones 10–12 by the sandbox ACL on `.git`, despite source write grants. Workspace permissions restored Git writes on 2026-09-08. These three already validated milestones were committed and pushed as `4404dfe`, one cohesive Excel upload → staging → review → atomic draft commit change. Implementation and milestone checks ran in specification order; terrain is delivered separately.
