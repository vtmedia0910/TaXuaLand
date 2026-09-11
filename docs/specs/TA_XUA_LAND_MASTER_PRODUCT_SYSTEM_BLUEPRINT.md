# TÀ XÙA LAND — MASTER PRODUCT SYSTEM BLUEPRINT

Status: Canonical product-system blueprint — implementation-reconciled draft
Version: 1.1
Snapshot basis: 2026-09-11 handoff + approved Phase 1 specification + Visual Specification Library Series 00–10 + current repository/deployed UI review
Repository: `vtmedia0910/TaXuaLand`
Reviewed implementation baseline: `97d5e6ebc39ee72f3ea6b8a76f441629e96f1fbc`
Intended path: `docs/specs/TA_XUA_LAND_MASTER_PRODUCT_SYSTEM_BLUEPRINT.md`

> This document translates the TÀ XÙA LAND visual boards into a product-system model: capability, screen, actor, data, state, authority, workflow, permission, service boundary, phase, and acceptance.
>
> It does **not** override approved architecture, ADRs, current repository contracts, migrations, tests, or explicit owner decisions.

---

# 0. HOW TO USE THIS DOCUMENT

Before coding:

```text
confirm current main / phase / active slice
→ inspect repository contracts and actual current routes/components
→ classify implementation maturity (foundation vs visual completion)
→ identify capability
→ identify canonical visual authority
→ identify data/state/source-of-truth
→ identify permission
→ identify dependencies
→ implement only in-scope behavior
→ test semantics
→ render at the reference viewport(s)
→ compare browser output with the canonical board
→ record functional + visual + data/provider evidence separately
```

Use this blueprint for product planning, visual interpretation, API/service boundaries, state transitions, permissions, tests, acceptance, and future phase specifications.

For UI work, **functional correctness is necessary but not sufficient**. A route or workflow may be functionally present while still being visually non-canonical.

---

# 1. AUTHORITY HIERARCHY

```text
1. Explicit owner instruction
2. Approved architecture / frozen semantics / ADRs
3. Current repository contracts / migrations / tests
4. Approved current phase specification
5. Series 00 Design System
6. Series 02 v2 for global Admin IA
7. Domain-specific visual board
8. Supporting visual boards
9. Example values in generated images
10. Generic best practice
```

Visual boards are strong authority for hierarchy, composition, workflow, interaction intent, responsive transformation, visual state distinction, and the intended visual character of the product. They are weak authority for exact schema, enum spelling, real-world facts, legal conclusions, implementation status, and factual values shown inside generated images.

## 1.1 Reference-fidelity contract

The owner requires the shipped interface to converge closely to the approved Series 00–10 boards rather than treating them as loose inspiration. For presentation work, the canonical board is the visual acceptance target unless a higher authority requires a deviation.

High-fidelity implementation should preserve, as applicable:

```text
page composition and hierarchy
map-to-panel proportions
visual density
typography hierarchy and tone
palette / contrast / surface treatment
spacing rhythm and alignment
component shapes, radii, borders and shadows
control grouping and placement
iconography style and emphasis
selected / hover / focus / loading / empty / error states
desktop → tablet → mobile transformation
```

Current CSS or component styling is **not** automatically a visual authority merely because it already exists. Existing presentation code that is generic, placeholder-like, or visibly inconsistent with the canonical boards may be refactored while preserving domain, security, routing, accessibility, and architecture contracts.

If exact approved design tokens exist, reuse them. If current numeric tokens are merely implementation defaults and conflict materially with the canonical visual language, converge the tokens/components toward Series 00 rather than copying the placeholder forward.

A visual task is not accepted from code inspection alone. At the canonical reference viewport, capture observed browser output and compare it side-by-side with the relevant board. Browser/font/WebGL differences may prevent mathematical pixel identity, but unexplained differences in composition, hierarchy, visual density, component treatment, or overall vibe are defects.

Never obtain visual fidelity by inventing factual data, fake verification, fake publication, fake health, or unavailable features. Preserve the composition with honest empty/disabled/degraded states instead.

## 1.2 Implementation-maturity vocabulary

Use these labels explicitly so `PASS` does not falsely mean “finished visually”:

```text
ARCHITECTURE / CONTRACT READY
= authority, domain semantics and interfaces exist

FUNCTIONALLY PRESENT
= route/service/interaction works

VISUALLY CONVERGED
= observed UI closely matches the canonical visual board

BROWSER VERIFIED
= the intended state was actually observed in the browser

DATA READY
= exact governed data/release is approved for the feature

PROVIDER READY
= external runtime/delivery path is verified

ACCURACY VERIFIED
= factual/spatial accuracy claim has suitable evidence
```

These labels are independent. For example, Phase 0 may establish a FUNCTIONALLY PRESENT map shell while Phase 1 still owns VISUAL CONVERGENCE of the public 3D experience.

---

# 2. PRODUCT IDENTITY

```text
LAND  = spatial authority
BIKER = mobility / live-local authority
TRIP  = travel commerce / itinerary authority
```

Long-term progression:

```text
Spatial Foundation
→ Tà Xùa 3D
→ Digital Twin / Spatial Intelligence
→ Property Registry
→ Property Intelligence
→ Brokerage
```

Do not merge product databases or share privileged database/service-role/private-storage authority across products without explicit approved architecture.

---

# 3. CORE SYSTEM CHAIN

```text
SOURCE
→ PROVENANCE
→ INGESTION / REGISTRATION
→ NORMALIZATION
→ VALIDATION
→ REVIEW
→ DOMAIN STATE
├──→ VERIFICATION / TRUST LIFECYCLE
│     (independent; may remain UNKNOWN and may change over time)
└──→ PUBLICATION / VERSIONED RELEASE
      (independent source, eligibility and public-safety gates)
      → PUBLIC-SAFE CONTRACT
      → 3D / ADMIN EXPERIENCE
      → DETERMINISTIC INTELLIGENCE
      → GROUNDED AI EXPLANATION
```

