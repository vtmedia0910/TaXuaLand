# TÀ XÙA LAND — READ ME FIRST

Handoff version: 1.0
Snapshot prepared: 2026-09-11
Project: TÀ XÙA LAND
Repository: vtmedia0910/TaXuaLand

---

## 0. PURPOSE OF THIS FILE

This is the first file that any new ChatGPT conversation, Codex session, developer, architect or coding agent must read before touching TÀ XÙA LAND.

Do not begin by redesigning the architecture.

Do not begin by implementing whatever appears visually attractive in the UI boards.

Do not begin Phase 1 until the current Phase 0.5 closeout is explicitly complete.

First understand:

1. what TÀ XÙA LAND is;
2. what has already been built;
3. what is authoritative;
4. what is illustrative;
5. what phase is currently active;
6. what must not be changed accidentally.

The handoff package exists so that a new working session continues the same product rather than starting a new interpretation of it.

---

# 1. PROJECT IDENTITY

## Product name

TÀ XÙA LAND

## Product type

Independent geospatial / spatial-intelligence platform focused first on Tà Xùa, Vietnam.

LAND starts as a high-quality spatial foundation and Digital Twin.

It does NOT start as a real-estate listing website.

The long-term progression is:

Digital Twin
→ Spatial Intelligence
→ Property Registry
→ Property Intelligence
→ Brokerage Platform

The spatial foundation must produce independent user value before Property and Brokerage are introduced.

---

# 2. NORTH STAR

TÀ XÙA LAND should become the best spatial representation and spatial-understanding platform for Tà Xùa.

The product should help a user not merely see a marker, but understand:

- where an object really is;
- what terrain surrounds it;
- elevation;
- slope;
- aspect;
- access;
- road relationships;
- nearby Places;
- view context;
- source provenance;
- freshness;
- verification state;
- later, Property facts and spatial Property Intelligence.

The competitive moat is not primarily the number of listings.

The intended moat is:

SPATIAL DATA
+
3D EXPERIENCE
+
VERIFICATION
+
PROVENANCE
+
DETERMINISTIC ANALYTICS
+
GROUNDED AI EXPLANATION

---

# 3. ECOSYSTEM BOUNDARY

TÀ XÙA LAND is one product in a wider Tà Xùa ecosystem.

Canonical responsibility:

TÀ XÙA LAND
= spatial authority

TÀ XÙA BIKER
= mobility + live/local use cases

TÀ XÙA TRIP
= travel commerce / itinerary / travel workflows

The products may integrate later through narrow, public-safe contracts.

They must NOT be merged into a shared database simply for convenience.

Never share:

- database owner credentials;
- service-role credentials;
- private storage credentials;
- application runtime credentials;
- unrestricted database access.

LAND should eventually provide public-safe geospatial contracts that other ecosystem products can consume.

Do not make LAND responsible for every TRIP or BIKER workflow.

---

# 4. CURRENT WORKING STATE

Repository:

vtmedia0910/TaXuaLand

Current pull request:

PR #2
"Phase 0.5: production deployment hardening"

Current branch:

feat/phase-0-5-production-deployment

Current remote head at this handoff:

fb81e012c59d880a2b4b2e48e035c6cf6332f053

Base branch:

main

Base SHA:

f7080f8a1943d9d86e3c747882b615294a60bd21

PR state at handoff:

OPEN
DRAFT
NOT MERGED
MERGEABLE

Phase 0 repository/local release-candidate work is substantially complete.

Phase 0.5 deployment/provider hardening is the current phase.

PHASE 1 HAS NOT STARTED.

This is a hard boundary.

---

# 5. FIRST RULE FOR THE NEXT SESSION

DO NOT START PHASE 1 IMMEDIATELY.

The next session must first read:

1. this file;
2. 01_CURRENT_REPO_STATE.md;
3. 02_ARCHITECTURE_AND_SEMANTIC_RULES.md;
4. 03_VISUAL_SPEC_CATALOG.md;
5. 04_PHASE_CODE_EXECUTION_MATRIX.md;
6. 05_PHASE_0_5_CLOSEOUT.md;
7. 06_OPEN_DECISIONS_AND_RISKS.md.

Then inspect the current GitHub branch and verify that the SHA has not moved.

