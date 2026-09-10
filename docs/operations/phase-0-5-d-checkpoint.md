# Phase 0.5-D checkpoint — Durable Excel Import

Date: 2026-09-08. Scope: D only, on feat/phase-0-5-production-deployment. Owner performs all Git writes outside Codex. Milestones E onward and Phase 1 were not started.

## Required status report

```text
PHASE 0.5 STATUS:
PARTIAL — milestone 0.5-D code and local validation PASS; not full Phase 0.5 acceptance.

Starting SHA:
d1819f642eb074a97e22e54d67c7ef87710ac6ee (accepted C checkpoint)
Final SHA:
Unchanged; D is uncommitted working-tree code awaiting owner checkpoint.
PR:
#2, vtmedia0910/TaXuaLand (owner-reported existing PR)
Main SHA:
f7080f8a1943d9d86e3c747882b615294a60bd21 (local origin/main only; no fetch)

A. Local Git
fetch: NOT RUN, owner override
temp ref: NOT RUN, owner override
feature branch: feat/phase-0-5-production-deployment, unchanged
working tree: D changes; Git read-only only, no Git Data API

B. Vercel
project: not configured/verified in D
environment: LOCAL QA; no cloud deployment
deployment URL: none verified
Node: 24 runtime
build: PASS, Next.js production build; 66 client chunks syntax-checked
runtime smoke: local production Core E2E PASS; HTTPS staging NOT TESTED

C. Managed PostGIS
provider: not configured; independent disposable loopback QA cluster
PostgreSQL: local 17.11
PostGIS: real extension/migrations/spatial queries exercised
migration count: 13; fresh DB plus actual upgrade from first 12 migrations PASS
runtime role: isolated least-privileged Core E2E role, import_uploads grants tested
owner credential absent from Vercel?: no Vercel deployment; local web receives runtime role only

D. Object storage
provider: provider-neutral S3 adapter; no actual account configured/tested
private store: local private adapter and S3 integration code
published store: unchanged C adapter; application integration deferred to E
S3 adapter: existing SDK protocol/signing tests PASS; not an IAM/SigV4 verifier
private access test: local application/key/RBAC boundaries PASS; real bucket privacy NOT TESTED
public asset test: outside D
lifecycle: application raw/inspection expiry and idempotent cleanup PASS; provider lifecycle NOT TESTED

E. Excel import
signed upload: authenticated session/UI/S3 signing integration implemented; local PUT E2E PASS
finalize: owner, permission, association, size/MIME/hash/container checks and replay PASS
parser: object input, unique ephemeral scratch, existing isolation/resource bounds PASS
100 rows: no D staging timing claim
500 rows: no D staging timing claim
2000 rows: existing parser limits/regressions PASS; deployed performance NOT TESTED
cold/redeploy persistence: adapter recreation PASS; forced Vercel cold/redeploy NOT TESTED
UNKNOWN preserved: PostGIS atomic-commit regressions and production Core E2E PASS

F. Spatial assets
release: unchanged
external immutable URL: outside D
checksum: existing regression gates retained
Cesium load: local Core E2E PASS
redeploy persistence: outside D

G. Security
origin: exact-origin regressions PASS; new session/finalize/PUT wrong-origin E2E PASS
secret scan: PASS, repository and built public artifacts
runtime DB grants: PASS, protected credentials/audit/AOI remain inaccessible
private object test: no arbitrary client bucket/key; wrong/missing objects rejected
signed URL policy: generated private key, bounded descriptor/expiry and issuance cap PASS
public DTO: existing public visibility/security regressions PASS

H. CI
pnpm check: PASS, 14 suites / 116 tests, no skipped PostGIS suites
pnpm test:e2e:core: PASS, 9/9 browser tests on completed production build
GitHub check: D pending owner commit/push; C PASS reported by owner
GitHub e2e-core: D pending owner commit/push; C PASS reported by owner
Actions URL: no new D run created or claimed

I. Documentation
ADR: existing ADR-009 retained; no new frozen-domain exception
deployment guide: deployment.md updated for durable imports/scratch
storage guide: object-storage.md updated for sessions, migration, retention and rollback
DB guide: D additive migration/grants documented; managed provisioning deferred to F
staging acceptance: not claimed; actual provider checks remain H
threat review: D boundaries/tests documented in storage guide; broader deployment review remains I

Phase 0 runtime/domain architecture changed?
NO frozen domain/spatial/verification change; authorized import transport/scratch changes only.

Phase 1 started?
NO
```