No later layer may silently redefine authority from an earlier layer.

---

# 4. NON-NEGOTIABLE SEMANTICS

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
Seller Claim != Verified Fact
Asking Price != Market Value
Straight Distance != Network Distance
Road Mapping != Road Safety
Aspect != View
Viewshed != Guaranteed Real-World View
AI != Spatial Authority
```

---

# 5. PRIMARY ACTORS

## Public Visitor
Browses public map, searches published Places, views approved public-safe facts, terrain/layers, source/verification summaries, and future read-only AI explanations. No mutation authority.

## Content Editor
Creates/edits Place drafts, content/media metadata, and candidate corrections. Editing does not imply verification or publication authority.

## Spatial Reviewer
Inspects candidates/evidence, compares Declared / Observed / Verified, and records verification decisions.

## Publisher / Content Approver
Controls publication according to repository policy. Publication remains separate from verification.

## Dataset / Release Operator
Manages datasets, QA, release candidates, immutable publication, and release lineage. Operator credentials remain outside normal web runtime.

## System Administrator
Manages users, roles, access, settings, and operational visibility. Admin does not imply DB-owner/provider-master authority.

## Operations / Provider Operator
Handles deployment, runtime configuration, provider diagnostics, storage lifecycle, delivery verification, and operational acceptance.

## Future AI User
Uses AI as retrieval/explanation unless later architecture grants narrowly typed actions.

---

# 6. TOP-LEVEL CAPABILITY ARCHITECTURE

```text
TÀ XÙA LAND
├── PUBLIC SPATIAL EXPERIENCE
│   ├── Regional 3D Map
│   ├── Search / Explore
│   ├── Place Discovery
│   ├── Layers / Terrain / Access
│   ├── Source / Verification
│   └── Responsive / Degraded Experience
├── ADMIN COMMAND CENTER
│   ├── Spatial Overview
│   ├── Attention / Review
│   ├── Data Quality
│   ├── System Health
│   └── Recent Activity
├── PLACE / POI
│   ├── Registry / Content / Geometry
│   ├── Media / Source
│   ├── Verification / Publication
│   └── History
├── BULK INGESTION / DATA QA
│   ├── Upload / Inspect / Map
│   ├── Validate / Stage / Review
│   └── Commit
├── SPATIAL TRUTH / VERIFICATION
│   ├── Queue / Candidate / Evidence
│   ├── Deterministic Checks
│   ├── Human Decision
│   └── Expiry / Audit
├── SOURCE / PROVENANCE
├── DATASET / RELEASE
├── OPERATIONS / SECURITY
├── RESPONSIVE SYSTEM
├── FUTURE PROPERTY
└── FUTURE AI
```

---

# 7. VISUAL BOARD OWNERSHIP

```text
00 — Design System → global visual/component language
01 v2 — Public Map & 3D → public spatial UX
02 v2 — Admin Overview → global Admin IA
03 v2 — Spatial Truth Verification → verification workflow
04 — Place / POI → Place workflow
05 — Excel Import / QA → bulk ingestion workflow
06 — Dataset / Release → dataset/release lifecycle
07 — Operations / Diagnostics / Security → operational UX
08 — Mobile / Responsive → responsive transformation
09 — Property Registry / Intelligence → future Property UX
10 — AI Advisor / Control Center → future grounded-AI UX
```

If another Admin board conflicts with Series 02 on global navigation, Series 02 wins.

## 7.1 Current implementation reality — reviewed 2026-09-11

The current repository is a strong functional/authority baseline, but it must not be mistaken for the final visual target. At reviewed main `97d5e6ebc39ee72f3ea6b8a76f441629e96f1fbc`:

- Phase 0 and Phase 0.5 foundations are closed; Phase 1 specification is approved and merged, so Phase 1 implementation is authorized.
- `/` is a minimal landing page, not a canonical final homepage.
- `/map` is the Phase 0 engineering/public explorer shell. It currently uses a conventional header + intro block + boxed viewer composition and may show a neutral grid when no eligible published terrain release is resolved. Functional honesty here does **not** mean visual completion.
- `apps/web/app/globals.css` is a generic dark implementation baseline (including generic typography and simple cards/forms). It is not evidence that Series 00 visual convergence is complete.
- Current Admin routes visibly implemented in the reviewed tree are `/admin`, `/admin/places`, `/admin/imports`, `/admin/sources`, `/admin/datasets`, `/admin/diagnostics`, plus `/admin/login`. Series 02 remains the target Admin IA; concepts shown on the board must not be claimed as implemented merely because they appear in the visual.
- Existing domain/service/security behavior should be preserved while the presentation layer is progressively converged to the boards.

### Admin identity boundary

LAND Admin authentication is application-owned and database-backed:

```text
/admin/login
→ /api/auth/login
→ LAND admin_users / admin_user_roles / admin_sessions
→ scrypt password verification
```

It is **not Supabase Auth (`auth.users`)**. Supabase is currently the managed PostgreSQL/PostGIS provider for the deployed LAND database; a user created only in Supabase Auth is not automatically a LAND Admin.

Local Docker/PostGIS and the managed Supabase LAND database are separate environments. A locally bootstrapped `admin_users` row does not create a cloud/deployed Admin, and vice versa. Vercel authenticates against the LAND database selected by its runtime `DATABASE_URL`.

Future UI/auth work must not silently replace this identity boundary with Supabase Auth without an approved architecture change.

---

# 8. PUBLIC EXPERIENCE — SERIES 01 v2

## Main Tà Xùa 3D Map
Purpose: regional spatial understanding, terrain context, public Places, map-first discovery.

Visual product rule:

```text
PUBLIC MAP = MAP FIRST
```

At desktop reference view, the spatial canvas should read as the primary product surface. Search, navigation, layer controls, selected Place context, and status should be integrated around/over the map composition rather than turning `/map` into a generic content page with a large marketing intro above a boxed viewer.

When data is unavailable, retain the canonical spatial composition and show an honest unavailable/degraded state. Do not collapse to a blank page or fabricate terrain/imagery merely to resemble the board.

Authority:
```text
PostGIS / approved release = authoritative
Cesium = representation
```

## Regional Overview
First camera state, orientation, home/reset, presets, fly-to.

## Place Markers
Render published public-safe Place geometry. Marker visuals may encode category, selection, clustering, and trust summary.

## Marker Clustering
Presentation/performance only; never merges domain entities.

## Global Search
```text
query → public search → result → select → fly-to → card/drawer
```
No draft/private leakage.

## Explore List + Map
List and map share the same public-safe facts and synchronized selection.

## Selected Place Card
Compact identity, category, media, source/verification summary, access context.

## Place Detail Drawer
Deep Place information while preserving map context.

## Layer Management
Approved terrain, imagery, roads/context, Places, future deterministic layers. No arbitrary user-selected provider endpoint.

## Imagery / Data Comparison
Deferred by the approved Phase 1 specification to Phase 2 unless a later owner-approved amendment explicitly brings it forward. Comparison itself does not create verification.

## Access / Route Context
Phase 1 may show bounded, non-analytical road/access context already supported by approved LAND facts. Route/network analysis is deferred to Phase 2.

```text
Road Mapping != Road Safety
Straight Distance != Network Distance
```
LAND does not silently become TRIP routing commerce.

## Elevation Profile
Deferred by the approved Phase 1 specification to Phase 2. When implemented later, it must declare source, release, vertical assumptions, sampling policy, and limitations.

## Terrain Inspector
Deferred by the approved Phase 1 specification to Phase 2. Phase 1 may present terrain release/source metadata, but not a point/area analytical inspector.

## Slope Layer
Primarily Phase 2 deterministic intelligence.

## Source / Verification Explanation
Supports states such as Published+Verified, Published+Declared, Published+Unknown. Published must not imply Verified.

## Nearby Places
Advanced nearby analysis is deferred to Phase 2. Phase 1 remains centered on published Place search, selection, and map context unless the approved Phase 1 spec is amended.

## Place Comparison
Deferred to Phase 2. When introduced, compare approved fields without collapsing source/verification differences.

## Share / Focus State
Deep-link selected map state without leaking private/admin identifiers.

## WebGL / Degraded State
Preserve useful non-3D information when 3D fails. Do not fabricate missing terrain/layers.

---

# 9. GLOBAL ADMIN — SERIES 02 v2

Global conceptual sections:

```text
Tổng quan
Địa điểm
Excel import
Xác minh không gian
Nguồn dữ liệu
Dataset & release
Media
Người dùng
Nhật ký
Chẩn đoán
Cài đặt
```

Future: Property, AI Control Center.

## Admin Command Center
```text
Spatial Map
+ Attention / Review Queue
+ Data Quality
+ System Health
+ Recent Activity
```
Not a generic marketing analytics dashboard.

## Admin Spatial Map
Spatial operational context; not a separate source of truth.

## Unified Review Center
Consolidates Place review, verification, import anomalies, dataset QA, expiry/stale evidence, and future Property conflicts, then routes into domain-specific workflows.

## Global LAND Search
Typed search across Place, Dataset, Release, Import Batch, Verification Task, and future Property.

## Admin implementation rule

Series 02 defines the canonical Admin information architecture and visual target, but current route existence must be checked before coding. Do not render a board item as if it were operational unless the corresponding route/service/permission exists or the active phase explicitly authorizes implementing it.

Authentication UI must use the existing LAND application identity boundary (`admin_users` + LAND sessions) unless an approved ADR changes that architecture. Do not wire the login screen to Supabase Auth merely because the managed database is hosted by Supabase.

---

# 10. PLACE / POI — SERIES 04

Place conceptually contains:

```text
identity
geometry
category
content
source
verification
publication
access context
media
history
```

## Place List
Search/filter/status overview and entry point to detail/edit/review.

## Place Detail
Keeps identity/content, geometry, source, verification, publication, media, access and history distinct.

## Create/Edit
Must distinguish:
```text
content mutation
candidate geometry
verification decision
publication decision
```

## Geometry
Map editing may create candidate geometry; never silently overwrite verified geometry.

## Media
Governed metadata and public visibility rules.

## Access Context
Approved access facts only; no unsupported safety certification.

## History
Trace authoritative changes, especially geometry.

## Publication
Controls public availability independently from verification.

---

# 11. EXCEL IMPORT / DATA QA — SERIES 05

Canonical workflow:

```text
UPLOAD → INSPECT → MAP → VALIDATE → STAGE → REVIEW → COMMIT
```

## Upload
Workbook is untrusted. Enforce size/type/private handling.

## Inspect
Workbook metadata, sheets, hidden/macro/formula/account-like content according to policy.

## Map
Source columns → canonical domain fields. Excel does not define DB schema.

## Normalize
Explicit normalized interpretation while retaining source evidence.

## Validate
Required fields, types, category, source, coordinates, AOI, duplicate signals, domain constraints.

## Spatial QA
Map preview, invalid markers, duplicate proximity, coordinate review.

## Stage
```text
STAGING != PLACE
```

## Review
Review intended CREATE / UPDATE / SKIP and warnings/provenance.

## Commit
Explicit, atomic, provenance-preserving, idempotent where required.

```text
COMMIT != VERIFIED
COMMIT != PUBLISHED
```

---

# 12. SPATIAL TRUTH / VERIFICATION — SERIES 03 v2

Core model:

```text
DECLARED != OBSERVED != VERIFIED
```

## Declared
Claimed information.

## Observed
Evidence/observation at a time.

## Candidate
Proposed correction or authoritative state. Remains separate from current verified state.

## Verified
Authorized verification outcome.

## Verification Queue
New candidates, conflicts, stale evidence, suspicious coordinates, expiry, deterministic anomalies.

## Verification Map
Compare source/current/candidate geometry without silent mutation.

## Comparison
Declared / Observed / Verified side-by-side.

## Evidence
Source metadata, observation, media, external references, dataset/release links, deterministic checks.

## Deterministic Checks
Assist review; do not Verify.

## Human Decision
Accept, reject, request more evidence, or leave unresolved. Preserve history/audit.

## Expiry / Re-review
Stale/expired does not equal false.

## Domain-Specific Verification
An object can simultaneously be:

```text
Location: VERIFIED
Road Access: REVIEW_REQUIRED
Viewpoint: OBSERVED
Safety: UNKNOWN
Publication: PUBLISHED
```

Avoid one broad “Verified object” badge.

---

# 13. SOURCE / PROVENANCE

Conceptual properties:

```text
source identity
authority type
rights/license
capture/publication date
freshness
source artifact
external reference
normalization history
```

```text
Source Authority != Verification
```

Official source may still require review. Seller source can be stored without becoming Verified truth.

---

# 14. DATASET / RELEASE — SERIES 06

Canonical lifecycle:

```text
SOURCE
→ RAW
→ NORMALIZED
→ DERIVED
→ QA
→ RELEASE CANDIDATE
→ PUBLISHED RELEASE
→ PUBLIC DELIVERY
```

## Dataset
Logical governed collection: terrain, imagery, roads, future 3D Tiles, derived layers.

## Raw
Preserved source artifact.

## Normalized
Standardized processing input.

## Derived
Output from explicit input + processing version.

## QA
Integrity, coverage, CRS, seams, metadata, visual comparison, reproducibility. QA does not prove legal rights or field accuracy.

## Release Candidate
Proposed release.

```text
Release Candidate != Published Release
```

## Published Release
Immutable approved snapshot/artifact set. Update via successor release.

## Public Delivery
Approved release exposed publicly. Storage availability alone is not publication authority.

## Metadata
Source, rights/license, CRS, vertical datum where relevant, coverage, processing version, checksums, QA, release ID, timestamps.

---

# 15. SPATIAL / 3D AUTHORITY

```text
PostgreSQL/PostGIS = authoritative spatial/application truth
Approved Dataset Release = authoritative versioned spatial artifact
CesiumJS = primary 3D geospatial client
3dviz-pro-max = specialist reasoning/presentation support
```

Correct chain:

```text
SOURCE
→ POSTGIS / DATASET / RELEASE
→ PUBLIC-SAFE CONTRACT
→ CESIUM
→ 3D PRESENTATION
→ OBSERVED BROWSER OUTPUT
```

```text
beautiful terrain != verified terrain accuracy
rendered road != road safety
marker position != field verification
moving model != physical simulation
```

---

# 16. SPATIAL SEMANTICS

## CRS
Must be explicit.

## Coordinate Order
Comes from repository contracts, not screenshot labels.

## Metric Distance
Authoritative metric calculations follow server/PostGIS policy where required.

## AOI
Supports validation, prioritization, processing scope, camera bounds. Outside AOI is generally review, not automatic invalidity.

## Geometry History
Authoritative changes remain traceable.

## Elevation / Vertical Datum
Expose source and assumptions.

## Slope
Deterministic derived output tied to release and algorithm/policy version.

## Aspect
```text
Aspect != View
```

## Viewshed
```text
Viewshed != Guaranteed Real-World View
```
Expose terrain resolution, observer/target height, omitted objects, source date and algorithm assumptions.

## Road / Access
Mapped geometry does not certify safety, legality, passability or current condition.

---

# 17. OPERATIONS / SECURITY — SERIES 07

Operational states:

```text
PASS
WARN / DEGRADED
FAIL
UNKNOWN
NOT RUN
PARTIAL PASS
```

## Web Health
Reachability/runtime readiness without conflating deploy with functional acceptance.

## DB / PostGIS Diagnostics
Structured bounded diagnostics; no arbitrary SQL/raw secrets/owner controls.

## Private Object Storage
Private imports/evidence/runtime artifacts.

## Published Storage / Public Delivery
Immutable public release artifacts and delivery verification.

## Credential Boundary

Normal web runtime may contain:
```text
application runtime DB role
private storage runtime credential
```

Normal web runtime must not contain:
```text
DB owner/bootstrap authority
published release operator credential
provider master credential
```

## Jobs
Bounded processing/background status.

## Incident Center
Meaningful incidents; individual errors are not automatically incidents.

## Audit
Trace operational/security decisions.

---

# 18. RESPONSIVE SYSTEM — SERIES 08

```text
Desktop Drawer → Tablet Side Panel → Mobile Bottom Sheet
Desktop Table → Tablet Compact Table → Mobile Cards
Desktop Filters → Mobile Filter Sheet
```

Responsive changes layout, not truth.

Public mobile: map, search, results, compact/half/full Place views, bottom sheets, layers, filters, clusters, terrain/access information.

Admin mobile: Place list/edit, verification/field review/evidence, import summary, Dataset quick view, operations health, incident/session states.

---

# 19. ACCESSIBILITY

Critical meaning must not exist only as visual decoration. Where applicable provide keyboard operation, visible focus, labels, touch-sized targets, contrast, reduced-motion support, textual representation of important 3D facts, and actionable errors. Status must not rely on color alone.

---

# 20. FUTURE PROPERTY — SERIES 09

```text
Phase 3 → Property Registry
Phase 4 → Property Intelligence
```

Core rule:

```text
PROPERTY != PARCEL != LISTING
```

Property Registry includes Property identity, map, detail, provenance, facts, verification, Parcel association and Listing association.

A LAND-digitized polygon is not automatically official cadastral truth.

```text
Asking Price != Market Value
```

Future intelligence may include terrain, slope/aspect, access, nearby context, viewshed, infrastructure, comparables/price evidence and domain-specific confidence.

Prefer confidence by domain rather than one magic score.

---

# 21. FUTURE AI — SERIES 10

AI remains subordinate to LAND data, security, verification and publication authority.

## Public LAND Advisor
Place query, grounded answers, nearby search, terrain/view explanation, Property comparison, stale/conflicting data explanation, legal/price-safe answers.

## Admin Assistant
Import explanation, QA/release explanation, stale/conflict review support, provenance/tool activity.

## AI Control Center
Provider/model registry, personas, tool registry, policies, prompt versions, evaluation/config release, usage/cost, diagnostics, audit, kill switch.

Allowed early pattern:

```text
search
retrieve
compare
explain
summarize
map fly-to
highlight
show approved layer
```

Forbidden by default:

```text
direct SQL
arbitrary DB access
arbitrary HTTP/browser
secret access
Verify
Publish
move authoritative geometry
approve Property
create legal facts
invent valuation
```

AI may explain authority. AI is not authority.

---

# 22. CORE DOMAIN CONCEPTS

Conceptual only; exact types/tables come from repository contracts:

```text
Place
Source
SourceReference
Observation
VerificationRecord
Evidence
GeometryVersion
ImportBatch
ImportRow
Dataset
DatasetRelease
PublishedAsset
Media
User
Role
AuditEvent
Incident
Session
ProcessingJob

