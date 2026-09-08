# Phase 0.5-F/G checkpoint

PHASE 0.5 STATUS: PARTIAL — provider-neutral F/G preparation; no cloud acceptance.

Starting SHA / final HEAD: `f8f6082a60d0a101b9d8351f3336100666418ea6`. Changes remain uncommitted for owner delivery. PR: #2, E checks PASS as reported by owner; no F/G GitHub run claimed. Cached origin/main: `f7080f8a1943d9d86e3c747882b615294a60bd21` (no fetch performed).

## Milestone status

- F: implementation complete. Shared verified-TLS/limited-pool configuration, operator endpoint policy, wrong-product migration preflight, atomic role provisioning, safe bootstrap errors, shared read-only runtime authority checks, managed DB/operator guide. No schema migration or domain change.
- G: provider-neutral implementation complete. Node24 web declaration, explicit monorepo trace root, existing isolated-parser dependency tracing, build-artifact cold parser validation, Next startup/Preview guards, Vercel operator guide. No new dependency, package duplication, cloud deployment or worker architecture.

## Files

Modified:

```text
.env.example
apps/web/next.config.ts
apps/web/package.json
docs/operations/deployment.md
infra/bootstrap-admin.ts
infra/configure-aoi.mjs
infra/expire-import-files.mjs
infra/migrate.ts
infra/provision-runtime.ts
infra/start-web.mjs
package.json
pipelines/publish-object-release.ts
services/api/src/db.ts
services/api/src/import-worker.ts
tests/e2e/public-places.spec.ts
```

New:

```text
apps/web/instrumentation.ts
docs/operations/managed-postgis.md
docs/operations/vercel-build.md
docs/operations/phase-0-5-f-g-checkpoint.md
infra/import-trace.ts
infra/prepare-server-artifact.mjs
packages/config/src/database.ts
services/api/src/database-readiness.ts
tests/managed-database.test.ts
tests/serverless-startup.test.ts
```

Ignored QA logs and the existing isolated local PostGIS cluster are not commit inputs. No secrets, workbooks or GIS assets are added to Git.

## Validation evidence

F `pnpm check`: PASS, 123 tests / 16 suites including real isolated PostgreSQL17.11/PostGIS3.6.2, original Phase 0 upgrade and current 14 migrations. The first new QA fixture lacked PostGIS function grants and was corrected to match the provisioned runtime grants; subsequent full tests passed.

F Core E2E: two full runs 8/9; both failed only public-search's unchanged 5-second data-settled assertion while Cesium loaded/rendered tiles after selection. API results, selection and UNKNOWN were present. The same test later passed alone unchanged on the G build. No viewer/test assertion or timeout was changed. Final full run remains required; no flaky failure is silently erased.

Final F/G `pnpm check`: PASS, 126/126 tests in 17 suites, lint/typecheck/production build, 66 client chunks syntax-checked, secret scan of 276 repository files and 210 public artifacts. Artifact test found and corrected missing pnpm directory-link entries in Next's include output; the build now restores those entries from the precise parser trace. The first cold parse timed out during overlap with Core E2E; sequential fresh reconstructions passed in 7,984 ms, 8,211 ms and finally 7,719 ms with all 793 entries and no leftover scratch. The 20-second parser limit is unchanged. These measurements use one synthetic row, not the required real-cloud 100/500/2,000-row acceptance matrix.

Core diagnostic run: 9/9 PASS with a temporary render-state probe, subsequently removed completely. Four full runs failed only the original public-search render wait. The test now awaits the existing data-focused-id assertion (camera flight completed) before the existing data-settled assertion (stable terrain frames). Both assertions and their default 5-second limits remain; the test follows the UI event order instead of charging flight and settling to the first assertion. No viewer implementation or runtime timeout changed. Final validation of this test sequence is recorded at handoff; diagnostic PASS is not substituted for it.

Final `pnpm test:e2e:core`: **PASS 9/9**, retries=0, no temporary probe. Includes real disposable PostGIS, least-privileged production server, authentication, Admin security, durable import review, UNKNOWN publication, public API/search, lazy-load failure, desktop/mobile and WebGL fallback. Disposable test databases/roles/import files were cleaned up. `git diff --check`: PASS. The isolated QA PostgreSQL cluster remains listening on 127.0.0.1:55439: pg_ctl fast shutdown was denied by Windows process permissions. Owner may stop it outside the sandbox with `& 'C:\Users\ADMIN\Documents\Codex\TaXuaLand\work\runtime\postgres\pgsql\bin\pg_ctl.exe' -D 'C:\Projects\TaXuaLand\work\phase-0-5-qa-postgis' -m fast -w stop`; no force-kill was attempted.

