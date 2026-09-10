# TÀ XÙA LAND — CURRENT REPOSITORY & DEPLOYMENT STATE

Snapshot date: 2026-09-11
Handoff version: 1.0

This document describes the known implementation/deployment state at the moment the working session is transferred.

It is a snapshot.

The next working session must confirm the remote Git state before making changes.

No secret values are intentionally included in this file.

---

# 1. REPOSITORY

Repository:

vtmedia0910/TaXuaLand

Current pull request:

PR #2

Title:

Phase 0.5: production deployment hardening

PR URL:

https://github.com/vtmedia0910/TaXuaLand/pull/2

Base:

main

Base SHA:

f7080f8a1943d9d86e3c747882b615294a60bd21

Head branch:

feat/phase-0-5-production-deployment

Head SHA at snapshot:

fb81e012c59d880a2b4b2e48e035c6cf6332f053

PR state:

OPEN

Draft:

YES

Merged:

NO

Mergeable:

YES

Commits:

7

Changed files:

64

PR additions/deletions at snapshot:

+5406
-211

PR statement:

Phase 0 architecture remains frozen.

Phase 1 has not started.

---

# 2. REPOSITORY IMPLEMENTATION STATUS

The repository reports Phase 0 repository/local release-candidate acceptance as complete.

The implementation ledger contains seventeen Phase 0 milestones covering:

1. repository foundation;
2. domain contracts and ADRs;
3. PostgreSQL/PostGIS;
4. Admin authentication/authorization;
5. Place application services/CRUD;
6. source/dataset registries;
7. Cesium shell;
8. public Place layer;
9. Admin spatial editor;
10. Excel parser/staging;
11. import review/map preview;
12. import atomic commit;
13. terrain/asset pipeline;
14. observability;
15. mobile/performance;
16. security/end-to-end QA;
17. operations/release-candidate rehearsal.

The repository specifically does NOT claim that local acceptance equals final externally verified production readiness.

Known categories that still require real-world/provider evidence include source licensing, field/control-point accuracy and externally verified deployment acceptance.

---

# 3. CURRENT REPOSITORY ARCHITECTURE

Current repository-level architectural division:

apps/web
= Next.js web application

Contains:

- public routes;
- /map;
- separately protected /admin route tree;
- browser UI;
- Cesium client integration.

services/api
= application services / server-side service layer

Routes should adapt HTTP to services rather than contain core business rules.

packages
= shared/domain-oriented packages

Responsibilities include:

- domain;
- spatial;
- trust;
- contracts;
- configuration;
- shared viewer/UI boundaries.

PostgreSQL/PostGIS is mandatory.

Current repository architecture states:

- application geometry uses EPSG:4326;
- longitude/latitude ordering must be explicit;
- metric queries use PostGIS geography where implemented;
- geometry history is append-only except validity-interval closure;
- ingestion stages untrusted workbooks before draft mutation;
- spatial pipelines produce immutable processed/published artifacts;
- marketplace and AI runtime are not Phase 0 scope.

---

# 4. LOCAL PHASE 0 ACCEPTANCE

According to the implementation ledger, Phase 0 has already exercised real implementations rather than only mocks.

Examples include:

- real PostgreSQL/PostGIS migrations;
- spatial/geodesic queries;
- GiST indexes;
- immutable geometry history;
- real admin auth sessions and roles;
- Place CRUD;
- source registry;
- dataset registry;
- Cesium rendering;
- public-safe Place DTO boundaries;
- Admin spatial editor;
- Excel parser/staging;
- duplicate and AOI checks;
- map preview;
- atomic import commit;
- terrain processing;
- OSM road extraction;
- checksums;
- browser E2E;
- mobile performance;
- security scans;
- backup/restore rehearsal.

The repository documentation reports all Phase 0 local milestones as PASS.

This must not be interpreted as proof that all provider/cloud/field acceptance has passed.

---

# 5. TEST / QA BASELINE

The Phase 0 implementation ledger reports progressively increasing test coverage during development.

Final Phase 0 local validation includes:

- lint;
- typecheck;
- production build;
- domain/PostGIS tests;
- generated-client syntax checks;
- secret scanning;
- browser E2E;
- role-revocation testing;
- cookie/CSRF testing;
- upload-limit testing;
- WebGL/integrity fallback;
- mobile/browser validation;
- backup/restore rehearsal.

The final local security/E2E milestone reported 53 tests and 14 production Playwright scenarios passing.

Do not assume those results remain valid after new source changes.

Before merging Phase 0.5 or starting Phase 1, rerun the relevant current repository validation suite.

---

# 6. CURRENT PHASE

