# Repository guidance

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Phase 0 architecture freeze](docs/operations/phase-0-architecture-freeze.md) before editing. Preserve the accepted domain, spatial, verification, provenance and security boundaries. Changes listed in the freeze require a new ADR and explicit owner approval before implementation.

Use logical commits on a branch, validate `pnpm check` and `pnpm test:e2e:core`, then deliver through a PR with the required GitHub checks. Never commit secrets, raw workbooks or generated GIS assets. Phase 1 implementation requires its dedicated specification and explicit approval.

---

# Agent operating model

Codex is the central coordinator for repository work.

Skills and plugins are specialized workflows or capabilities. They do not replace repository authority, architecture, current code, tests, or each other.

For substantial work, use the smallest sufficient set of specialists and keep one primary owner for each phase.

```text
USER
  ↓
CODEX COORDINATOR
  ↓
READ REPOSITORY AUTHORITY
  ↓
CLASSIFY TASK + CURRENT PHASE
  ↓
SELECT ONE PRIMARY OWNER PER PHASE
  ↓
IMPLEMENT / VERIFY / REVIEW
  ↓
UPDATE PROJECT MEMORY
  ↓
COMMIT / PUSH / PR
```

Explicit owner instructions have highest priority unless they would violate a security or repository safety boundary.

---

# Required read order

Before substantial changes, read:

```text
AGENTS.md
CONTEXT.md
docs/status/CURRENT.md
```

Then read only the task-relevant sources, such as:

```text
CONTRIBUTING.md
ARCHITECTURE.md
SECURITY.md
docs/PHASE_0_SPATIAL_FOUNDATION.md
docs/operations/phase-0-architecture-freeze.md
relevant ADR
relevant spec
relevant handoff
relevant tests
relevant visual specification
relevant GitHub Issue / PR
```

Do not load every historical handoff or every visual board for every task.

Use progressive disclosure: read the smallest authoritative context needed to act safely.

---

# Source-of-truth order

When instructions, visuals, skills, or historical notes conflict, use this order:

```text
1. Explicit owner instruction
2. Approved architecture / frozen semantic rules / ADRs
3. Current repository contracts, migrations, and tests
4. Approved current specification
5. Canonical visual authority
6. Specialist Skill / Plugin recommendation
7. Generic best practice
```

Historical handoffs and archived documents are evidence and continuity aids, not automatically current truth.

For mutable repository/PR/blocker state, prefer:

```text
docs/status/CURRENT.md
+
fresh local/remote Git inspection
```

Do not treat a stale snapshot as current merely because it is detailed.

---

# Project identity and durable boundaries

TÀ XÙA LAND is an independent geospatial / spatial-intelligence platform.

Canonical ecosystem ownership:

```text
LAND
= spatial authority

BIKER
= mobility + live/local authority

TRIP
= travel commerce + itinerary authority
```

Do not merge databases or share database-owner, service-role, or private-storage credentials across products.

PostgreSQL/PostGIS remains the authoritative spatial/application datastore.

CesiumJS remains the primary 3D geospatial client.

Object storage stores binary/raw/derived/published artifacts but does not replace PostGIS/domain authority.

GIS pipelines own reproducible spatial processing.

Read [CONTEXT.md](CONTEXT.md) for durable domain and semantic context.

---

# Non-negotiable semantic rules

Keep these distinctions explicit:

```text
Declared != Observed != Verified

Source Authority != Verification

Published != Verified

Imported != Published

Import Commit != Publish

Dataset != Release

Release Candidate != Published Release

Published Release = immutable

Unknown != Zero

Property != Parcel

Property != Listing

Seller Claim != LAND Verified Fact

Asking Price != Market Value

Straight Distance != Network Distance

Road Mapping != Road Safety

Aspect != View

Viewshed != Guaranteed Real-World View

AI != Spatial Authority
```

Do not simplify the UI, schema, or implementation by collapsing these concepts.

A rendered result does not establish spatial accuracy.

A map line does not establish road safety.

A published record does not establish verification.

UNKNOWN remains UNKNOWN.

---

# Architecture freeze

Phase 0 architecture is frozen unless explicitly reopened through the approved ADR process.

Do not casually change:

- product/database ownership;
- LAND/BIKER/TRIP boundaries;
- repository/domain boundaries;
- CRS strategy;
- source/provenance semantics;
- verification semantics;
- geometry-history semantics;
- publication/release lifecycle;
- public/private boundaries;
- provider/secrets boundaries;
- AI tool authority;
- core 3D engine;
- terrain / 3D Tiles strategy.

If a task appears to require one of these changes:

```text
STOP
→ identify the conflict
→ inspect current ADRs/contracts
→ propose the smallest architecture decision
→ document alternatives
→ document migration/data/security/rollback/test impact
→ request explicit owner approval
→ implement only after approval
```

Do not let a Skill recommendation silently reopen architecture.

---

# Phase gates

Always identify the current product phase before implementation.

Current operational truth belongs in:

```text
docs/status/CURRENT.md
```

Do not start a future phase merely because its visual board exists.

In particular:

```text
Phase 1 — Tà Xùa 3D
```

requires:

- Phase 0.5 closure/merge;
- a dedicated Phase 1 specification;
- explicit owner approval.

Property, AI, and Brokerage remain future-phase work unless explicitly authorized.

---

# Skill and plugin coordination

Detailed routing lives in:

```text
docs/agents/SKILL_ROUTING.md
```

Use the following ownership model.

## Requirements / domain / architecture reasoning

Primary owner:

```text
Matt Pocock skills
```

Use when behavior or authority is genuinely unclear.

Useful helpers may include:

```text
domain-modeling
grilling
research
codebase-design
code-review
resolving-merge-conflicts
```

The following workflows are explicit-owner-invocation only:

```text
$grill-with-docs
$to-spec
$to-tickets
$improve-codebase-architecture
$setup-matt-pocock-skills
```

Do not automatically invoke these explicit workflows.

Do not repeat skill setup if the repo is already configured.

## Primary implementation / TDD / debugging

Primary owner:

```text
Superpowers
```

Once intended behavior is sufficiently clear, Superpowers owns:

- implementation planning;
- TDD;
- implementation sequencing;
- systematic debugging;
- verification-oriented iteration.

Do not run a competing full implementation workflow for the same phase.

## Minimalism / anti-overengineering

Constraint:

```text
Ponytail
```

Apply throughout implementation.

Prefer:

```text
existing project code
→ standard library
→ platform-native capability
→ dependency already installed
→ minimal new implementation
```

Do not use minimalism to sacrifice correctness, security, accessibility, data integrity, auditability, or required error handling.

## Frontend engineering

Use:

```text
Build Web Apps
```

when the task materially changes frontend application behavior.

It must preserve current Next.js boundaries and keep domain authority out of React components where it does not belong.

## Responsive / forms / touch / accessibility

Use:

```text
frontend-design-pro
```

for:

- responsive layouts;
- mobile/tablet transformations;
- forms;
- touch interactions;
- accessible labels;
- keyboard behavior;
- focus states;
- error states;
- drawers/bottom sheets.

## Visual polish

Use:

```text
Designer Skill
```

for visual refinement only when the task materially benefits from it.

Designer guidance must remain subordinate to domain correctness, accessibility, performance, and canonical visual authority.

## Spatial / 3D specialist

Use:

```text
3dviz-pro-max
```

only for meaningful 3D/spatial-presentation work.

Detailed rules live in:

```text
docs/agents/SPATIAL_3D_WORKFLOW.md
```

3dviz-pro-max may advise:

- scene hierarchy;
- terrain readability;
- camera composition;
- lighting;
- materials;
- landmark/object representation;
- motion;
- interaction;
- LOD;
- hotspot presentation;
- rendered-frame refinement.

It must not silently:

- replace Cesium with Three.js;
- create a parallel Vite 3D application;
- replace PostGIS with browser scene state;
- bypass Dataset/Release authority;
- fabricate terrain/spatial facts;
- infer accuracy from appearance;
- change terrain/3D Tiles strategy without an approved ADR.

If 3dviz guidance is Three.js-specific, extract the reusable 3D principle and translate it into the accepted Cesium architecture where appropriate.

## Browser verification

Primary owner:

```text
Playwright
```

Use focused browser verification for affected user-facing flows.

Do not replace repository-required deterministic E2E with ad hoc browser checks.

Do not claim a visual/browser result unless it was actually observed.

## Final substantial review

Use:

```text
Matt code-review
```

for substantial changes when useful.

Focus on material findings, especially architecture, data authority, security, scope, and regression risk.

## Merge conflicts

Use:

```text
resolving-merge-conflicts
```

only for an actual merge/rebase conflict.

If resolving a conflict requires a product/domain decision, stop for owner review.

---

# One phase, one primary owner

Avoid overlapping workflow ownership.

Good:

```text
Requirements
→ Matt

Implementation/TDD/debugging
→ Superpowers

Minimalism
→ Ponytail

3D reasoning
→ 3dviz-pro-max

Frontend engineering
→ Build Web Apps

Responsive/a11y
→ frontend-design-pro

Browser QA
→ Playwright

Final review
→ code-review
```