Future:
Property
Parcel
Listing
PropertyFact
PriceEvidence
AIProvider
AIModelAlias
AIToolProfile
AIPolicy
AIPromptVersion
AIConfigRelease
```

---

# 23. CONCEPTUAL RELATIONSHIPS

```text
Place
├── geometry/history
├── source references
├── verification records
├── media
├── access context
├── publication state
└── audit/history
```

```text
ImportBatch
├── source workbook
├── inspection
├── mapping
├── ImportRow[]
├── validation results
├── staged decisions
└── commit result
```

```text
Dataset
└── DatasetRelease[]
    ├── source/raw
    ├── normalized
    ├── derived
    ├── QA
    ├── checksums
    └── PublishedAsset[]
```

```text
Property
├── Parcel association(s)
├── Listing association(s)
├── PropertyFact[]
├── provenance
├── verification
└── deterministic intelligence
```

---

# 24. STATE MACHINES

Conceptual unless repository contracts define exact states.

## Import
```text
UPLOADED → INSPECTED → MAPPED → VALIDATED → STAGED → REVIEWED → COMMITTED
```

## Spatial Verification
```text
DECLARED → OBSERVED → CANDIDATE → REVIEW → VERIFIED
```
Not necessarily a mandatory linear progression for every object; semantic separation is the requirement.

## Publication
```text
DRAFT → REVIEW / READY → PUBLISHED → ARCHIVED / RETIRED
```

## Dataset Release
```text
DRAFT → PROCESSING → QA → RELEASE_CANDIDATE → PUBLISHED → SUPERSEDED
```

## Operations
```text
NOT RUN / PASS / WARN-DEGRADED / FAIL / UNKNOWN / PARTIAL PASS
```

---

# 25. END-TO-END WORKFLOW — PLACE CONTENT

```text
Source / Excel / Manual Entry
↓
Source registration / provenance
↓
Import or controlled edit
↓
Validation
↓
Staging / Candidate
↓
Human review
↓
Place domain mutation
├──→ Verification / trust state
│     (independent; may remain UNKNOWN and may change over time)
└──→ Publication decision
      (independent publication/source eligibility gates)
      ↓