If the remote branch has changed since this handoff, the repository wins over this static snapshot for implementation state.

Architecture semantics remain governed by the frozen architecture unless explicitly reopened by the user.

---

# 6. AUTHORITY ORDER

When two sources appear to conflict, use this order.

## Level 1 — Product / domain architecture

Highest semantic authority.

Includes:

- product boundaries;
- spatial truth;
- data ownership;
- provenance;
- verification;
- publication;
- dataset/release semantics;
- security;
- AI boundaries.

## Level 2 — Current repository contracts and ADRs

Implementation authority.

Includes:

- actual domain types;
- DB schema;
- migrations;
- application services;
- API contracts;
- tests;
- security rules;
- ADRs;
- architecture freeze.

Do not change existing working contracts because a generated image depicts a different field name.

## Level 3 — Series 00 Design System

Visual/component authority.

Series 00 controls:

- visual language;
- components;
- status appearance;
- spacing philosophy;
- navigation visual style;
- tables;
- cards;
- forms;
- map control language;
- responsive component identity.

Exact numeric values in an AI-generated image are not necessarily literal implementation tokens.

The real code/design-token files become authority for exact CSS values once implemented.

## Level 4 — Series 02 v2

Global Admin Information Architecture authority.

When another visual board shows a different global admin sidebar, Series 02 wins.

## Level 5 — Domain-specific visual board

Examples:

Series 03
= Spatial Verification workflow authority

Series 04
= Place / POI workflow authority

Series 05
= Excel Import workflow authority

Series 06
= Dataset / Release workflow authority

Series 07
= Operations / Security visual authority

Series 08
= Responsive transformation authority

Series 09
= Property product visual authority

Series 10
= AI product visual authority

## Level 6 — Other visual references

Useful for composition and context, but cannot override architecture or domain contracts.

---

# 7. VISUAL SPECIFICATIONS ARE NOT DATABASE SEEDS

The generated UI boards contain example values.

Examples may include:

- 482 Places;
- 356 Published;
- 1,620 m elevation;
- 83 m road distance;
- sample coordinates;
- example release dates;
- example dataset counts;
- sample user names;
- sample statuses.

These numbers exist to demonstrate UI.

DO NOT hard-code them as production facts.

DO NOT create database records merely because they appear in an image.

DO NOT assume an illustrated Place or Property record is verified real-world truth.

Visuals define:

- hierarchy;
- interaction;
- workflow;
- presentation;
- component expectations;
- semantic separation.

Actual facts come from the authoritative data system.

---

# 8. CANONICAL VISUAL LIBRARY

The project currently has eleven visual specification series:

00 — Design System
01 — Public Map & 3D Experience v2
02 — Admin System Overview v2
03 — Spatial Truth Verification Workspace v2
04 — Place / POI Management
05 — Excel Import & Data QA
06 — Spatial Dataset & Release Management
07 — Operations, Diagnostics & Security
08 — Mobile & Responsive Experience
09 — Property Registry & Property Intelligence
10 — AI Advisor & AI Control Center

Important:

The newly regenerated Series 01, 02 and 03 replace the older versions.

Series 02 v2 is the canonical global Admin IA.

Series 03 v2 is the canonical Spatial Verification workflow, but any conflicting global sidebar shown inside Series 03 must defer to Series 02.

Detailed rules belong in:

03_VISUAL_SPEC_CATALOG.md

---

# 9. CURRENT CODEBASE PRINCIPLE

The repository is not a single giant Next.js application containing all logic.

Current architectural boundary:

apps/web
= Next.js application shell, public web routes and protected admin UI

services/api
= application services and server-side operational logic

