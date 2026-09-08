# Core browser checks

`pnpm test:e2e:core` runs nine real Chromium browser tests against a production build/start and a newly created disposable LAND PostGIS database. Run `pnpm install --frozen-lockfile` and `pnpm check` first. Set `DATABASE_TEST_URL` to a dedicated loopback PostgreSQL maintenance database named `postgres`, whose QA owner can create databases/roles. The harness rejects remote hosts, other database names and URL query overrides; it never migrates an existing application database.

The harness creates unique `land_e2e_*` database/runtime-role names, runs all migrations, authors an Admin account/source/AOI fixture, and starts `infra/start-web.mjs` on a free loopback port with a separate least-privileged role. The existing startup identity/permission/private-volume checks remain active. Random QA passwords live only in process memory and an ignored private credentials file, removed during cleanup. Browser test setup has owner access only to this new disposable database. Its production server receives the limited runtime credential.

## Coverage

Six existing spec files are selected explicitly by `playwright.core.config.ts`; release and Core reuse test logic:

- Authentication: login, protected navigation, safe diagnostics, logout and rejected subsequent access.
- Admin place: create a synthetic draft, candidate focus/numeric correction confirmation, publication review gate, evidence-backed **synthetic transition fixture** to VERIFIED, correction back to UNKNOWN preserving history, publish and archive exclusion. This test establishes no factual verification or real POI.
- Public place: real API-backed Vietnamese search, marker selection/focus/share, UNKNOWN and private DTO exclusion.
- Excel: authored workbook upload, blocked account sheet, mapping/staging, invalid row review, explicit CREATE/SKIP, atomic commit to DRAFT/UNKNOWN and archive cleanup.
- Security: unauthenticated routes, live permission changes/revocation, limited database grants, Secure/HttpOnly cookie, oversized upload rejection, authenticated wrong-Origin rejection and lazy-engine failure fallback.
- Viewer: production Cesium canvas, controls/reset without reload, mobile viewport and usable WebGL fallback.

No terrain/road releases are registered in Core. The truthful neutral grid exercises the accepted no-release state. External HTTP(S) browser requests are blocked and fail the test; service workers are disabled. No OSM, imagery, Google Maps or GIS downloads are needed for test correctness. Pixel-precise marker drag remains in release QA because software-rendered CI picking is timing-sensitive. Full `pnpm test:e2e` retains real DEM/OSM release, landmark, four-profile performance and large import acceptance; prepare its documented local assets separately.

## Isolation and failures

One worker, no automatic retries, an eight-minute browser deadline, a twenty-minute CI job limit and a local exclusive lock avoid conflicting fixture/report writes. Each run owns its port, database and role. Cleanup drops only those newly created resources and removes import inspection files whose UUIDs belong to that database; it never resets user tables or rotates existing roles. Interrupted runs may leave their uniquely named resources or lock: inspect active processes before operator cleanup. Hosted CI additionally destroys the disposable service/runner at job completion.

GitHub runs `check` and `e2e-core` on push and pull request. Each job has its own disposable PostGIS service with CI-only credentials and a frozen install. The browser job installs Playwright's pinned Chromium, builds production and invokes the same harness. Stale runs on the same branch/PR are cancelled.

Only `test-results/core-safe/summary.json` and `summary.html` are uploaded, on failure, for seven days. The custom reporter allowlists test title, source location, status and duration. It excludes raw error text, stack dumps, attachments, environment and network payloads. Traces, automatic screenshots and videos are disabled in Core because they can contain authentication state. Explicit QA screenshots, parser/server diagnostics and local error details stay in ignored `work/`; private Playwright snapshots are never uploaded. Reproduce a failing test locally with `pnpm test:e2e:core --grep "test title"`.

The E2E files/config/harness are included in strict `tsconfig.e2e.json` typechecking. Failure artifacts complement the job outcome; neither reports nor documentation substitute for actual green GitHub browser execution.

References: [Playwright CI](https://playwright.dev/docs/ci), [trace sensitivity](https://github.com/microsoft/playwright/blob/main/docs/src/ci-intro.md), [architecture freeze](phase-0-architecture-freeze.md).