Public-safe projection
↓
Search / Map / Place Drawer
```

- Verification does not gate publication unless a specific repository policy explicitly says so.
- Publication does not imply verification; a public Place may legitimately be Published + Unknown/Declared/Verified.
- Verification and trust updates may occur independently before or after publication.
- Public projection remains subject to independent publication, source and public-safety gates and must expose the current safe trust summary.

```text
Import != Verification
Verification != Publication
```

---

# 26. END-TO-END WORKFLOW — SPATIAL ASSETS

```text
Spatial Source
↓
Source rights / provenance
↓
Dataset registration
↓
Raw artifact
↓
Normalization
↓
Derived processing
↓
QA
↓
Release Candidate
↓
Published immutable Release
↓
Public delivery
↓
Cesium layer
↓
Observed browser output
```

Browser rendering cannot retroactively establish source authority or field accuracy.

---

# 27. END-TO-END WORKFLOW — VERIFICATION

```text
Review trigger
↓
Queue
↓
Object under review
↓
Declared / Observed / Verified comparison
↓
Candidate geometry/fact
↓
Evidence
↓
Deterministic checks
↓
Human reviewer decision
↓
Geometry/fact history
↓
Audit
↓
Expiry / re-review
```

AI may explain anomalies. AI does not make the verification decision by default.

---

# 28. END-TO-END WORKFLOW — PUBLIC MAP

```text
/map
↓
Application shell
↓
Cesium initialization
↓
Terrain / imagery / approved layers
↓
Published Places
↓
Search / Explore
↓
Select
↓
Fly-to
↓
Place Card
↓
Place Drawer
↓
Source / Verification / Access
↓
Nearby / Layers
```

---

# 29. END-TO-END WORKFLOW — FUTURE PROPERTY

```text
Property Registry
↓
Property identity
↓
Parcel / Listing associations
↓
Facts + provenance
↓
Verification
↓
Spatial intelligence
↓
Price evidence / comparables
↓
Property Intelligence
↓
Grounded AI explanation
```

---

# 30. DATA LINEAGE

## Imported Place Field
```text
Workbook cell
→ raw value
→ normalized interpretation
→ validation
→ staged value
→ review/commit
→ Place fact
→ verification/publication state
→ public-safe DTO
→ UI
```

## Terrain
```text
DEM source
→ Source Registry
→ Dataset
→ raw artifact
→ processing
→ derived terrain
→ QA
→ Published Release
→ public delivery
→ Cesium
```

## AI Answer
```text
Authoritative LAND data
→ typed safe tool
→ retrieved facts + provenance
→ AI explanation
→ UI
```

Never AI statement → automatic authoritative fact.

---

# 31. SOURCE-OF-TRUTH MATRIX

| Information | Primary authority | UI/rendering role |
|---|---|---|
| Place identity | Place domain / repository contract | Display/search |
| Place geometry | PostGIS + geometry history | Cesium/map |
| Verification | Verification domain | Badge/explanation |
| Source authority | Source/provenance | Source badge/panel |
| Publication | Publication/domain policy | Public visibility |
| Terrain | Approved Dataset Release | Cesium terrain |
| Imagery | Approved source/release | Cesium imagery |
| Roads | Approved spatial source/release | Access/context |
| Dataset lineage | Dataset/Release | Admin metadata |
| Published bytes | Immutable release artifact | Public delivery |
| Operational health | Diagnostics evidence | Operations UI |
| Browser 3D scene | Representation only | UX |
| AI answer | Explanation only | Advisor UI |
| Visual-board sample values | No factual authority | Illustration |
| Future asking price | Listing / Price Evidence | Property UI |
| Future legal boundary | Approved legal/cadastral source | Property map |

---

# 32. UI ACTION → DOMAIN EFFECT

Every interactive control should be classified:

```text
PRESENTATION ONLY
fly-to / zoom / drawer / layer / camera