CURRENT:

Phase 0.5 — Production Deployment Hardening

NOT CURRENT:

Phase 1

Phase 1 has not started.

The current PR exists specifically to harden provider deployment and staging operation without changing the frozen Phase 0 architecture.

---

# 7. VERCEL STATE

A dedicated LAND Vercel project has been configured.

Project:

ta-xua-land-web

Application root:

apps/web

Runtime:

Node 24.x

Install command configured:

pnpm install --frozen-lockfile

Build command configured for monorepo:

cd ../.. && pnpm build

Known deployed public origin:

https://ta-xua-land-web.vercel.app

The application has reached a successful Ready deployment state.

Known browser validation:

- `/` loads;
- `/map` renders;
- `/admin` is reachable through protected authentication;
- Admin login has been successfully exercised.

Important:

A rendering `/map` page does not itself prove that all final spatial datasets have been approved, registered and externally published.

Provider/data-release acceptance remains a separate concern.

---

# 8. VERCEL BRANCH NOTE

During Phase 0.5 provider testing, the Vercel project was configured so that the feature branch could be deployed for staging acceptance.

The Git repository itself remains authoritative.

PR #2 is still unmerged.

The next session must inspect Vercel/Git branch configuration before changing deployment branch settings.

Do not silently assume that the temporary staging deployment strategy should become the permanent production strategy.

---

# 9. SUPABASE / POSTGIS STAGING STATE

A dedicated LAND Supabase project exists for staging.

Project name:

taxua-land-staging

Project reference:

yobqpdhgjbtzvpvhddxg

Region:

AWS ap-southeast-1
Singapore

Database:

PostgreSQL with PostGIS

LAND migrations have been successfully applied.

A separate application runtime role exists:

land_app

The runtime role has been tested successfully.

Important security boundary:

land_app
is the application runtime role.

It is NOT the database owner/bootstrap authority.

Runtime readiness has passed with the dedicated application role.

---

# 10. DATABASE CONNECTION MODES TESTED

Supabase pooler modes tested:

Session pooler:

host:
aws-0-ap-southeast-1.pooler.supabase.com

port:
5432

Transaction pooler:

same pooler host

port:
6543

Both modes successfully authenticated using the LAND runtime role during provider setup.

Current intended serverless runtime mode:

transaction

Current runtime configuration concept:

DATABASE_ENDPOINT_MODE=transaction

DATABASE_POOL_MAX=2

LAND_ENVIRONMENT=STAGING

The actual secret DATABASE_URL is intentionally absent from this document.

---

# 11. DATABASE TLS

The application enforces TLS verification.

A provider CA certificate was configured in the deployment environment where required.

Do not disable TLS certificate validation as a workaround.

Do not introduce:

sslmode=disable

or equivalent insecure behavior.

Do not paste database credentials into chat or commit them into the repository.

---

# 12. ADMIN AUTHENTICATION

LAND Admin authentication is application-owned.

It is not simply Supabase Auth by default.

Admin data/auth state is represented through LAND's own application/database model.

An administrator has been bootstrapped successfully in staging.

Admin login has been successfully tested against the deployed site.

Do NOT put the administrator email/password into this handoff.

If a new session needs authenticated browser access, the owner should provide access securely at execution time.

---

# 13. CLOUDFLARE R2 STATE

Two separate R2 buckets were created for staging.

Private:

taxua-land-staging-private

Published:

taxua-land-staging-published

This separation is intentional.

PRIVATE
is for private/import/staging object workflows.

PUBLISHED
is for immutable/public spatial release delivery.

---

# 14. R2 PRIVATE BUCKET POLICY

The private bucket has temporary-import lifecycle behavior.

Known configured lifecycle intent:

imports/raw/
→ delete after 7 days

imports/inspection/
→ delete after 7 days

Multipart upload cleanup:
→ 7 days

Do not apply temporary import lifecycle deletion rules to published spatial releases.

---

# 15. R2 CORS INTENT

Private bucket:

browser upload is restricted to the approved LAND staging origin.

Expected browser method:

PUT

Expected signed headers include items such as:

- content-type;
- x-amz-meta-sha256;
- if-none-match;
- cache-control.

Published bucket:

public/browser reads support:

GET
HEAD

and Range where appropriate.

CORS is browser policy only.

It is NOT the authorization boundary for private storage.

---

# 16. R2 PUBLIC DELIVERY

A temporary Cloudflare R2 development public URL is currently available for the published staging bucket.

Current public base:

https://pub-d97ba289a3144692aa2d771011b6ae74.r2.dev

This is a staging/development delivery endpoint.

It is not the intended final branded production asset hostname.