Bad:

```text
Superpowers planning
+
another full planning workflow
+
another TDD workflow
+
another implementation agent
```

More Skills do not automatically produce better results.

Use the minimum sufficient specialist set.

---

# Visual specification routing

The canonical visual library is indexed at:

```text
docs/visual-specs/README.md
```

Use these authorities:

```text
Series 00
→ Design System / highest visual authority

Series 01 v2
→ Public Map & 3D Experience

Series 02 v2
→ GLOBAL ADMIN INFORMATION ARCHITECTURE

Series 03 v2
→ Spatial Verification workflow

Series 04
→ Place / POI

Series 05
→ Excel Import / Data QA

Series 06
→ Dataset / Release

Series 07
→ Operations / Diagnostics / Security

Series 08
→ Responsive transformation

Series 09
→ future Property

Series 10
→ future AI
```

If Series 03 shows a global sidebar that conflicts with Series 02:

```text
Series 02 wins globally.
```

Generated visual numbers, dates, names, coordinates, counts, and AI text are illustrative only.

Do not seed production data or infer implementation completeness from visual completeness.

---

# 3D/spatial authority chain

For spatial/3D work, preserve:

```text
SOURCE
→ PROVENANCE
→ POSTGIS / DATASET / RELEASE
→ PUBLIC-SAFE CONTRACT
→ CESIUM
→ 3D PRESENTATION
→ OBSERVED BROWSER OUTPUT
```

Never reverse this chain.

Examples:

```text
beautiful mesh
!= verified terrain accuracy

rendered road
!= road safety

Place marker
!= field verification

animation
!= physical simulation
```

For significant 3D tasks, read:

```text
docs/agents/SPATIAL_3D_WORKFLOW.md
```

before implementation.

---

# Next.js and repository stack

This repository uses Next.js/React/TypeScript with Node 24 and pnpm.

Respect current package/application boundaries.

Before making framework-specific changes, inspect the installed Next.js version and current repository behavior.

When current Next.js behavior may differ from model training knowledge, prefer the documentation available with the installed framework/package or official current documentation rather than relying on memory.

Do not introduce a second frontend framework or standalone Vite application merely because a Skill template uses one.

---

# Testing and verification

Repository guidance requires:

```text
pnpm check
pnpm test:e2e:core
```

with appropriate affected integration/provider/runtime checks.

Run targeted tests during development before broad checks when useful.

Do not claim PASS for a check that did not run.

Distinguish:

```text
UNIT/INTEGRATION PASS
REPOSITORY E2E PASS
BROWSER OBSERVED
PROVIDER VERIFIED
PRODUCTION VERIFIED
UNKNOWN
```

These are not interchangeable.

Do not point browser E2E at a public production database.

Use disposable/isolated QA infrastructure according to repository documentation.

For browser-facing work, verify the smallest set of affected critical flows.

For substantial responsive work, inspect relevant desktop/mobile behavior.

For significant 3D work:

```text
BUILD IT
→ RUN IT
→ LOOK AT IT
→ REFINE IT
```

Do not approve visual behavior from code inspection alone.

---

# Persistent Playwright session

When authenticated browser verification is required and the dedicated profile exists, prefer:

```text
session:
taxualand-qa

profile:
C:\Users\ADMIN\.playwright-profiles\taxualand-qa
```

This profile lives outside the repository and may contain authentication state.

Never:

- commit it;
- sync it publicly;
- inspect raw cookies/tokens as routine task data;
- print credentials;
- delete/recreate it casually.

Use bounded browser commands and reasonable timeouts.

Avoid one large verification script that can hang indefinitely.

---

# Current-state reconciliation before coding

At the beginning of a coding session, inspect at minimum:

```text
git status --short
git branch --show-current
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
git log -8 --oneline
```

If working on a known remote feature branch, also inspect its current remote SHA.

Do not use destructive commands merely to make local state match a prompt or handoff.

If local state diverges, report the divergence and preserve uncertain work.

Current repository state wins over stale conversational assumptions for implementation facts.

Frozen architecture semantics remain authoritative unless an approved ADR changed them.

---

# Git safety

Do not use broad staging commands:

```text
git add .
git add -A
```

Stage exact intended paths.

Do not use destructive Git operations on uncertain work without explicit owner authorization, including:

```text
git stash
git reset
git restore
git clean
force push
history rewriting
branch deletion
```

Before commit:

```text
git status --short
git diff
git diff --check
git diff --cached --name-status
git diff --cached --check
```

Use concise logical Conventional Commit messages where practical.

Push normally.