DRAFT MUTATION
edit draft/content

CANDIDATE MUTATION
submit geometry/fact correction

VERIFICATION DECISION
authorized reviewer action

PUBLICATION DECISION
authorized publisher action

RELEASE PUBLICATION
authorized release operator action

PROVIDER OPERATION
outside ordinary content controls unless explicitly bounded
```

---

# 33. RBAC PRINCIPLES

Exact role names must be reconciled with repository RBAC.

| Capability | Public | Editor | Reviewer | Publisher/Admin | Operator |
|---|---:|---:|---:|---:|---:|
| View published Place | Yes | Yes | Yes | Yes | Yes |
| Search public map | Yes | Yes | Yes | Yes | Yes |
| Edit Place draft | No | Yes | Policy | Yes | No |
| Submit candidate geometry | No | Yes/Policy | Yes | Yes | No |
| Verify geometry | No | No | Yes | Policy | No |
| Publish Place | No | No | No/Policy | Yes | No |
| Create Dataset/Release | No | No | No | Policy | Yes |
| Publish spatial release | No | No | No | Policy | Yes |
| View raw secrets | No | No | No | No | No via product UI |
| Arbitrary SQL | No | No | No | No | No via diagnostics UI |

---

# 34. API / APPLICATION-SERVICE BOUNDARY

Desired pattern:

```text
UI
→ route/API adapter
→ application service
→ domain/spatial logic
→ persistence/provider adapter
```

Examples:

```text
Search UI
→ public Place API
→ Place service
→ public-safe query
→ PostGIS/domain
```

```text
Verification UI
→ verification route
→ verification service
→ geometry history / decision logic
→ PostGIS
```

```text
Dataset Admin/operator
→ release service
→ release validation
→ immutable publication
→ public delivery registration
```

Do not put authoritative business decisions directly in React components.

---

# 35. PUBLIC-SAFE DATA CONTRACTS

Typical public Place information may include identity, safe geometry, category, public media, source/verification summary, approved access context and release metadata where relevant.

Public clients must not receive private evidence, draft/internal notes, private credentials, sensitive Admin-only provenance, future Property PII or operator-only details.

Cesium must not query raw private tables directly.

---

# 36. ERROR / UNKNOWN / DEGRADED SEMANTICS

```text
FAIL = known check failed
WARNING / REVIEW REQUIRED = attention required
UNKNOWN = insufficient information
NOT RUN = no evidence
TIMEOUT = check did not complete
PARTIAL PASS = some evidence passed, some remains unproven
DEGRADED = system remains partially useful
```

Do not turn UNKNOWN into zero/default.

---

# 37. SAFE DEGRADATION

Terrain failure may still leave imagery, Places, roads, search and detail available.

```text
AI failure != LAND failure
```

Core LAND must not depend on AI availability.

---

# 38. PERFORMANCE PRINCIPLES

Especially for 3D:

```text
lazy Cesium initialization
progressive loading
clustering
bounded AOI
LOD
high-detail hotspots
lower-cost mobile profile
same semantics across devices
```

Performance optimization must not alter truth.

---

# 39. SECURITY PRINCIPLES

Never expose:

```text
server secrets
DB owner/bootstrap credentials
provider master credentials
published operator credentials in web runtime
private evidence publicly
unrestricted SQL
unrestricted shell
unrestricted HTTP/browser authority
arbitrary provider endpoints from untrusted input
```

Future AI follows the same boundaries.

---

# 40. VISUAL-TO-LOGIC EXAMPLES

| Visual element | Meaning | Domain/state | Authority |
|---|---|---|---|
| Verified badge | Verification outcome | Verification | Verification domain |
| Published badge | Public availability | Publication | Publication policy |
| Official source badge | Source authority | Provenance | Source Registry |
| Place marker | Public position | Geometry | PostGIS |
| Dragged marker | Proposed correction | Candidate geometry | Not authoritative yet |
| Cluster | Rendering grouping | Presentation | Client only |
| Terrain shading | Terrain representation | Published terrain release | Release + Cesium |
| Release Candidate | Proposed release | Release state | Dataset/Release |
| PASS service card | Diagnostic evidence | Operations | Diagnostics |
| READ ONLY AI | Tool authority restriction | AI policy | Security policy |
| Bottom sheet | Responsive representation | Same domain state | UI only |

---

# 41. CROSS-FEATURE DEPENDENCIES

```text
Public Map
→ Place publication + Dataset/Release + public delivery + trust summary + Cesium

