# TÀ XÙA LAND — PHASE CODE EXECUTION MATRIX

Handoff version: 1.0
Snapshot: 2026-09-11
Purpose: map product phases to code scope, visual references, gates and explicit non-goals.

---

# 0. HOW TO USE THIS FILE

This file is the code-scope gatekeeper.

A feature appearing in a visual board does not mean it belongs to the current phase.

Before coding, determine:

- current phase;
- prerequisite gates;
- primary visual authority;
- supporting visual authority;
- repository/domain contracts;
- implementation deliverables;
- acceptance criteria;
- non-goals.

If a requested feature belongs to a future phase, do not quietly pull it forward.

Flag the scope change explicitly.

---

# 1. CURRENT POSITION

Current project state at this handoff:

```text
Phase 0 local implementation: COMPLETE / accepted locally
Phase 0.5 deployment hardening: CURRENT / not fully closed
Phase 1: NOT STARTED
Phase 2+: FUTURE
```

Current Git work:

```text
PR #2
Phase 0.5: production deployment hardening
branch: feat/phase-0-5-production-deployment
snapshot head: fb81e012c59d880a2b4b2e48e035c6cf6332f053
state: OPEN + DRAFT + NOT MERGED
```

Do not start Phase 1 before Phase 0.5 closeout and controlled merge.

---

# 2. CROSS-PHASE ARCHITECTURE THAT MUST NOT BE REBUILT

Already established architectural foundations include:

- independent LAND repository;
- Next.js/React/TypeScript application;
- Cesium 3D client foundation;
- PostgreSQL/PostGIS;
- explicit spatial/domain packages;
- protected Admin;
- source/provenance concepts;
- Place domain;
- geometry history;
- import staging/review/commit;
- dataset/release concepts;
- private/published storage separation;
- deterministic validation;
- public-safe projections;
- security/audit foundations.

Later phases extend these.

They should not create parallel replacement systems.

---

# 3. PHASE 0A — SPATIAL INFRASTRUCTURE

## Status

Implemented as part of Phase 0.

Future work should treat this as foundation, not restart it.

## Goal

Create a real geospatial platform foundation before building Property or AI.

## Primary visuals

- Series 00 — Design System
- Series 06 — Dataset & Release
- Series 07 — Operations / Security

## Supporting visuals

- Series 01 — Public map direction
- Series 02 — Admin system direction

## Core implementation domains

Repository:
- monorepo/application boundaries;
- code ownership;
- CI;
- architecture docs.

Web:
- Next.js;
- TypeScript strict;
- protected Admin;
- public route structure.

Spatial:
- Cesium initialization;
- CRS contracts;
- geometry types;
- AOI;
- PostGIS;
- spatial queries;
- geometry history.

GIS:
- terrain processing placeholder / pipeline;
- imagery/vector processing boundaries;
- reproducible outputs.

Data governance:
- source registry;
- provenance;
- freshness;
- public/private.

Security:
- runtime role;
- secret isolation;
- Admin roles;
- public-safe outputs.

## Acceptance principles

- real PostGIS integration;
- no secret in browser;
- Cesium client can initialize safely;
- spatial types are explicit;
- source metadata exists;
- architecture documented;
- UNKNOWN is supported.

## Explicit non-goals

- Property marketplace;
- public AI;
- brokerage;
- automatic valuation;
- cross-product shared DB.

---

# 4. PHASE 0B — SPATIAL CONTENT SYSTEM

## Status

Implemented as part of Phase 0.

## Goal

Turn Phase 0 from a technical map demo into an operational Spatial Content Platform.

Admin must be able to manage real Place-oriented spatial records.

## Primary visuals

- Series 04 — Place / POI Management
- Series 03 — Spatial Verification
- Series 02 — Admin System Overview

## Supporting visuals

- Series 00 — Design System
- Series 08 — Responsive

## Domain deliverables

Place:
- identity;
- categories;
- description/content;
- spatial geometry;
- source;
- verification state;
- publication state;
- media/reference metadata;
- history/version.

