# TÀ XÙA LAND — CURRENT STATUS

Status: Mutable operational snapshot
Last reconciled: 2026-09-11
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

The approved Phase 1 specification is merged through PR #4. Slice 1A is complete and merged through PR #5. Phase 1 remains in progress; Slice 1B terrain data-readiness enablement is ready for review, while the production DATA READY gate remains blocked pending owner rights approval and separately authorized registration/delivery/publication.

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
SLICE 1B: DATA READINESS ENABLEMENT READY FOR REVIEW
PRODUCTION TERRAIN: DATA READY BLOCKED
```

The owner approved the Phase 1 specification and its four scope/data-readiness decisions on 2026-09-11. PR #4 merged the documentation-only specification; PR #5 subsequently merged the completed Slice 1A public 3D shell.

Owner final screenshot review passed for Series 00, 01, and 08, and required remote CI passed on the reviewed PR #5 head. Functional, visual, scope, architecture, and E2E review are PASS; Slice 1A is complete and merged. The neutral reference grid remains the honest fallback: Slice 1A does not imply that any terrain or imagery source/release is approved.

Slice 1B discovery on 2026-09-11 found that the production public-layer contract returns HTTP 200 but exposes `terrainUrl`, `terrainRelease`, and `terrainChecksum` as `null`. The exact Phase 1 terrain release remains unselected, and the Phase 0.5 provider acceptance proved only the bounded diagnostic object lifecycle, not governed delivery of a terrain Release. The local `TX-DEM-2026-001` QA output is not production Dataset/Release/publication evidence.

The bounded data-readiness enablement now provides an operator-only registration gate that validates the existing build and creates only an `APPROVED` Release with asset descriptors, completed pipeline evidence and audit. The actual candidate passed this gate in disposable local PostGIS with 347 registered descriptors, `published_at=null`, and no delivery receipt. No runtime, provider, schema, production data, R2, delivery or publication mutation was performed. Production remains DATA READY BLOCKED until the owner reviews the proposed Source rights, explicitly authorizes production registration, reviews the resulting exact Release identity, and separately authorizes delivery/publication.

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

Slice 1B — DATA READINESS ENABLEMENT READY FOR REVIEW
Production DATA READY remains blocked; no governed terrain Release is currently exposed
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

Review the Slice 1B data-readiness enablement and proposed Source record. Production registration requires explicit owner rights and mutation authorization; later object delivery and publication remain separate approvals. Do not bind terrain until one exact eligible immutable published terrain Release is established; imagery remains `UNAVAILABLE` and Slice 1C has not started.

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
Phase 1 in progress — Slice 1A complete / merged; Slice 1B enablement ready for review

PRIMARY CURRENT GOAL
Review Source rights and the operator-only APPROVED terrain registration gate

PHASE 1
IN PROGRESS / SLICE 1A COMPLETE / SLICE 1B DATA READINESS ENABLEMENT READY FOR REVIEW

ARCHITECTURE
FROZEN

SPATIAL AUTHORITY
PostgreSQL/PostGIS

PRIMARY 3D CLIENT
CesiumJS

NEXT
Owner rights/release review, then separate production registration authorization; do not start Slice 1C.
```