Place
→ Source + geometry/history + verification + publication + media

Import
→ private storage + validation + Place + Source + review

Verification
→ candidate + evidence + provenance + geometry history + audit

Dataset/Release
→ source rights + processing + QA + storage + public delivery

Operations
→ runtime + DB/PostGIS + storage + auth + jobs + audit

Future Property
→ PostGIS + verification + provenance + Dataset/Release + spatial intelligence

Future AI
→ stable contracts + trusted data + typed tools + policy + audit
```

---

# 42. PHASE / SCOPE MATRIX

| Phase | Goal | Primary visual authority |
|---|---|---|
| 0A | Spatial infrastructure | 00, 06, 07 |
| 0B | Place / spatial content | 00, 02 v2, 03 v2, 04 |
| 0C | Bulk ingestion | 00, 02 v2, 05 |
| 0.5 | Deployment hardening | 00, 02 v2, 07 |
| 1 | Tà Xùa 3D | 00, 01 v2, 08; 04/06/limited 03 support |
| 2 | Digital Twin / Spatial Intelligence | 00, 01 v2, 03 v2, 06, 08 |
| 3 | Property Registry | 00, 02 v2, 03 v2, 09 |
| 4 | Property Intelligence + AI | 00, 01 v2, 02 v2, 09, 10 |
| 5 | Brokerage | Separate future spec |

Visual presence does not authorize implementation.

---

# 43. PHASE 1 — TÀ XÙA 3D

Status at this reviewed baseline:

```text
SPECIFICATION APPROVED AND MERGED
IMPLEMENTATION AUTHORIZATION GRANTED
CURRENT IMPLEMENTATION SHOULD BEGIN WITH SLICE 1A
```

Primary promise: visitors can meaningfully understand Tà Xùa in a high-fidelity, map-first 3D public experience while preserving LAND's source, publication and verification semantics.

Primary visual authorities:

```text
Series 00 → visual/component language
Series 01 v2 → public map composition and interaction target
Series 08 → responsive transformation
Series 04 / 06 / limited 03 → supporting Place, release and trust presentation
```

Phase 1 core:

```text
regional map-first 3D shell
approved terrain
one approved imagery layer when DATA READY; otherwise honest NEUTRAL_GRID
approved roads as context
geographic/village context only from approved LAND data
published public-safe Places
marker/clustering
search
select / fly-to / deep link
selected Place card / drawer
layer controls
source / licence / freshness / verification presentation
responsive desktop / tablet / mobile
WebGL / loading / error / degraded states
accessibility and measured performance hardening
```

Approved implementation slices:

```text
1A — public 3D shell + regional camera + degraded-state baseline
1B — published terrain
1C — imagery + roads
1D — published Places + markers/clusters
1E — search + select/fly-to + Place detail
1F — layers + source/freshness/verification presentation
1G — responsive + accessibility + performance hardening
1H — final browser/provider acceptance
```

Visual convergence starts in **1A**, not after all data slices. Slice 1A should replace the engineering-placeholder feel of the current public map shell with the Series 00/01 composition while keeping missing data honest. Later slices progressively fill that composition with governed real layers and Places.

Explicitly deferred from Phase 1 unless the owner approves a spec amendment:

```text
imagery/data comparison
elevation profile
slope analysis/layer
interactive terrain inspector
route/network analysis
advanced nearby analysis
Place comparison
viewshed / sun-shadow / advanced terrain analytics
Property / Parcel / Listing
LAND Advisor / AI runtime
Brokerage / travel-commerce routing
```

A concept visible on Series 01 is not automatically Phase 1 scope. The approved `docs/PHASE_1_TA_XUA_3D.md` controls scope when the board contains future continuity.

---

# 44. PHASE 2 — DIGITAL TWIN / SPATIAL INTELLIGENCE

Future capability families:

```text
Terrain Intelligence
elevation / slope / aspect / terrain summary

