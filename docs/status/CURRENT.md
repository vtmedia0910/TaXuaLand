# TÀ XÙA LAND — CURRENT STATUS

Status: Mutable operational snapshot
Last reconciled: 2026-09-12
Repository: `vtmedia0910/TaXuaLand`
Local workspace: `C:\Projects\TaXuaLand`

> This file answers: **where is the project now, what is blocked, and what should happen next?**
>
> It is intentionally mutable.
> Stable product/domain truth belongs in `CONTEXT.md`.
> Architecture authority remains in the Phase 0 specification, architecture freeze, ADRs, contracts, migrations, and tests.
> Re-check GitHub and the local working tree before acting because this snapshot can become stale.

---

## 1. Current remote repository state

Verified after merging Phase 0.5 on 2026-09-11:

```text
Phase 0.5 merge baseline
47b3f8fabbba5f784092b13c8c1fa6205fe8ed47

Phase 0.5 pull request
#2 — Phase 0.5: production deployment hardening
MERGED
```

PR #2 is merged into `main`, and the agent-workflow documentation layer is installed through its separate documentation-only migration. Phase 0 architecture remains frozen. Re-check Git for the current `main` HEAD rather than treating the Phase 0.5 merge baseline as the latest repository SHA.

The approved Phase 1 specification is merged through PR #4. Slice 1A is complete and merged through PR #5. Phase 1 remains in progress. The production Source and `TX-DEM-2026-001` Release are registered, the Release is `APPROVED`, and all 342 immutable R2 objects plus the origin-specific delivery receipt are verified. Public projection remains intentionally empty because `APPROVED != PUBLISHED`.

### Local-state boundary

The local workspace at:

```text
C:\Projects\TaXuaLand
```

was inspected before this migration. The tracked baseline matched `origin/main`; the unrelated untracked `Thư mục mới/` directory is owner data and must remain untouched.

At the beginning of every coding session, Codex must reconcile:

```text
git status --short
git branch --show-current
git rev-parse HEAD
git fetch origin
git rev-parse origin/main
```

Never destroy local work merely to make it match this snapshot.

---

## 2. Current product phase

```text
Phase 0
Spatial Foundation
PASS at repository/local release-candidate level

Phase 0.5
Production Deployment Hardening
CLOSED
MERGED THROUGH PR #2

Phase 1
Tà Xùa 3D
IN PROGRESS
SPECIFICATION APPROVED
PR #4 MERGED
SLICE 1A: COMPLETE — PR #5 MERGED
ACTIVE SLICE: 1B — PUBLISHED TERRAIN
SLICE 1B: TEMPORARY RUNTIME PATH READY FOR REVIEW / NOT PUBLISHED
PRODUCTION TERRAIN: DELIVERED / APPROVED / NOT PUBLISHED
```

The owner approved the Phase 1 specification and its four scope/data-readiness decisions on 2026-09-11. PR #4 merged the documentation-only specification; PR #5 subsequently merged the completed Slice 1A public 3D shell.

Owner final screenshot review passed for Series 00, 01, and 08, and required remote CI passed on the reviewed PR #5 head. Functional, visual, scope, architecture, and E2E review are PASS; Slice 1A is complete and merged. The neutral reference grid remains the honest fallback: Slice 1A does not imply that any terrain or imagery source/release is approved.

Production now contains Source `0633d396-ed73-4d00-880c-73a2d421e822`, Dataset `cb488e83-4b05-4842-94bc-50648b2220f5`, and Release `f2503940-5efa-4693-8ab8-26a3eb2e9602` (`TX-DEM-2026-001`). The Release is `APPROVED`, `published_at` is `NULL`, and verification and accuracy remain `UNKNOWN`. Its checksum is `ff17bcb5a85ddd31e47b7e2d8e6742819f3aacb47ca8a3a611dc5c0a859eb5e6`; coverage is `[104.3, 21.05, 104.8, 21.55]`, CRS is `EPSG:4326`, vertical datum is `WGS84_ELLIPSOID`, and resolution is 60 m.

