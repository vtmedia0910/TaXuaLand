# TÀ XÙA LAND — PROJECT CONTEXT

Status: Stable project/domain context
Purpose: Compact, durable context for ChatGPT, Codex, developers, and coding agents
Repository: `vtmedia0910/TaXuaLand`

> This file is intentionally stable.
> Do not use it as the source of truth for the current branch, PR, deployment state, or active blocker.
> Mutable operational state belongs in `docs/status/CURRENT.md`.

---

## 1. Product identity

TÀ XÙA LAND is an independent geospatial / spatial-intelligence platform focused first on Tà Xùa, Vietnam.

It is not primarily a tourism CMS, booking website, generic map wrapper, real-estate listing portal, AI-first database, or brokerage CRM.

Long-term progression:

```text
Digital Twin
→ Spatial Intelligence
→ Property Registry
→ Property Intelligence
→ Brokerage
```

The spatial foundation must create independent user value before Property, AI, or Brokerage is expanded.

The intended moat is:

```text
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
```

---

## 2. Ecosystem boundary

Canonical product responsibilities:

```text
TÀ XÙA LAND
= spatial authority

TÀ XÙA BIKER
= mobility + live/local use cases

TÀ XÙA TRIP
= travel commerce + itinerary workflows
```

These products remain separate systems of record.

Do not merge their databases for convenience, share database-owner/service-role/private-storage credentials, or allow unrestricted cross-product database access.

When integration is required, use narrow DTOs, public-safe APIs, explicit contracts, and separate credentials.

LAND may become the shared geospatial authority without becoming the business-system authority for BIKER or TRIP.

---

## 3. Core architecture

```text
apps/web
= Next.js public application + protected Admin UI + Cesium browser integration

services/api
= application services + server-side workflows + provider/storage adapters

packages/*
= domain + spatial + trust + contracts + configuration + shared boundaries

PostgreSQL + PostGIS
= authoritative application/spatial datastore

GIS pipelines
= reproducible spatial processing

Object storage
= raw/private/derived/published binary spatial artifacts

CesiumJS
= primary 3D geospatial client
```

Routes should adapt HTTP to application services.

Do not move core domain decisions into React components or route handlers merely for convenience.

Cesium renders spatial truth; it does not define spatial truth.

Object storage stores artifacts; it does not replace PostGIS as domain authority.

---

## 4. 3D and spatial rendering boundary

CesiumJS is the primary 3D map client.

Cesium 3D Tiles is the preferred direction for high-volume / high-detail streamed 3D spatial assets.

Changing the core 3D engine or terrain / 3D Tiles strategy is an architecture-level decision and requires an approved ADR before implementation.

3D presentation must never imply more accuracy or certainty than the underlying source supports.

When data quality is insufficient:

```text
accurate low-detail / UNKNOWN
>
beautiful but unsupported 3D
```

Prefer progressive LOD:

```text
lightweight regional context
→ progressively richer detail
→ high-detail hotspots only where justified
```

Mobile may use a lower-cost visual profile, but semantic facts and verification meaning must remain identical.

---

## 5. Authoritative spatial semantics

PostgreSQL + PostGIS is authoritative for application and spatial truth.

It should own or query domain geometries, Places, spatial relationships, geometry history, AOI, road spatial representations, source references, verification state, release metadata, and future Property spatial relationships.

Canonical application interchange geometry:

```text
EPSG:4326
```

Coordinate ordering must be explicit:

```text
longitude, latitude
```

Never assume geographic degrees are meters.

Metric work may use PostGIS geography or an appropriate projected CRS according to the existing repository contract.

Vertical reference / datum must remain explicit where relevant.

Many decimal places do not establish real-world accuracy. Accuracy, uncertainty, source, method, and freshness should remain explicit where known.

---

## 6. Spatial truth model

These concepts must not collapse into one generic status:

```text
DECLARED
!=
OBSERVED
!=
VERIFIED
```

Declared = a claim supplied by a source or actor.

Observed = evidence, field observation, measurement, or captured observation.

Verified = an authorized verification result.

Observed does not automatically become Verified.

External map data does not automatically become Verified.

Spatial corrections should follow candidate/review/audit semantics rather than silently overwriting authoritative geometry.

Geometry history must preserve the repository's append-only/history invariants.