Access Intelligence
nearest road / network relation / access point /
straight vs network distance / freshness

View Intelligence
viewpoint / direction / view sector / viewshed / assumptions

High-Detail Context
selected photogrammetry hotspots / 360 panorama

Temporal / Dependency Awareness
input geometry version / dataset release /
algorithm version / timestamp / quality
```

AI is not required to compute deterministic analytics.

---

# 45. PHASE 3 — PROPERTY REGISTRY

Focus:

```text
Property
Parcel
Listing relation
facts
provenance
verification
asking-price evidence
```

No automatic appraisal.

---

# 46. PHASE 4 — PROPERTY INTELLIGENCE + AI

Focus:

```text
comparables
terrain/access/view analysis
price evidence
grounded AI explanation
```

AI must not approve authoritative Property facts or geometry by default.

---

# 47. PHASE 5 — BROKERAGE

No dedicated canonical board yet. Requires a separate product/compliance specification.

---

# 48. ACCEPTANCE MODEL

Every substantial capability should define applicable acceptance:

```text
Functional
Data
Spatial
Security
Responsive
Accessibility
Performance
Failure / Degraded
Audit / History
Visual Fidelity
Observed Browser Output
```

For screenshot/board-driven work, `VISUALLY CONVERGED` requires all of the following:

```text
[ ] canonical board and target viewport identified
[ ] observed browser screenshot captured
[ ] side-by-side comparison performed
[ ] composition / hierarchy / proportions converge
[ ] typography / palette / density / surfaces converge
[ ] controls / cards / drawers / states use the same visual language
[ ] responsive state checked against Series 08 where applicable
[ ] no factual/sample data invented to fill the design
[ ] material deviations are listed, justified, and owner-visible
```

A green test suite proves functional/code gates, not visual fidelity by itself.

---

# 49. ACCEPTANCE EXAMPLES

## Public Place
Search returns the published Place; marker renders; fly-to works; card/drawer opens; source and verification are visible; draft/private fields do not leak; Published is not presented as Verified; mobile shows the same truth.

## Import
A valid workbook can proceed Upload → Inspect → Map → Validate → Stage → Review → Commit; source evidence is retained; no Place mutation before Commit; Commit is atomic according to policy; Commit does not auto-Verify or auto-Publish.

## Verification
Authorized reviewer approves a candidate; decision is recorded; accepted geometry becomes authoritative according to repository rules; previous geometry remains historical; unrelated verification domains do not auto-verify.

## Dataset Release
Authorized publication creates an immutable Published Release with traceable metadata/checksums; existing published bytes are not silently overwritten.

## Operations
Configured credentials without a run health check must not be shown as Healthy/PASS.

## AI
Answers are grounded in safe LAND data; UI-only fly-to/highlight may be allowed; AI must not verify, publish, move geometry, invent legal facts/valuation, read secrets or run arbitrary SQL.

---

# 50. OPEN-DECISION RULE

If a capability needs a decision not defined by current authority, mark:

```text
OPEN DECISION
```

Record:

```text
decision required
affected domain
alternatives
migration impact
data/security impact
acceptance impact
ADR requirement
```

Do not bury unresolved architecture inside implementation.

---

# 51. EXPLICIT NON-GOALS

This blueprint does not authorize:

```text
Phase 1 work outside the approved Phase 1 specification or ahead of the active slice
Property before Phase 3
AI runtime before authorized phase
Brokerage before separate compliance/product design
cross-product shared DB
Three.js replacement of Cesium
arbitrary AI SQL/HTTP/browser/shell authority
silent geometry correction
silent verification
automatic publication from import
in-place mutation of published releases
visual sample values as production data
using placeholder UI as the canonical visual target when an approved board exists
claiming visual completion from unit/CI success without observed browser comparison
```

---

# 52. CODEX / SKILL ROUTING

```text
requirements/domain ambiguity → Matt skills when needed
implementation/TDD/debugging → Superpowers
minimalism → Ponytail
frontend → Build Web Apps
responsive/a11y → frontend-design-pro
visual polish → Designer Skill
3D specialist → 3dviz-pro-max
browser verification → Playwright
final substantial review → Matt code-review
```

For any board-driven frontend task:

```text
canonical board
→ implementation
→ target viewport render
→ screenshot comparison
→ visual discrepancy fix
→ semantic/functional regression checks
```

Do not let “current CSS already works” defeat the reference-fidelity contract.

For 3D:

```text
PostGIS / Release = authority
Cesium = primary geospatial client
3dviz-pro-max = specialist reasoning
Series 01 v2 = primary Phase 1 visual target
Playwright/browser screenshot = observed-output evidence
```

---

# 53. COMPANION TRACEABILITY DOCUMENT

Pair this blueprint with:

```text
docs/specs/TA_XUA_LAND_VISUAL_SYSTEM_TRACEABILITY_MATRIX.md
```

The companion matrix should map:

```text
Feature ID
Board
Screen
Actor
Purpose
Input
Output
Domain Entity
State
Source of Truth
Service/API
Permission
Dependencies
Phase
Acceptance
```

The blueprint gives system architecture. The matrix gives lookup-level precision.

---

# 54. FINAL SYSTEM MODEL

```text
RAW INPUT / SOURCE
        ↓