The published R2 bucket contains 342/342 verified immutable objects: one manifest and 341 terrain tiles, with zero conflicts. Anonymous manifest GET/HEAD, representative tile GET, immutable cache control, and CORS for `https://ta-xua-land-web.vercel.app` passed. Exactly one `spatial_object_deliveries` receipt and one `DATASET_OBJECT_DELIVERED` audit event exist. `publicLayers()` correctly still returns null terrain fields because the Release is not `PUBLISHED`.

The owner accepts the existing Cloudflare R2 `r2.dev` origin as temporary Phase 1B public infrastructure through non-secret `PUBLIC_ASSET_BASE_URL` configuration. It is not the final production CDN. A custom asset domain is deferred; migration must reuse the same immutable Release/bytes with delivery/readback and a second origin-specific receipt. No terrain rebuild, new Dataset, or application rewrite is required.

The Slice 1B change adds the missing authenticated, same-origin Admin Release publication endpoint and the minimal APPROVED-only Dataset control. It delegates UUID, configure permission, delivery, status, rights, provider and audit enforcement to the existing `publishRelease()` service. `pnpm check` passed with 143 tests plus build and secret scan; `pnpm test:e2e:core` passed all 10 browser tests. No production Release or provider configuration was mutated. The execution environment exposes local `.git` as read-only, so delivery uses an isolated exact-path Git index for the dedicated remote feature branch without touching unrelated workspace data.

The current architecture freeze remains in force. The approved specification extends it without reopening the frozen authority, publication, verification, provenance, security, or provider boundaries.

---

## 3. Current architecture state

Phase 0 architecture remains frozen.

The following continue to be authoritative:

```text
PostgreSQL/PostGIS
= spatial/application source of truth

CesiumJS
= primary 3D geospatial client

Object storage
= binary/raw/derived/published artifact storage

GIS pipelines
= reproducible spatial processing
```

Do not redesign:

- LAND / BIKER / TRIP boundaries;
- database ownership;
- CRS strategy;
- source/provenance semantics;
- verification semantics;
- geometry-history semantics;
- publication/release lifecycle;
- public/private boundaries;
- provider/secrets boundaries;
- core 3D engine;
- terrain / 3D Tiles strategy;
- future AI authority;

without the required ADR and explicit owner approval.

---

## 4. Phase 0.5 implementation state

Merged PR #2 contains substantial deployment/provider-hardening work, including:

- typed LOCAL / PREVIEW / STAGING / PRODUCTION environment contracts;
- Vercel/serverless runtime hardening;
- managed PostgreSQL/PostGIS runtime configuration;
- runtime database readiness checks;
- provider-neutral object storage contracts;
- S3-compatible object storage support;
- private/published storage separation;
- durable import upload sessions;
- serverless-safe import handling;
- import retention support;
- spatial object publication/delivery work;
- Next.js output tracing for isolated workbook parsing;
- Phase 0.5 ADR and operations documentation;
- deployment/provider regression tests.

Do not reimplement this work from zero.

Inspect current `main` and its governing documents before proposing any replacement.

---

## 5. Provider/deployment state

The 2026-09-11 handoff records that significant external setup was completed after older prerequisite documents were written.

Reported completed setup includes:

```text
Dedicated LAND Vercel project
Dedicated LAND Supabase/PostGIS staging project
LAND application runtime database role
Working Admin login
Dedicated Cloudflare R2 private bucket
Dedicated Cloudflare R2 published bucket
Separate R2 credential roles
R2 lifecycle configuration
R2 CORS configuration
Staging public asset delivery endpoint
```

Phase 0.5 provider acceptance is PASS. The sanitized acceptance report records successful private and published R2 operator lifecycles, anonymous public HTTP 200 delivery, exact-byte and SHA-256 integrity, cleanup, and owner-attested deployed credential separation. No secrets were exposed.

The earlier Windows R2 TLS failure remains historical client/network-path evidence; the independent Linux Docker run proved the configured provider path. See `docs/operations/phase-0-5-h-provider-acceptance.md` for the authoritative evidence record.

---

## 6. Phase 0.5 closure

Phase 0.5 acceptance is closed and its implementation is merged. The provider-tested source SHA and the later documentation/security commits are intentionally distinguished in the acceptance report. The current merge commit is `47b3f8fabbba5f784092b13c8c1fa6205fe8ed47`.