A custom domain such as an assets subdomain should only be configured after an owner-controlled domain/zone is available.

Do not invent or attach a domain that is not owned/configured.

---

# 17. R2 CREDENTIAL SEPARATION

Two separate R2 credential sets were created conceptually/operationally:

A. PRIVATE RUNTIME CREDENTIAL

Scope:

private bucket runtime object access.

Expected use:

web/server runtime.

B. PUBLISHED OPERATOR CREDENTIAL

Scope:

published-bucket publication operations.

Expected use:

separate publication/operator process.

Critical rule:

The published operator credential must NOT be injected into the normal web runtime.

The Vercel runtime should only have the private runtime object-store credential required by application workflows.

No credential values are present in this file.

---

# 18. DEPLOYMENT ENVIRONMENT — NON-SECRET CONFIG SHAPE

Current staging deployment uses or expects configuration conceptually equivalent to:

LAND_ENVIRONMENT=STAGING

DATABASE_ENDPOINT_MODE=transaction

DATABASE_POOL_MAX=2

OBJECT_STORE_DRIVER=s3

OBJECT_STORE_REGION=auto

PRIVATE_BUCKET=taxua-land-staging-private

PUBLISHED_BUCKET=taxua-land-staging-published

PUBLIC_ASSET_BASE_URL=https://pub-d97ba289a3144692aa2d771011b6ae74.r2.dev

SIGNED_UPLOAD_TTL_SECONDS=300

IMPORT_RETENTION_DAYS=7

Secret variables exist separately for:

- DATABASE_URL;
- DATABASE_CA_CERT where secret-handled;
- private object-store access key;
- private object-store secret key.

Do not put secret values in this handoff.

---

# 19. OBJECT STORAGE ADAPTER

The current Phase 0.5 branch contains an S3-compatible object-store implementation intended to work with Cloudflare R2.

Key behavior includes:

- AWS-compatible S3 client;
- configured endpoint/region;
- path-style support;
- bounded connection/request timeout;
- PUT;
- immediate readback verification;
- HEAD;
- GET;
- SHA-256 integrity checking;
- content-type and size verification;
- delete;
- signed private uploads;
- signed private downloads;
- diagnostic cleanup constraints.

Published deletion is intentionally constrained for diagnostics rather than general published-data mutation.

This adapter should not be redesigned merely because a local TLS path fails.

Provider behavior must be measured first.

---

# 20. EXCEL IMPORT + R2 OBSERVATION

The deployed Admin Excel-import workflow uses a browser-direct signed upload model.

Conceptual flow:

Admin browser
→ request signed upload session from LAND
→ signed PUT to private R2
→ finalize request to LAND server
→ server verifies object
→ workbook inspection
→ staging
→ review
→ explicit commit

Important:

The browser does NOT receive permanent R2 credentials.

It only receives a temporary signed upload capability.

During manual staging testing from the current Windows machine, an Excel upload was observed to remain in a loading state.

This led to direct connectivity investigation.

---

# 21. KNOWN WINDOWS → R2 TLS ISSUE

On the current Windows workstation:

TCP connectivity to the R2 endpoint on port 443 succeeds.

DNS resolves.

However both Node TLS and Windows curl/Schannel fail during TLS handshake with the R2 S3 endpoint.

Observed error classes included:

TLS handshake failure

EPROTO

SSL alert 40

SEC_E_ILLEGAL_MESSAGE

The issue persisted across more than one local Wi-Fi/network path.

This must be recorded as:

KNOWN LOCAL CLIENT/NETWORK TLS PATH ISSUE

It must NOT automatically be classified as:

CLOUDFLARE R2 PROVIDER FAILURE

The provider needs independent cloud-origin acceptance to distinguish the two.

---

# 22. LOCAL PROVIDER ACCEPTANCE RESULT

A Codex CLI provider-acceptance run was executed locally.

Results:

Vercel deployment:
PASS

Admin authentication:
PASS

LAND database diagnostics:
PASS

R2 S3 private lifecycle:
UNCONFIRMED due local TLS handshake failure

R2 published lifecycle/public delivery:
UNCONFIRMED in that run

Published-operator credential-separation evidence:
NOT YET FORMALLY CLOSED

Overall conclusion of that local run:

PARTIAL PASS

Not FAIL.

Reason:

The proven components passed, but complete R2 provider lifecycle evidence was unavailable from the affected local machine.

---

# 23. CLOUD ACCEPTANCE PLAN

The intended next step was to run the R2 diagnostic lifecycle from a cloud execution environment unaffected by the local Windows TLS path.

Expected cloud acceptance checks:

PRIVATE