PROVENANCE
        ↓
CONTROLLED INGESTION
        ↓
DOMAIN OBJECTS
        ↓
SPATIAL TRUTH + HISTORY
        ├──→ VERIFICATION / TRUST LIFECYCLE
        │     (independent; may remain UNKNOWN and may change over time)
        └──→ PUBLICATION / VERSIONED DATASET / RELEASE
              (independent source, eligibility and public-safety gates)
              ↓
        PUBLIC-SAFE CONTRACT
              ↓
        MAP / ADMIN EXPERIENCE
              ↓
        DETERMINISTIC SPATIAL INTELLIGENCE
              ↓
        PROPERTY INTELLIGENCE
              ↓
        GROUNDED AI EXPLANATION
```

---

# 55. FINAL RULE

```text
CANONICAL BOARD
→ USER INTENT
→ DOMAIN MEANING
→ DATA
→ STATE
→ AUTHORITY
→ WORKFLOW
→ PERMISSION
→ SERVICE / API
→ HIGH-FIDELITY UI
→ OBSERVED BROWSER SCREENSHOT
→ SEMANTIC + VISUAL TEST
→ ACCEPTANCE
```

Correct interpretation:

```text
match the approved visual composition closely
+ preserve the real LAND contracts underneath it
+ use honest empty/degraded states when data is unavailable
```

Forbidden interpretation:

```text
copy sample pixels/text/numbers as factual data
invent backend logic merely to imitate a screenshot
ignore the canonical board because a generic placeholder already functions
```

**The interface should look and behave like the approved LAND visual system while revealing LAND's spatial truth, provenance, confidence, workflow and authority. Visual fidelity and semantic integrity are both required.**