Historical setup and closeout instructions remain useful evidence, but their earlier OPEN/DRAFT/NOT CLOSED labels are not current state.

---

## 7. Evidence semantics

Maintain strict distinctions:

```text
CONFIGURED != HEALTHY

LOCAL QA != PROVIDER ACCEPTANCE

DEPLOYED != FUNCTIONALLY VERIFIED

RENDERED != ACCURATE

PUBLISHED != VERIFIED

INGEST != PUBLISH

IMPORT COMMIT != PUBLISH
```

Successful Vercel deployment, bucket creation, Cesium rendering, local tests, or provider configuration does not by itself prove all Phase 0.5 acceptance criteria.

When recording evidence, classify it explicitly as one of:

```text
PASS
PARTIAL
OPEN
UNKNOWN
NOT APPLICABLE
```

Do not convert missing evidence into PASS.

---

## 8. Current visual authority

The canonical visual library is Series 00–10.

For historical Phase 0.5 operations work:

```text
Primary current operational visual
Series 07 — Operations, Diagnostics & Security
```

Global Admin navigation:

```text
Series 02 v2 — Admin System Overview
```

Spatial verification workflow:

```text
Series 03 v2 — Spatial Truth Verification Workspace
```

If Series 03 global navigation conflicts with Series 02, Series 02 wins.

### Not authorized implementation scope

Do not pull these future concepts into implementation merely because they are visible in the boards:

```text
Series 01 v2 full mature public 3D experience
Series 09 Property Registry / Property Intelligence
Series 10 AI Advisor / AI Control Center
Brokerage workflows
```

Visual sample values remain illustrative only.

---

## 9. Phase 1 boundary

Phase 1 is:

```text
Tà Xùa 3D
```

with focus on:

- regional terrain;
- imagery;
- roads;
- geographic/village context where data exists;
- approved published Places;
- search;
- select/fly-to;
- source/verification presentation;
- responsive public 3D experience.

Primary visual:

```text
01-public-map-3d-experience-v2.png
```

Current implementation state is bounded to:

```text
Slice 1A — COMPLETE / MERGED
Public 3D shell + regional camera + degraded-state baseline

Slice 1B — TEMPORARY RUNTIME PATH READY FOR REVIEW / NOT PUBLISHED
Production Release delivered and APPROVED; publication and browser terrain validation remain open
```

The approved specification is merged through PR #4 and Slice 1A through PR #5. Do not use the future visual board or the blocked Slice 1B gate as authorization to implement imagery, Property, AI, full viewshed intelligence, or travel-commerce routing.

---

## 10. Current operational risks

Keep these risks visible during the current Phase 1 slice:

- published operator credentials may accidentally enter web runtime;
- private/public storage authority may be blurred;
- generated visual values may be mistaken for real data;
- local QA data may be mistaken for field-verified truth;
- source licensing may be inferred from technical availability;
- a successful Cesium render may be treated as spatial accuracy evidence;
- Property/AI scope may leak into the Phase 1 specification;
- broad refactoring before an approved specification may create unnecessary risk.

Prefer the bounded approved slice over unrelated cleanup.

---

## 11. Files to read for the current task

Before changing implementation or authority boundaries, read at minimum:

```text
AGENTS.md
CONTEXT.md
CONTRIBUTING.md
ARCHITECTURE.md
SECURITY.md

docs/PHASE_0_SPATIAL_FOUNDATION.md
docs/operations/phase-0-architecture-freeze.md
docs/operations/implementation-status.md
docs/operations/acceptance.md
docs/operations/known-limitations.md
docs/operations/deployment.md
docs/operations/managed-postgis.md
docs/operations/object-storage.md
docs/operations/observability.md
docs/operations/phase-0-5-status.md
docs/operations/phase-0-5-h-prerequisites.md
```

For deeper continuity, consult the archived 2026-09-11 handoff package.

For visual work, read the relevant canonical visual specification rather than all boards indiscriminately.

---

## 12. Skill/plugin posture for the current phase

Use `docs/agents/SKILL_ROUTING.md` and `docs/agents/SPATIAL_3D_WORKFLOW.md`. Their core ownership model is:

```text
Requirements / domain / architecture reasoning
→ Matt Pocock skills when genuinely needed

Primary implementation / TDD / debugging
→ Superpowers

Minimalism constraint
→ Ponytail throughout implementation

Frontend implementation
→ Build Web Apps when relevant

Responsive / forms / touch / accessibility
→ frontend-design-pro when relevant

Visual polish
→ Designer Skill when relevant

3D specialist reasoning
→ 3dviz-pro-max only for scoped 3D/spatial-presentation work
  and never as a replacement for Cesium/PostGIS authority

Browser verification
→ Playwright

Final substantial review
→ Matt code-review
```

During Phase 1 specification work, use 3D/visual skills only for scoped reasoning and presentation; they do not replace PostGIS or CesiumJS authority.

---

## 13. Validation expectations

Repository guidance currently requires:

```text
pnpm check
pnpm test:e2e:core
```

plus affected integration/provider/runtime checks.

Do not claim E2E PASS unless the isolated E2E environment actually ran successfully.

Do not point browser E2E at a public production database.

Use dedicated disposable QA/test infrastructure according to repository documentation.

For report-only acceptance work, do not modify provider configuration unless evidence proves a change is actually required.

---

## 14. Git safety

Work on a focused branch and PR.

Before any modification:

```text
git status --short
git branch --show-current
git fetch origin
```

Do not destroy uncertain local work.

Avoid destructive Git operations unless the owner explicitly authorizes the exact action.

Do not commit:

- secrets;
- `.env` files;
- raw workbooks;
- private evidence;
- generated GIS binaries;
- terrain build output;
- provider credentials;
- unrelated local files.

Stage only intended paths.

---

## 15. Exact next action

Wait for CI and Vercel Preview on the dedicated `feat/phase-1b-published-terrain-runtime` PR. After review/merge, set the Vercel runtime's non-secret `PUBLIC_ASSET_BASE_URL` to the exact temporary receipt origin, separately authorize publishing `TX-DEM-2026-001`, and validate real terrain in the deployed browser. Imagery remains `UNAVAILABLE`; do not start Slice 1C.

---

## 16. Stop conditions

Stop and ask for owner review if any of the following occurs:

- architecture freeze appears to require reopening;
- a new ADR is required;
- credentials/secrets would need to be exposed in chat, Git, logs, or screenshots;
- production mutation appears necessary merely to produce evidence;
- current evidence conflicts materially with the governing repository record;
- proposed work contains unapproved Phase 1 implementation;
- public/private storage authority is ambiguous;
- published operator credentials appear in web runtime;
- source/license/publication authority cannot be established;
- destructive Git would be required to proceed;
- unrelated local changes appear and ownership is unclear;
- the correct semantic behavior cannot be determined from current contracts/ADRs/tests.

Do not guess through a trust or authority ambiguity.

---

## 17. Update rule for this file

Update this file after any material transition such as:

```text
PR #2 becomes Ready
Phase 0.5 acceptance closes
PR #2 merges
main advances
provider acceptance changes
a new blocker is discovered
Phase 1 is explicitly authorized
a substantial feature branch is completed
```

Every update should preserve:

```text
what changed
what was actually verified
what remains unknown
exact next action
```

Do not rewrite historical handoff documents merely to make them look current.

---

## Current summary

```text
PRODUCT
TÀ XÙA LAND — spatial authority / geospatial platform

PHASE 0.5 MERGE BASELINE
47b3f8fabbba5f784092b13c8c1fa6205fe8ed47

PHASE 0.5 PR
#2 — MERGED

CURRENT PHASE
Phase 1 in progress — Slice 1A complete / merged; Slice 1B delivered and APPROVED, not published

PRIMARY CURRENT GOAL
Deliver the verified bounded Release publication path through its dedicated PR without publishing yet

PHASE 1
IN PROGRESS / SLICE 1A COMPLETE / SLICE 1B DATA READINESS ENABLEMENT READY FOR REVIEW

ARCHITECTURE
FROZEN

SPATIAL AUTHORITY
PostgreSQL/PostGIS

PRIMARY 3D CLIENT
CesiumJS

NEXT
Wait for feature-branch CI and Vercel Preview, then separately authorize temporary r2.dev publication and browser validation; do not start Slice 1C.
```