PUT diagnostic object
HEAD
GET
verify exact bytes
verify SHA-256
DELETE
confirm cleanup

PUBLISHED

operator PUT
HEAD
GET
verify exact bytes
public anonymous GET
HTTP 200
verify exact bytes
DELETE diagnostic object
confirm cleanup

Only temporary objects under:

diagnostics/

should be used.

No authoritative Place/Property/dataset data should be modified.

At this snapshot, do NOT assume this cloud run has been completed unless newer evidence exists in the repository or is supplied by the owner.

---

# 24. PROVIDER ACCEPTANCE REPORT STATE

During the local acceptance run, a provider-acceptance Markdown report was updated locally.

At the last confirmed state of the previous session:

the report was not yet part of the remote branch.

The remote branch did contain:

docs/operations/phase-0-5-h-prerequisites.md

but that document predates the owner's successful creation/configuration of external provider resources and therefore contains stale "blocked on external access" context.

Do not treat that old prerequisites status as the final provider state.

The new session must inspect:

- current branch;
- working tree if available;
- any newer provider report;
- external/cloud acceptance evidence.

Then update the closeout report only after evidence is available.

---

# 25. IMPORTANT STALE DOCUMENT WARNING

The current remote file:

docs/operations/phase-0-5-h-prerequisites.md

was written when external deployment/provider access had not yet been supplied.

Since then, significant setup was completed:

- Vercel deployment;
- Supabase/PostGIS staging;
- runtime role;
- Admin bootstrap/login;
- Cloudflare R2 buckets;
- R2 credentials;
- lifecycle/CORS;
- staging public asset endpoint.

Therefore:

DO NOT blindly repeat the old "external access missing" conclusion.

Use it as historical prerequisite documentation.

Re-evaluate current state from actual provider evidence.

---

# 26. PUBLIC MAP CURRENT INTERPRETATION

The public application and `/map` route render in deployed staging.

This proves the application shell and relevant server-side pathways can operate against the configured staging database.

It does NOT prove:

- all real Tà Xùa Places have been approved;
- terrain release has final source/legal approval;
- field accuracy has been verified;
- published provider release acceptance is complete;
- production launch readiness.

The repository itself explicitly distinguishes authored/synthetic/local QA evidence from real field/provider approval.

Maintain this distinction.

---

# 27. TERRAIN / ROAD PIPELINE STATE

Phase 0 local work includes a reproducible spatial asset pipeline.

Repository acceptance reports include:

- Copernicus DSM processing;
- explicit vertical conversion work;
- OSM road extraction;
- tile integrity/seam checks;
- PostGIS validation;
- immutable local published release artifacts;
- browser terrain/road test scenarios.

Important:

LOCAL QA RELEASE
≠
PRODUCTION-APPROVED SPATIAL RELEASE

Field/control-point accuracy is not automatically established by successful processing.

Source licensing/redistribution authority must remain explicit.

---

# 28. PUBLICATION SAFETY

Do not publish spatial data merely because:

- a file exists;
- QA passed locally;
- a bucket accepts an upload;
- Cesium can render it.

Publication requires appropriate:

- source authority;
- license/rights;
- metadata;
- QA;
- release registration;
- immutable artifact handling;
- public delivery validation.

Ingest
≠
Publish.

---

# 29. PHASE 0.5 CURRENT BLOCKERS / UNFINISHED GATES

At this snapshot, treat the following as requiring closure or fresh confirmation:

A. Cloud-origin R2 provider lifecycle evidence.

B. Published public delivery exact-byte/integrity evidence.

C. Diagnostic cleanup evidence.

D. Explicit deployed credential-separation confirmation:
published operator credential absent from web runtime.

E. Final provider-acceptance report updated to reflect actual owner-configured providers.

F. Final repository validation after any report/source changes.

G. PR #2 moved from Draft to Ready only after acceptance is complete.

H. Merge PR #2 through controlled workflow.

I. Establish clean post-merge Phase 1 baseline.

Until these are complete:

PHASE 1 SHOULD NOT START.

---

# 30. DO NOT REINVESTIGATE FROM ZERO

A new session should not waste time repeating already settled setup unless evidence changed.

Known completed setup includes:

- dedicated LAND Vercel project;
- dedicated LAND Supabase project;
- PostGIS migrations;
- separate land_app runtime role;
- successful DB runtime connectivity;
- working Admin login;
- dedicated R2 private bucket;
- dedicated R2 published bucket;
- separate R2 credential roles;
- lifecycle rules;
- CORS configuration;
- public R2 staging delivery endpoint.

The unresolved issue is acceptance/evidence closure, not creation of those resources from scratch.