Admin:
- Place list;
- filters/search;
- create/edit;
- map picker;
- spatial review;
- source display;
- publication workflow.

Public:
- public-safe Place DTO;
- only allowed source/media/publication states;
- search/filter;
- map representation.

## Spatial semantics

A Place can have:

- declared geometry;
- observed evidence;
- candidate correction;
- verified geometry.

Do not flatten them.

## Acceptance

- Admin can create/edit/archive Place;
- geometry changes are traceable;
- public DTO does not leak draft/private data;
- publication and verification remain independent;
- map picker does not silently create Verified geometry;
- source/provenance is retained.

## Explicit non-goals

- full Digital Twin analytics;
- full road navigation product;
- Property Registry;
- AI.

---

# 5. PHASE 0C — BULK DATA INGESTION

## Status

Implemented as part of Phase 0.

## Goal

Accept human-friendly Excel input without turning spreadsheets into the database schema.

## Primary visual

- Series 05 — Excel Import & Data QA

## Supporting visuals

- Series 04 — Place
- Series 03 — Verification
- Series 02 — Admin
- Series 07 — Operations

## Canonical workflow

```text
UPLOAD
-> INSPECT
-> MAP
-> VALIDATE
-> STAGE
-> REVIEW
-> COMMIT
```

Normalization and spatial checks occur inside the controlled workflow.

## Implementation domains

Upload:
- signed private upload;
- file size/type constraints.

Workbook inspection:
- workbook metadata;
- sheets;
- blocked/macro/hidden/account-like content policies.

Mapping:
- source columns;
- canonical fields;
- required mapping.

Validation:
- data type;
- coordinate;
- category;
- source;
- duplicate;
- AOI;
- domain constraints.

Spatial QA:
- map preview;
- invalid marker;
- duplicate proximity;
- coordinate review.

Staging:
- no Place mutation before commit;
- review history.

Commit:
- atomic;
- idempotent;
- explicit CREATE/UPDATE/SKIP semantics where supported;
- provenance retained;
- draft/UNKNOWN semantics preserved.

## Acceptance

- malicious/invalid workbooks rejected safely;
- valid workbook can reach staging;
- map preview works;
- invalid rows are explainable;
- no Place mutation before explicit commit;
- commit rollback works atomically;
- commit does not auto-verify or auto-publish.

## Explicit non-goals

- Excel as authoritative schema;
- AI coordinate guessing;
- silent auto-fix;
- public publication during upload.

---

# 6. PHASE 0.5 — PRODUCTION DEPLOYMENT HARDENING

## Status

**CURRENT**

## Goal

Prove the Phase 0 system works against dedicated external providers and is operated with correct privilege separation.

## Primary visual

- Series 07 — Operations, Diagnostics & Security

## Supporting visuals

- Series 02 — Admin System
- Series 06 — Release management
- Series 00 — Design System

## Current provider stack

Application hosting:
- Vercel.

Managed PostGIS:
- dedicated Supabase project.

Object storage:
- Cloudflare R2;
- separate private/published buckets.

## Main code/ops domains

Hosting:
- production-like Next build;
- correct root/build/install;
- stable HTTPS origin;
- environment separation.

Database:
- migrations;
- application runtime role;
- TLS;
- pooler mode;
- privilege checks.

Storage:
- private runtime adapter;
- signed upload;
- readback integrity;
- published operator path;
- public delivery;
- cleanup.

Admin:
- authentication;
- RBAC;
- deployed operational access.

Diagnostics:
- structured PASS/WARN/FAIL/UNKNOWN;
- provider acceptance evidence.

Security:
- no owner credential in web runtime;
- no published operator credential in web runtime;
- no secrets in reports.

## Current closeout gate

Phase 0.5 cannot be called complete until provider acceptance evidence is closed.

See:

`05_PHASE_0_5_CLOSEOUT.md`

## Explicit non-goals

- Phase 1 UI expansion;
- new Product domain;
- AI;
- Property;
- redesign architecture to avoid a local network issue.

---

# 7. GATE BETWEEN PHASE 0.5 AND PHASE 1

Required before Phase 1:

```text
[ ] Provider acceptance closed
[ ] R2 private lifecycle proven from independent cloud path
[ ] R2 published lifecycle/public delivery proven
[ ] Diagnostic cleanup proven
[ ] Credential separation confirmed
[ ] Phase 0.5 report finalized
[ ] Repo QA green after final changes
[ ] PR #2 reviewed
[ ] PR #2 no longer draft
[ ] PR #2 merged
[ ] clean Phase 1 baseline established
```

If any critical item remains unresolved:

do not start Phase 1.

---

# 8. PHASE 1 — TÀ XÙA 3D

## Status

NOT STARTED at handoff.

## Goal

Deliver the first strong public Tà Xùa 3D product using the Phase 0 spatial foundation.

Phase 1 is where Series 01 becomes the primary public-product visual specification.

## Primary visual

**Series 01 v2 — Public Map & 3D Experience**

## Supporting visuals

- Series 00 — Design System
- Series 04 — Place
- Series 06 — Dataset/Release
- Series 08 — Mobile/Responsive
- Series 03 — verification presentation, not full Phase 2 workflow expansion

## Phase 1 user promise

A visitor can open TÀ XÙA LAND and meaningfully understand Tà Xùa in 3D.

The product should combine:

- terrain;
- imagery;
- roads;
- villages / geographic context where data exists;
- published Places;
- search;
- select/fly-to;
- source and verification presentation;
- responsive mobile experience.

## Phase 1 data work

Terrain:
- choose/approve production-intended source;
- confirm rights;
- register dataset;
- build reproducible release;
- QA;
- publish immutable release;
- connect public viewer.

Imagery:
- define approved regional imagery source;
- record license/rights/freshness;
- publish through dataset/release system.

Roads:
- publish approved road geometry;
- expose public-safe road context;
- preserve observation/freshness distinctions.

Places:
- approve real Place records;
- preserve source;
- preserve verification;
- public publication separate from verification.

## Phase 1 viewer work

Canonical features from Series 01 to prioritize:

- full-screen 3D regional map;
- camera reset/presets;
- place markers;
- marker clustering;
- global Place search;
- explore list + map;
- selected Place card;
- Place detail drawer;
- map layers;
- terrain metadata;
- source/verification display;
- shareable/focusable Place state;
- responsive bottom sheets;
- WebGL/fallback behavior.

## Features that may be implemented only if underlying data/service exists

- elevation profile;
- road/access route context;
- terrain inspector.

If the repository already has sufficient deterministic foundation, they may be introduced in a bounded way.

Do not fabricate data to match Series 01.

## Phase 1 explicit deferrals visible in Series 01

DO NOT implement yet merely because pictured:

- Property layer as full product;
- Property detail;
- LAND AI Advisor;
- full viewshed intelligence;
- full Property comparison;
- full trip-commerce route planning.

Future navigation entries may remain disabled/hidden according to product decision.

## Phase 1 API/data contracts

Prefer stable public-safe contracts.

Do not let Cesium query raw private tables.

Typical public information:

- Place identity;
- safe geometry;
- category;
- public media;
- source/verification summary;
- approved access context;
- release metadata.

## Phase 1 acceptance

Functional:

- `/map` reliably loads;
- real approved terrain release is rendered;
- imagery loads;
- approved Places render;
- search finds published Places;
- select/fly-to works;
- layer toggles do not reload application;
- source/verification state is visible;
- no draft/private records leak;
- share/deep-link behavior works if included;
- desktop/mobile map remains usable;
- WebGL failure has defined fallback.

Data:

- terrain release source/rights recorded;
- imagery source/rights recorded;
- road release source/rights recorded;
- all public Places have publication/source state;
- UNKNOWN remains visible when appropriate.

Performance:

- Cesium remains lazy where architecture requires;
- progressive loading;
- no whole-region oversized 3D payload;
- mobile quality profile is lower-cost but semantically identical.

Security:

- no new browser secrets;
- public URLs are public-safe;
- no arbitrary tiles endpoint.

## Suggested Phase 1 commit groups