## Full diff stat, including untracked files

Git tracked numstat plus actual new-file line counts; no staging/index writes. M = modified, N = new. Paths are relative to C:/Projects/TaXuaLand.

```text
M .env.example                                  +7  -2
N apps/web/instrumentation.ts                   +15  -0
M apps/web/next.config.ts                       +21  -1
M apps/web/package.json                          +3  -0
M docs/operations/deployment.md                  +2  -0
N docs/operations/managed-postgis.md            +30  -0
N docs/operations/phase-0-5-f-g-checkpoint.md   +126  -0
N docs/operations/vercel-build.md               +28  -0
M infra/bootstrap-admin.ts                      +11  -5
M infra/configure-aoi.mjs                         +2  -1
M infra/expire-import-files.mjs                   +2  -1
N infra/import-trace.ts                         +37  -0
M infra/migrate.ts                              +28  -1
N infra/prepare-server-artifact.mjs            +112  -0
M infra/provision-runtime.ts                     +9  -1
M infra/start-web.mjs                            +4 -29
M package.json                                   +1  -1
N packages/config/src/database.ts               +55  -0
M pipelines/publish-object-release.ts            +2  -5
N services/api/src/database-readiness.ts        +35  -0
M services/api/src/db.ts                         +2 -16
M services/api/src/import-worker.ts             +11  -3
M tests/e2e/public-places.spec.ts                 +5  -4
N tests/managed-database.test.ts                +144  -0
N tests/serverless-startup.test.ts               +48  -0
TOTAL: 25 files (15 modified, 10 new), +740 -70.
```

## Required acceptance record

A. Local Git: fetch/temp-ref not run (owner prohibits Git writes); branch unchanged `feat/phase-0-5-production-deployment`; working tree contains this checkpoint. No Git Data API.

B. Vercel: project/environment/deployment URL not provisioned. Local Node24.13.0; cloud Node24 and actual runtime smoke unverified. Monorepo settings and exact origin configuration documented.

C. Managed PostGIS: provider not selected/provisioned; local PostgreSQL17.11/PostGIS3.6.2 with 14 migrations tested. Runtime privilege/burst checks use disposable roles/databases. No owner credential sent to Vercel; absence in an actual Vercel project remains unverified. Managed TLS, pooler and backup/restore require actual account access.

D. Object storage: existing S3 adapter/private publication boundaries retained. No live provider, bucket policy/lifecycle, private access or CDN acceptance claimed.

E. Excel import: existing signed upload/finalize/object parser/security tests retained; cold trace reconstruction and scratch cleanup tested locally. Real cloud 100/500/2,000-row timing and cold/redeploy persistence remain unverified. UNKNOWN semantics unchanged.

F. Spatial assets: immutable publication/checksum/PostGIS URL authority unchanged. No external release uploaded; actual cloud Cesium/CDN/redeploy acceptance unverified.

G. Security: existing exact-origin, private object, signed URL and public DTO regression suites retained; added TLS-option rejection, privilege and Preview/startup checks. Secret scan results recorded at handoff.

H. CI: local check/Core results recorded at handoff. GitHub F/G check/e2e-core/Actions URL not available until owner commit/push.

I. Documentation: managed-postgis.md and vercel-build.md added; deployment.md linked. Existing storage/publication guides unchanged. No ADR architecture exception; real staging acceptance/threat review remains in later authorized work.

Phase 0 runtime/domain architecture changed? NO. PostGIS authority, verification/UNKNOWN, immutable publication and security boundaries preserved.

Phase 0.5-H or Phase 1 started? NO.

## Remaining owner/provider inputs

Dedicated LAND Vercel staging project/deployment permission and exact HTTPS origin; dedicated managed PostGIS project with owner operator access, runtime/pooler endpoint, CA requirements and backup policy; private/published object-store credentials and CORS/lifecycle/CDN policy access. Supply through secret-manager/environment configuration, not chat. Actual provider smoke, TLS/pooler/burst/backup, Node child permissions, function size/layout, signed upload, immutable CDN and 100/500/2,000-row timings cannot be inferred from local PASS.

Suggested commit: `feat(deploy): prepare managed PostGIS and Vercel runtime (0.5-F/G)`.

STOP for owner commit/push outside the sandbox. Do not start H or Phase 1.