## Changed files

Modified (15):

```text
apps/web/app/api/admin/imports/route.ts
apps/web/components/import-upload.tsx
docs/operations/deployment.md
docs/operations/known-limitations.md
docs/operations/object-storage.md
infra/expire-import-files.mjs
infra/provision-runtime.ts
infra/start-web.mjs
services/api/src/import-worker.ts
services/api/src/imports.ts
tests/e2e/security.spec.ts
tests/import-commit.test.ts
tests/import-service.test.ts
tests/support/core-runner.ts
workers/import/src/parse-workbook.ts
```

New (10, including this report):

```text
apps/web/app/api/admin/imports/[id]/finalize-upload/route.ts
apps/web/app/api/admin/imports/[id]/upload/route.ts
apps/web/app/api/admin/imports/upload-session/route.ts
docs/operations/phase-0-5-d-checkpoint.md
infra/migrations/013_durable_import_uploads.sql
services/api/src/import-retention.ts
services/api/src/import-storage.ts
services/api/src/import-upload-body.ts
services/api/src/import-uploads.ts
tests/durable-import.test.ts
```

Git read-only diff stat (untracked new files are not included by Git until owner stages them):

```text
 apps/web/app/api/admin/imports/route.ts |  25 +------
 apps/web/components/import-upload.tsx   |  74 +++++++++++++++----
 docs/operations/deployment.md           |   8 +-
 docs/operations/known-limitations.md    |   2 +-
 docs/operations/object-storage.md       |  26 ++++++-
 infra/expire-import-files.mjs           |  55 ++++++++++----
 infra/provision-runtime.ts              |   2 +-
 infra/start-web.mjs                     |  17 +++--
 services/api/src/import-worker.ts       |  27 ++++++-
 services/api/src/imports.ts             | 126 ++++++++++++++------------------
 tests/e2e/security.spec.ts              |  37 ++++++++++
 tests/import-commit.test.ts             |   8 ++
 tests/import-service.test.ts            |  15 +++-
 tests/support/core-runner.ts            |  24 +++++-
 workers/import/src/parse-workbook.ts    |   5 +-
 15 files changed, 309 insertions(+), 142 deletions(-)
```

## Validation notes and handoff

- D-specific suite: 7/7 PASS, including a real native-Node maintenance CLI invocation, migration upgrade, safe retry, wrong/missing objects and retained DB staging/audit after object expiry. Existing commit tests cover explicit CREATE/UPDATE/SKIP, rollback and UNKNOWN.
- The first full-suite run exposed a test isolation issue: scratch assertions observed other concurrent suites. The corrected suite has its own scratch root; the full 116-test gate passed afterward.
- An initial Core run overlapped an obsolete/rebuilding production bundle and failed. It is not acceptance evidence. The final run used the completed new build and passed all nine scenarios in about 64.4 seconds. The disposable E2E DB/role and its owned object files were cleaned up.
- git diff --check PASS. No dependency added, no original migration edited, no commit/push/branch/ref writes performed.
- Local .env.local was configured with an independent loopback DATABASE_TEST_URL, excluded from Git. Portable QA database files/logs and test artifacts stay under ignored work/. Do not commit them. The temporary QA server is stopped at handoff; it is not a managed staging DB.
- External inputs still needed for later staging: authorized LAND Vercel project, dedicated managed PostGIS owner/runtime endpoints and TLS configuration, scoped S3-compatible endpoint/region/credentials, private and published buckets, exact LAND HTTPS origin and approved public asset base URL. Supply secrets via an operator environment/secret manager, not chat. These are not blockers to this completed D code checkpoint.

Suggested commit: `feat(import): add durable private upload sessions and object-backed Excel staging`

STOP for owner commit/push to PR #2 and required GitHub check + e2e-core. Do not start E or Phase 1 from this handoff.