A. Phase 1 baseline + visual/spec alignment
B. Production terrain release registration/delivery
C. Imagery and road release integration
D. Public Place map/list/search UX
E. Place detail/source/verification UX
F. Layers, compare/terrain metadata where scoped
G. Responsive/mobile polish
H. performance + E2E + launch acceptance

Commit grouping may change based on repository reality, but each group should remain independently reviewable.

---

# 9. PHASE 2 — DIGITAL TWIN / SPATIAL INTELLIGENCE

## Status

FUTURE.

## Goal

Turn the 3D map into a spatial-understanding system.

## Primary visuals

- Series 03 — Spatial Truth Verification
- Series 06 — Dataset & Release
- Series 01 — Public Map

## Supporting

- Series 07 — Operations
- Series 08 — Responsive
- Series 00 — Design System

## Major capability families

Terrain Intelligence:
- elevation;
- slope;
- aspect;
- terrain summary.

Access Intelligence:
- nearest road;
- road network relationships;
- access points;
- straight vs network distance;
- observation/freshness.

View Intelligence:
- viewpoint;
- direction;
- view sector;
- viewshed;
- obstruction assumptions.

Digital Twin:
- selected photogrammetry hotspots;
- 360 panorama;
- higher-detail assets where justified.

Verification:
- queue;
- candidate geometry;
- evidence;
- source conflict;
- human verification;
- expiry/review.

Temporal:
- observation timestamps;
- dataset release dependencies;
- stale derived results.

## Deterministic-first requirement

Analytics must be deterministic.

For every computed result record:

- input geometry version;
- dataset release;
- algorithm/policy version;
- timestamp;
- coverage/quality;
- output.

AI is not required for Phase 2.

## Spatial Verification work

Phase 0 provides foundations.

Phase 2 can mature the full Series 03 experience:

- Declared/Observed/Verified compare;
- candidate map editing;
- road/access checks;
- terrain plausibility;
- evidence center;
- verification checklist;
- history;
- domain-specific expiry;
- dataset lineage;
- polygon/line verification where needed.

## Acceptance

- calculations are reproducible;
- source release IDs visible;
- straight/network distance not conflated;
- viewshed has limitations;
- anomalies create review, not truth;
- verified geometry is human-authorized;
- old geometry history remains;
- recomputation occurs when dependency versions change.

## Explicit non-goals

- automatic Property valuation;
- public AI required for core functionality;
- automated legal conclusions.

---

# 10. GATE BETWEEN PHASE 2 AND PHASE 3

Property should not start only because the UI board exists.

Before Phase 3, prefer evidence that:

- regional spatial foundation is stable;
- Place/source/verification workflows are operational;
- terrain and road releases are versioned;
- spatial analytics produce reproducible outputs;
- verification history is trustworthy;
- public/private projection model is mature.

---

# 11. PHASE 3 — PROPERTY REGISTRY

## Status

FUTURE.

## Goal

Introduce Property as a domain on top of the spatial core without turning LAND into a generic listing CMS.

## Primary visual

**Series 09 — Property Registry & Property Intelligence**

For Phase 3, use only Registry-oriented sections of Series 09.

## Supporting visuals

- Series 03 — verification;
- Series 06 — datasets;
- Series 02 — Admin;
- Series 08 — responsive;
- Series 00 — design system.

## Core domain separation

```text
PROPERTY
!=
PARCEL
!=
LISTING
```

Property:
persistent domain entity.

Parcel:
spatial land geometry/reference.

Listing:
commercial offer/representation.

## Phase 3 deliverables

Property:
- identity;
- spatial reference;
- source;
- status;
- facts;
- evidence;
- history.

Parcel:
- geometry;
- source;
- version;
- claimed/computed/reference states;
- area calculation;
- verification.

Listing:
- relationship to Property;
- asking price;
- seller/agent source metadata;
- active/expired/archived lifecycle.

Property Facts:
- multiple source claims;
- preferred fact;
- verification;
- freshness;
- evidence.

Map:
- Property layer;
- Parcel visualization;
- Place/road/terrain context.