packages/*
= domain, spatial, trust, contracts, configuration and shared boundaries

PostgreSQL + PostGIS
= authoritative application/spatial database

GIS pipelines
= reproducible spatial processing

Object storage
= binary/raw/derived/published spatial assets

Cesium
= 3D geospatial client

Do not move important domain logic into React components for convenience.

Do not make Cesium the source of truth.

Cesium renders authoritative spatial data; it does not define that truth.

---

# 10. CURRENT PHASE MODEL

The broad product roadmap is:

## Phase 0 — Spatial Foundation

Foundation and first operational Spatial Content Platform.

This was expanded during implementation into:

### Phase 0A — Spatial Infrastructure

- independent repository;
- Next.js;
- Cesium;
- PostgreSQL/PostGIS;
- CRS strategy;
- terrain proof-of-concept;
- storage;
- security;
- source registry.

### Phase 0B — Spatial Content System

- Place domain;
- category system;
- Admin CRUD;
- coordinate/map picker;
- media;
- provenance;
- verification foundations;
- Draft/Published state.

### Phase 0C — Bulk Data Ingestion

- Excel upload;
- workbook inspection;
- sheet selection;
- column mapping;
- normalization;
- coordinate parsing;
- validation;
- duplicate detection;
- spatial QA;
- map preview;
- staging;
- review;
- explicit commit.

## Phase 0.5 — Production Deployment Hardening

Current phase.

Provider configuration, deployment and external staging acceptance.

## Phase 1 — Tà Xùa 3D

Not started.

Expected focus:

- real regional terrain delivery;
- imagery;
- roads;
- villages;
- Places;
- camera presets;
- search;
- fly-to;
- public 3D experience.

## Phase 2 — Digital Twin / Spatial Intelligence

Future.

Expected:

- higher-value 3D hotspots;
- photogrammetry / 360 where justified;
- elevation;
- slope;
- aspect;
- distance tools;
- viewshed;
- sun/shadow;
- richer road/access relationships.

## Phase 3 — Property Registry

Future.

Expected:

- Property;
- Parcel;
- Listing association;
- Property facts;
- evidence;
- provenance;
- asking-price facts;
- verification.

## Phase 4 — Property Intelligence + AI

Future.

Expected:

- deterministic Property intelligence;
- comparables;
- access analysis;
- terrain analysis;
- view analysis;
- spatial search;
- grounded AI Advisor;
- AI Control Center.

## Phase 5 — Brokerage

Future and gated by legal/compliance review.

Possible:

- lead;
- appointment;
- agent;
- offer;
- document workflow.

Do not implement future-phase features merely because they appear as previews in visual boards.

---

# 11. ARCHITECTURE FREEZE

Phase 0 architecture is considered frozen.

This does NOT mean the code can never evolve.

It means architecture-level changes must be deliberate.

Do not casually change:

- database ownership model;
- repo boundaries;
- source/provenance model;
- verification semantics;
- publication semantics;
- storage separation;
- environment separation;
- public/private data boundary;
- AI security boundary;
- LAND/BIKER/TRIP boundary.

If a future requirement genuinely requires an architectural change:

1. identify the conflict;
2. inspect existing ADRs;
3. propose a new ADR;
4. explain migration impact;
5. obtain explicit approval before implementation.

---

# 12. NON-NEGOTIABLE SEMANTIC RULES

These rules should remain mentally loaded throughout all future work.

LAND ≠ generic website.

LAND ≠ tourism CMS.

LAND ≠ WordPress database.

LAND ≠ real-estate listing portal.

LAND ≠ Google Maps clone.

Spatial data is first-class.

Source is first-class.

Provenance is first-class.

Freshness is first-class.

Verification is first-class.

Unknown is first-class.

History is first-class.

Declared ≠ Verified.

Observed ≠ Verified.

Source Authority ≠ Verification.

Published ≠ Verified.

Imported ≠ Published.

Import Commit ≠ Publish.

Dataset ≠ Release.

Release Candidate ≠ Published Release.

Published Release = immutable.

Property ≠ Parcel.

Property ≠ Listing.

Seller Claim ≠ LAND Verified Fact.

Asking Price ≠ Market Value.

Spatial Analysis ≠ Legal Opinion.

Road Mapping ≠ Road Safety.

Straight-Line Distance ≠ Network Distance.

Terrain Aspect ≠ View Direction.

Viewshed ≠ Guaranteed Real-World View.

AI ≠ Spatial Authority.

AI ≠ Database Owner.

AI ≠ Verifier.

AI ≠ Publisher.

AI ≠ Legal Authority.

AI ≠ Property Valuer.

---

# 13. UNKNOWN MUST REMAIN UNKNOWN

Never manufacture a default fact just so the UI looks complete.

Examples:

Unknown road access
≠ 0 m

Unknown planning status
≠ no planning restriction

Unknown ownership
≠ clean ownership

No elevation result
≠ 0 m

No comparable
≠ zero value

Missing verification
≠ false

No field observation
≠ bad access

The UI must be able to show:

UNKNOWN

NOT AVAILABLE

NOT RUN

REVIEW REQUIRED

STALE / EXPIRED

without forcing a fake conclusion.

---

# 14. HUMAN AUTHORITY

LAND may automate:

- validation;
- spatial calculations;
- duplicate detection;
- anomaly detection;
- topology checks;
- distance calculations;
- terrain calculations;
- source/freshness checks;
- QA warnings.

But automated checks do not automatically become spatial truth.

AI and deterministic checks may:

FLAG
EXPLAIN
SUMMARIZE
SUGGEST REVIEW

They must not automatically:

MOVE AUTHORITATIVE GEOMETRY
VERIFY A PLACE
VERIFY A PARCEL
PUBLISH A RELEASE
ASSERT OWNERSHIP
ASSERT CLEAN LEGAL STATUS

Human-authorized workflows remain required where architecture defines them.

---

# 15. SECURITY MINDSET

No secrets in:

- visual specs;
- handoff documents;
- public client;
- logs;
- screenshots;
- audit event payloads;
- AI prompts;
- public DTOs.

Never paste or commit:

- database passwords;
- R2 secret access keys;
- provider API tokens;
- admin passwords;
- service-role keys;
- signed URLs that grant private access.

Configuration UIs display:

CONFIGURED
MISSING

not secret values.

---

# 16. PROVIDER CREDENTIAL SEPARATION

A particularly important Phase 0.5 rule:

WEB RUNTIME
must use least privilege.

The web runtime may have:

- application database runtime role;
- private upload/object-store runtime credential;
- public asset base URL.

The web runtime must NOT contain:

- database owner credentials;
- published-release operator credential;
- provider master credentials.

The publication operator is a separate authority.

PRIVATE STORAGE RUNTIME CREDENTIAL
≠
PUBLISHED RELEASE OPERATOR CREDENTIAL

This rule must survive all future deployment refactors.

---

# 17. DATA FIRST, VISUALS SECOND

When building UI from the visual library:

First ask:

What is the authoritative entity?

What state is authoritative?

What source produced this value?

What verification state applies?

Is this field public?

Is it current?

Is it computed?

Is it observed?

Is it declared?

Then render it.

Do not start from:

"What cards are in the screenshot?"

and work backward into a data model.

The domain model must lead the UI.

---

# 18. CURRENT NEXT STEP

At the time this handoff was prepared:

Phase 0.5 is not fully closed.

The immediate next task is not Phase 1 terrain/product expansion.

The next task is:

complete Phase 0.5 provider acceptance and closeout.

Read:

05_PHASE_0_5_CLOSEOUT.md

before performing any new implementation.

---

# 19. HOW A NEW SESSION SHOULD BEGIN

After reading this handoff pack, the new session should:

1. inspect PR #2;
2. verify current branch and SHA;
3. inspect README.md;
4. inspect ARCHITECTURE.md;
5. inspect AGENTS.md;
6. inspect docs/PHASE_0_SPATIAL_FOUNDATION.md;
7. inspect docs/operations/implementation-status.md;
8. inspect the Phase 0 architecture-freeze document;
9. inspect the current Phase 0.5 operations documents;
10. compare repository reality with this handoff snapshot.

Then report:

- understanding of LAND;
- current repository status;
- unresolved Phase 0.5 items;
- proposed next action.

Do not modify source before that review is acknowledged.

---

# 20. FINAL TRANSFER RULE

This handoff is intended to prevent context loss, not replace the repository.

If this file and the current repository disagree about implementation details because the repository advanced after the handoff date:

CURRENT REPOSITORY
wins for implementation state.

If a generated visual and architecture semantics disagree:

ARCHITECTURE
wins.

If visual boards disagree about global Admin navigation:

SERIES 02 v2
wins.

If an AI-generated screen implies a capability forbidden by security architecture:

SECURITY ARCHITECTURE
wins.

---

TÀ XÙA LAND

SPATIAL TRUTH FIRST.

BUILD THE DIGITAL TWIN FIRST.

PROPERTY AND AI COME ON TOP OF A TRUSTED SPATIAL FOUNDATION.