---

# 31. SECRETS THAT MUST NOT APPEAR IN HANDOFF

Never copy into this document or chat:

DATABASE PASSWORD

DATABASE_URL WITH PASSWORD

ADMIN PASSWORD

R2 PRIVATE SECRET ACCESS KEY

R2 PUBLISHED SECRET ACCESS KEY

R2 ACCESS KEY VALUES

PROVIDER MASTER TOKEN

SIGNED PRIVATE UPLOAD URL

VERCEL TOKEN

SUPABASE OWNER PASSWORD

If a credential is needed:

the owner injects it securely into the execution environment.

---

# 32. REPOSITORY FILES THE NEXT SESSION SHOULD INSPECT

At minimum:

README.md

ARCHITECTURE.md

AGENTS.md

SECURITY.md

docs/PHASE_0_SPATIAL_FOUNDATION.md

docs/operations/implementation-status.md

docs/operations/acceptance.md

docs/operations/known-limitations.md

docs/operations/phase-0-architecture-freeze.md

docs/operations/deployment.md

docs/operations/operator-guide.md

docs/operations/admin-import-guide.md

docs/operations/verification-guide.md

docs/operations/phase-0-5-h-prerequisites.md

pipelines/README.md

Relevant ADRs

Relevant migrations

Current PR diff

Any new Phase 0.5 provider acceptance report if present.

---

# 33. VISUAL SPEC STATE

The visual library has been substantially upgraded.

Canonical replacements now include:

Series 01 v2
Public Map & 3D Experience

Series 02 v2
Admin System Overview

Series 03 v2
Spatial Truth Verification Workspace

The older 01–03 boards should not be used as canonical references.

Detailed visual handoff comes in:

03_VISUAL_SPEC_CATALOG.md

---

# 34. REPO VS VISUAL STATE

The visual library represents the intended mature UX across future phases.

The repository currently does NOT implement every visual feature.

Examples visible in future visual boards but not current Phase 0.5 scope include:

- full mature Public Map UX;
- advanced viewshed;
- complete Spatial Intelligence;
- Property Registry;
- Property Intelligence;
- AI Advisor;
- AI Control Center;
- Brokerage.

Do not treat visual presence as code-complete status.

---

# 35. IMMEDIATE CONTINUATION PROCEDURE

The next working session should perform this sequence:

STEP 1
Confirm GitHub PR #2 status and head SHA.

STEP 2
Read Phase 0.5 closeout documentation.

STEP 3
Check whether a newer cloud provider-acceptance report exists.

STEP 4
If cloud R2 evidence does not exist, run the approved diagnostic-only cloud lifecycle test.

STEP 5
Confirm web runtime does not contain published operator credentials.

STEP 6
Update provider-acceptance report with sanitized evidence.

STEP 7
Run repository QA required for the report/source changes.

STEP 8
Review PR #2.

STEP 9
Make PR ready/merge only when all gates are satisfied.

STEP 10
Create/confirm clean Phase 1 starting baseline.

Do not perform Step 10 before Step 9.

---

# 36. CURRENT STATUS SUMMARY

PHASE 0 LOCAL IMPLEMENTATION
PASS

PHASE 0 LOCAL RELEASE-CANDIDATE ACCEPTANCE
PASS

VERCEL STAGING DEPLOYMENT
PASS

SUPABASE / POSTGIS STAGING
PASS

LAND RUNTIME ROLE
PASS

ADMIN LOGIN
PASS

R2 RESOURCE CONFIGURATION
CONFIGURED

LOCAL WINDOWS R2 S3 TLS
FAILS FROM THIS CLIENT PATH

R2 PROVIDER ITSELF
NOT PROVEN FAILED

COMPLETE R2 CLOUD LIFECYCLE ACCEPTANCE
REQUIRES CONFIRMATION / COMPLETION

OVERALL PHASE 0.5 PROVIDER ACCEPTANCE
PARTIAL / NOT CLOSED

PR #2
OPEN + DRAFT

PHASE 1
NOT STARTED

---

# 37. DEFINITION OF SAFE HANDOFF

The next session may consider this repository successfully transferred when it can correctly answer:

- Why is LAND a spatial authority?
- What does Phase 0.5 still need?
- Why is a local R2 TLS failure not automatically a provider failure?
- Why must published operator credentials stay outside web runtime?
- Why is Import Commit not Publish?
- Why must Phase 1 wait for Phase 0.5 merge?
- Which visual board owns global Admin IA?
- Which visual board owns Spatial Verification workflow?

If those answers are wrong, do not begin coding.

---

END OF CURRENT STATE SNAPSHOT