Admin:
- create/edit;
- fact review;
- geometry review;
- provenance;
- publication.

## Critical legal rule

LAND digitized Parcel geometry does not automatically equal an official cadastral/legal boundary.

Legal/planning stays UNKNOWN unless authoritative evidence exists.

## Phase 3 acceptance

- Property/Parcel/Listing separated in schema;
- conflicting facts coexist;
- asking price not treated as valuation;
- Parcel version/history exists;
- source and verification independently represented;
- public projection removes private seller/legal data;
- no AI required.

## Explicit non-goals

- AI Property Advisor;
- automatic appraisal;
- "good investment" classification;
- brokerage transactions;
- automatic legal verification.

---

# 12. PHASE 4A — PROPERTY INTELLIGENCE

## Status

FUTURE.

## Goal

Add deterministic decision-support above Property Registry.

## Primary visual

Series 09, intelligence-oriented panels.

## Supporting

- Series 03;
- Series 06;
- Series 08.

## Analysis domains

Access:
- direct distance;
- network distance;
- access point;
- road evidence;
- freshness.

Terrain:
- elevation;
- slope;
- aspect;
- relief.

View:
- viewpoint;
- viewshed;
- direction;
- limitations.

Nearby:
- verified Places;
- infrastructure;
- spatial context.

Price Evidence:
- comparable records;
- source;
- date;
- filters.

Confidence:
- per-domain.

## Rule

No magic single score.

If a composite score is introduced later:

- methodology documented;
- deterministic;
- versioned;
- inputs visible;
- limitations visible.

## Acceptance

- every derived result has lineage;
- stale dependency triggers recomputation/stale state;
- comparables do not become automatic valuation;
- confidence is domain-specific;
- UNKNOWN legal data stays UNKNOWN.

---

# 13. PHASE 4B — AI TOOL GATEWAY

## Status

FUTURE.

## Goal

Create a safe, explicit, read-only tool layer over authoritative LAND services.

## Primary visual

Series 10.

## Supporting

- Series 09;
- Series 03;
- Series 07.

## Allowed tool categories

- search public Places/Properties;
- retrieve public-safe facts;
- retrieve terrain analysis;
- retrieve road/access analysis;
- retrieve viewshed;
- retrieve nearby context;
- retrieve comparables;
- retrieve provenance/verification summary;
- UI-only map actions.

## Forbidden

- SQL;
- arbitrary RPC;
- arbitrary HTTP;
- browser;
- shell;
- file system;
- secrets;
- verify;
- publish;
- owner/admin mutation;
- Property approval.

## Acceptance

- every tool typed and allow-listed;
- RBAC/audience enforced;
- public Advisor gets public-safe projections;
- Admin Assistant still cannot bypass permission;
- tool execution auditable;
- prompt injection cannot broaden tool access.

---

# 14. PHASE 4C — AI CONTROL CENTER

## Status

FUTURE.

## Goal

Make AI configuration governed, observable and reversible.

## Primary visual

Series 10 Admin panels.

## Components

- Provider registry;
- model aliases;
- personas;
- tool registry;
- policies;
- prompt versions;
- evaluation;
- usage/cost;
- diagnostics;
- audit;
- kill switches;
- release/promotion.

## Promotion flow

Suggested conceptual flow:

```text
DRAFT CONFIG
-> TEST
-> EVALUATE
-> REVIEW
-> ACTIVE
-> SUPERSEDED/RETIRED
```

Exact repository implementation can vary.

## Acceptance

- provider-neutral;
- secrets not editable/readable as plain text;
- failed critical eval blocks promotion;
- active config is versioned;
- kill switch works without taking LAND core offline.

---

# 15. PHASE 4D — LAND ADVISOR

## Status

FUTURE.

## Goal

Provide grounded conversational explanation over LAND facts.

## Primary visual

Series 10 public Advisor panels.

## User capabilities

- ask about Place;
- ask about access;
- ask about elevation/slope;
- ask about nearby Places;
- compare Properties;
- understand evidence/conflicts;
- open/fly-to map entities.

## Answer contract

Good answer:

- grounded;
- cites authoritative record/release;
- preserves UNKNOWN;
- distinguishes Declared/Verified;
- does not invent score;
- does not assert legal certainty.

## AI unavailability

If AI is down:

LAND core remains usable.

---

# 16. PHASE 5 — BROKERAGE

## Status

DEFERRED / FUTURE.

## Gate

A separate legal/compliance review is mandatory before implementation.

## Current visual status

No canonical Series 11 yet.

Series 09 is only foundational context.

Do not extrapolate a brokerage CRM from Property visual boards.

## Possible future domains

- Lead;
- appointment;
- agent workflow;
- offer;
- document workflow.

These require dedicated architecture and visual specification later.

---

# 17. FEATURE MATURITY MATRIX

| Capability | 0/0.5 | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|---|
| Cesium shell | Foundation | Mature public viewer | Expand | Reuse | Reuse |
| Place | Foundation | Public maturity | Spatial enrichment | Nearby context | AI tools |
| Excel import | Implemented | Operate | Extend if needed | Property import later | AI explains only |
| Spatial verification | Foundation | Display trust | Major workflow maturity | Reuse for Property | AI explain only |
| Dataset releases | Foundation | Production terrain/imagery/roads | More analytics/hotspots | Feed Property | Feed AI |
| Terrain | Local pipeline/foundation | Real public release | Analytics | Property terrain | Advisor retrieval |
| Roads | Foundation/local | Public road context | Network/access intelligence | Property access | Advisor retrieval |
| Viewshed | No full product | Deferred | Implement | Property view | Advisor explanation |
| Property | No | No | No | Registry | Intelligence |
| AI | No runtime | No | Optional architecture only | No public requirement | Implement |
| Brokerage | No | No | No | No | No |

---

# 18. VISUAL-TO-CODE TRACEABILITY RULE

Every implementation task should identify:

```text
CURRENT PHASE:
PRIMARY VISUAL:
SUPPORTING VISUALS:
DOMAIN OWNER:
REPO CONTRACTS:
DATA SOURCE:
PUBLIC/PRIVATE:
VERIFICATION IMPACT:
RELEASE IMPACT:
SECURITY IMPACT:
ACCEPTANCE:
NON-GOALS:
```

This template should be used in implementation planning.

---

# 19. CODE REVIEW PHASE GUARD

A PR should be rejected or re-scoped if it:

- introduces future phase schema without approval;
- creates a second source of truth;
- bypasses verification;
- makes import publish automatically;
- makes published releases mutable;
- gives web runtime operator/owner privilege;
- introduces AI direct DB access;
- treats image sample data as real facts;
- merges LAND with BIKER/TRIP persistence;
- reduces UNKNOWN to defaults.

---

# 20. DEFINITION OF DONE BY LAYER

## UI done

Not just screenshot match.

Must include:

- loading;
- empty;
- error;
- unknown;
- permission;
- responsive;
- accessibility basics.

## API done

Must include:

- validation;
- auth;
- authorization;
- public/private boundary;
- stable error semantics;
- tests.

## Spatial done

Must include:

- CRS;
- source;
- geometry validity;
- lineage;
- accuracy/unknown;
- deterministic test.

## Dataset done

Must include:

- source;
- license;
- processing;
- QA;
- checksum;
- release;
- public delivery if published.

## AI done

Must include:

- explicit tools;
- policy;
- eval;
- audit;
- unknown handling;
- security boundaries.

---

# 21. PHASE TRANSITION RULE

Never declare a phase complete based only on:

- UI generated;
- code merged;
- provider configured;
- local test passed.

A phase transition should have:

- deliverables;
- data readiness;
- security readiness;
- tests;
- operations;
- acceptance evidence;
- documented known limitations.

---

# 22. CURRENT NEXT ACTION

This matrix intentionally stops the new session from jumping to Phase 1.

The required current action is:

```text
CLOSE PHASE 0.5
```

Use:

`05_PHASE_0_5_CLOSEOUT.md`

Only after that gate is complete should the project create a Phase 1 implementation branch/plan.

End of Phase Code Execution Matrix.
