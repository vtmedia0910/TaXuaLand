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
10. Excel parser/staging — pending.
11. Import review/map preview — pending.
12. Import commit — pending.
13. Terrain/asset pipeline — pending.
14. Observability — pending.
15. Mobile/performance — pending.
16. Security/end-to-end QA — pending.
17. Operations/release candidate — pending.

No completion claim is made for untested or externally unverified criteria. Source licensing, factual verification and terrain control-point review require documented evidence before production approval.