Never force-push unless explicitly authorized.

A successful push is not deployment verification.

A successful deployment is not functional verification.

---

# Secrets and sensitive artifacts

Never commit or expose:

- `.env` files;
- database passwords;
- database-owner URLs;
- service-role credentials;
- provider master tokens;
- private object-storage secrets;
- published operator secrets;
- Vercel tokens;
- bootstrap credentials;
- signed private upload URLs;
- raw workbooks;
- private evidence;
- generated GIS binaries;
- production data exports.

Never ask the owner to paste secrets into chat.

The owner should inject secrets through the appropriate secure environment.

---

# Provider and deployment work

For provider/deployment acceptance:

```text
CONFIGURED != HEALTHY
DEPLOYED != FUNCTIONALLY VERIFIED
LOCAL FAILURE != PROVIDER FAILURE
```

Do not change provider configuration during evidence-only work unless the evidence shows a configuration change is genuinely necessary.

Do not treat a local Windows TLS failure as proof that Cloudflare R2 itself is down or invalid.

Do not mutate Production merely to satisfy a verification checklist.

Use staging, Preview, dedicated QA, or non-destructive production checks according to the task and repository policy.

---

# Public/private and credential separation

The web runtime must remain least-privileged.

Keep separate:

```text
runtime application DB role
!= database owner/operator

private storage runtime credential
!= published release operator credential

admin user
!= database owner

public DTO
!= internal/private record
```

No browser/client bundle may receive server-only credentials.

No untrusted input may choose arbitrary provider endpoints.

---

# Status and handoff updates

After substantial work, update:

```text
docs/status/CURRENT.md
```

with:

- what changed;
- what was actually verified;
- what remains UNKNOWN;
- current blocker;
- exact next action.

Create/update `docs/handoffs/` only when future continuation materially benefits from it.

Create an ADR only for a durable architecture decision.

Do not rewrite historical handoff documents merely to make them look current.

Prefer adding a clear historical/status banner where old evidence should remain preserved.

---

# Substantial-task opening statement

For substantial tasks, briefly state before implementation:

```text
Primary workflow:
<skill/workflow>

Supporting specialists:
<skills/plugins>

Not needed:
<skills/plugins>

Reason:
<concise explanation>
```

This is a routing declaration, not a long ceremony.

Example for a future Phase 1 public 3D feature:

```text
Primary workflow:
Superpowers

Supporting:
Ponytail
3dviz-pro-max
Build Web Apps
frontend-design-pro
Playwright

Final review:
Matt code-review

Not needed:
to-spec / to-tickets / improve-codebase-architecture
unless explicitly requested or an architecture conflict appears.
```

---

# Model recommendation convention

When preparing a Codex prompt, include a model recommendation.

Use:

```text
Astra 6 — High
```

for difficult architecture, security/data-authority work, migrations, complex spatial logic, large refactors, difficult runtime/browser debugging, Phase 1 3D integration, and long multi-file workflows.

Use:

```text
Sol 5.6 — Medium
```

for clear routine implementation, UI/components, tests, docs, bookkeeping, type/lint fixes, and bounded verification.

Use:

```text
Sol 5.6 — High
```

for implementation-focused work with moderately difficult logic or several interacting files.

Model choice never overrides repository authority.

---

# Stop conditions

Stop and request owner review when:

- architecture freeze must be reopened;
- a new ADR is required;
- product/domain authority remains ambiguous;
- secrets would need to be exposed;
- public/private boundaries are unclear;
- Production mutation appears necessary merely for testing;
- a future phase is required unexpectedly;
- source/licensing/publication authority is unclear;
- destructive Git is required;
- unrelated local changes have unclear ownership;
- a 3D recommendation implies replacing Cesium or changing terrain/3D Tiles strategy;
- an AI workflow would gain generic DB/HTTP/browser/shell authority;
- a Skill recommendation conflicts with an approved repository contract.

Do not guess through a trust, security, or authority ambiguity.

---

# Final operating rule

Use the fewest Skills that fully cover the task.

```text
REPOSITORY AUTHORITY FIRST
→ ONE PRIMARY OWNER PER PHASE
→ SPECIALISTS ONLY WHERE THEY ADD VALUE
→ VERIFY THE ACTUAL RESULT
→ UPDATE CURRENT STATE
→ DELIVER SAFELY
```

For TÀ XÙA LAND:

```text
SPATIAL TRUTH
always outranks
VISUAL CONVENIENCE

ARCHITECTURE
always outranks
SKILL DEFAULTS

VERIFIED EVIDENCE
always outranks
CLAIMED SUCCESS
```