---

## 7. Source, provenance, freshness, and trust

Source and provenance are first-class product data.

Important spatial facts and layers should be traceable, where applicable, to source/provider, rights/license, timestamp, freshness, verification, CRS, accuracy/uncertainty, version, public/private classification, processing lineage, and release lineage.

Source authority and verification are separate dimensions.

Valid combinations may include:

```text
OFFICIAL + REVIEW_REQUIRED
LAND_OBSERVED + VERIFIED
PARTNER + DECLARED
SELLER + DECLARED
THIRD_PARTY + UNKNOWN
```

Do not simplify the UI or schema by merging these dimensions.

---

## 8. Publication and release semantics

Mandatory distinctions:

```text
Imported != Published
Import Commit != Publish
Dataset != Release
Release Candidate != Published Release
Published != Verified
Published Release = immutable
```

Intended release chain:

```text
Source
→ Raw
→ Normalized
→ Derived
→ QA
→ Release Candidate
→ Published Release
→ Public Delivery
```

A successful upload, local QA run, provider delivery, or Cesium render does not by itself authorize publication.

Publication requires the applicable source authority, rights/license, metadata, QA, release registration, immutable artifact handling, and public-delivery validation.

Published release bytes should not be mutated in place. Create a successor release instead.

---

## 9. Import semantics

Excel is an ingestion interface, not the database schema.

Canonical workflow:

```text
Upload
→ Inspect
→ Map
→ Validate
→ Stage
→ Review
→ Commit
```

Import commit must not automatically verify a Place, publish a Place, publish a dataset release, or overwrite authoritative geometry without the required review path.

Untrusted workbook processing must preserve isolation, validation, auditability, and explicit review semantics.

---

## 10. Security boundaries

Secrets remain server-side.

The web runtime must use least-privilege application credentials.

Do not expose or commit database-owner credentials, service-role credentials, provider master credentials, private object-store secrets, publication operator credentials, bootstrap credentials, signed private upload URLs, or production secrets.

The private runtime-storage credential and published-release operator credential must remain separate.

Admin authentication does not imply database-owner authority.

Public APIs and public AI must use public-safe projections.

Raw private evidence, private workbook rows, credentials, and PII must not leak into public output.

Provider endpoints must be allow-listed/configured; untrusted user input must not create arbitrary provider access.

---

## 11. Deterministic analytics and AI boundary

Spatial analytics should be deterministic and traceable to explicit inputs and versions.

Important distinctions:

```text
Straight Distance != Network Distance
Road Mapping != Road Safety
Aspect != View
Viewshed != Guaranteed Real-World View
Unknown != Zero
```

Future AI may retrieve, explain, compare, and orchestrate through explicit typed tools.

AI must not become spatial authority.

AI must not, by default, verify records, publish records/releases, move authoritative geometry, invent legal certainty or valuation facts, read secrets, or execute arbitrary SQL/RPC/HTTP/browser/shell operations.

AI tool authority must remain explicitly bounded and auditable.

---

## 12. Place, Property, Parcel, and Listing semantics

A Place is a spatial/domain object and must preserve identity, geometry, source, provenance, verification, publication state, history, and public/private boundaries.

Future Property work must retain:

```text
Property != Parcel
Property != Listing
Seller Claim != LAND Verified Fact
Asking Price != Market Value
```

A digitized or seller-supplied parcel must not be presented as a legal cadastral boundary unless authoritative legal evidence exists.

Unknown legal/planning facts remain UNKNOWN.

---

## 13. Visual specification authority

The project uses the TÀ XÙA LAND Visual Specification Library, Series 00–10.

Authority order when sources conflict:

```text
1. Product/domain architecture and frozen semantic rules
2. Current repository contracts, ADRs, migrations, and tests
3. Series 00 Design System
4. Series 02 v2 for global Admin information architecture
5. Relevant domain-specific visual board
6. Supporting visual boards
7. Sample text/counts/dates/coordinates shown inside generated images
```

Generated visual boards are visual/workflow specifications, not database truth.

Do not seed production facts from sample numbers, names, coordinates, dates, or statuses shown in an image.

Canonical visual roles:

```text
Series 00
Design System / visual language / components / status semantics

Series 01 v2
Public Map & 3D Experience

Series 02 v2
Global Admin Information Architecture

Series 03 v2
Spatial Truth Verification workflow

Series 04
Place / POI Management

Series 05
Excel Import & Data QA

Series 06
Spatial Dataset & Release Management

Series 07
Operations / Diagnostics / Security

Series 08
Mobile & Responsive Experience

Series 09
Future Property Registry / Property Intelligence

Series 10
Future AI Advisor / AI Control Center
```

If Series 03 navigation conflicts with Series 02:

```text
GLOBAL ADMIN SIDEBAR
→ Series 02 v2

VERIFICATION WORKSPACE
→ Series 03 v2
```

---

## 14. Product phase model

### Phase 0 — Spatial Foundation

Established platform foundation including repository/application boundaries, PostGIS, source/provenance, Place, verification foundations, Admin, Excel ingestion, dataset/release concepts, Cesium foundation, spatial pipelines, security, and operational acceptance.

### Phase 0.5 — Production Deployment Hardening

External provider/deployment hardening and evidence closure.

Current operational status must be read from:

```text
docs/status/CURRENT.md
```

not inferred from this file.

### Phase 1 — Tà Xùa 3D

Expected scope after explicit authorization:

- real regional terrain delivery;
- imagery;
- roads;
- villages/geographic context where data exists;
- published Places;
- search;
- select/fly-to;
- source/verification presentation;
- responsive public 3D experience.

Primary visual:

```text
01-public-map-3d-experience-v2.png
```

Phase 1 extends the accepted spatial foundation rather than redesigning it.

### Phase 2 — Digital Twin / Spatial Intelligence

Future: richer 3D hotspots, elevation/slope/aspect, access/distance, terrain inspection, viewshed, sun/shadow, richer spatial verification.

### Phase 3 — Property Registry

Future: Property, Parcel, Listing associations, Property facts, evidence, provenance, verification.

### Phase 4 — Property Intelligence + AI

Future: deterministic Property intelligence, comparables, terrain/access/view analysis, grounded AI Advisor, AI Control Center.

### Phase 5 — Brokerage

Future and separately gated by legal/compliance review.

---

## 15. Architecture freeze

The accepted Phase 0 architecture is frozen unless explicitly reopened.

Do not casually change product/database ownership, LAND/BIKER/TRIP boundaries, repository/domain boundaries, CRS strategy, source/provenance semantics, verification semantics, geometry-history semantics, publication/release lifecycle, public/private data boundaries, provider/secrets boundaries, AI tool authority, core 3D engine, or terrain / 3D Tiles strategy.

Architecture-level changes require:

```text
identify conflict
→ inspect current ADRs/contracts
→ propose ADR
→ document alternatives
→ document migration impact
→ document data compatibility
→ document security/trust impact
→ document rollback
→ document tests
→ obtain explicit owner approval
→ only then implement
```

Bug fixes, security fixes, dependency compatibility fixes, performance fixes, test/observability improvements, deployment hardening, documentation corrections, and small internal refactors are allowed when they preserve frozen invariants.

---

## 16. Agent working context

This file answers:

```text
What is TÀ XÙA LAND?
What truths and boundaries must remain stable?
```

It does not answer:

```text
What branch are we on?
What is the current PR?
What is the current blocker?
What was verified today?
What should Codex do next?
```

For workflow and skill/plugin orchestration, read:

```text
AGENTS.md
docs/agents/SKILL_ROUTING.md
docs/agents/SPATIAL_3D_WORKFLOW.md
```

For current state, read:

```text
docs/status/CURRENT.md
```

For durable architectural decisions, read:

```text
docs/adr/
docs/operations/phase-0-architecture-freeze.md
```

For deeper project semantics, use:

```text
docs/PHASE_0_SPATIAL_FOUNDATION.md
the archived 2026-09-11 handoff package
```

---

## 17. Final working mantra

```text
SOURCE
→ PROVENANCE
→ SPATIAL DATA
→ VERIFICATION
→ VERSIONED RELEASE
→ DETERMINISTIC ANALYSIS
→ PUBLIC / ADMIN EXPERIENCE
→ PROPERTY INTELLIGENCE
→ GROUNDED AI
```

Do not work backward from a screenshot or AI guess into the database.

**TÀ XÙA LAND: spatial truth first.**
