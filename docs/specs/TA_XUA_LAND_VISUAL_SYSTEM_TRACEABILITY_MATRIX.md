# TÀ XÙA LAND — VISUAL SYSTEM TRACEABILITY MATRIX

Status: Canonical visual-to-system traceability — implementation-ready
Version: 1.1
Snapshot basis: 2026-09-11 handoff + approved/merged Phase 1 specification + Visual Specification Library Series 00–10 + current repository/deployed UI review
Repository: `vtmedia0910/TaXuaLand`
Intended path: `docs/specs/TA_XUA_LAND_VISUAL_SYSTEM_TRACEABILITY_MATRIX.md`

> This matrix translates the canonical visual boards into traceable product-system concepts.
>
> Each row connects:
>
> ```text
> VISUAL
> → SCREEN
> → FEATURE
> → ACTOR
> → PURPOSE
> → INPUT
> → OUTPUT
> → DOMAIN
> → STATE
> → SOURCE OF TRUTH
> → SERVICE/API
> → PERMISSION
> → DEPENDENCIES
> → PHASE
> → ACCEPTANCE
> ```
>
> This document complements:
>
> ```text
> docs/specs/TA_XUA_LAND_MASTER_PRODUCT_SYSTEM_BLUEPRINT.md
> ```
>
> It does not override approved architecture, ADRs, repository contracts, migrations, tests, or explicit owner decisions.

This v1.1 matrix is synchronized with `TA_XUA_LAND_MASTER_PRODUCT_SYSTEM_BLUEPRINT` v1.1. When the two documents disagree on visual-fidelity gates, current Phase 1 scope, or implementation-maturity terminology, reconcile them before coding rather than choosing whichever is more convenient.

---

# 0. HOW TO READ THE MATRIX

## 0.1 Feature ID convention

```text
DS-*   Design System
PUB-*  Public Map / 3D
ADM-*  Global Admin
VER-*  Spatial Verification
PLC-*  Place / POI
IMP-*  Excel Import / Data QA
REL-*  Dataset / Release
OPS-*  Operations / Diagnostics / Security
RSP-*  Responsive
PRP-*  Future Property
AI-*   Future AI
```

## 0.2 Status terminology

```text
CURRENT FOUNDATION
= already part of accepted/frozen architecture or Phase 0 foundation

CURRENT CLOSEOUT
= belongs to Phase 0.5

PHASE 1
= current authorized Tà Xùa 3D implementation; specification approved and merged

PHASE 2
= future Digital Twin / Spatial Intelligence

PHASE 3
= future Property Registry

PHASE 4
= future Property Intelligence + AI

DEFERRED
= explicitly not current

CONDITIONAL
= only if deterministic data/service exists
```

## 0.3 Authority rule

When a visual element conflicts with repository or architecture semantics:

```text
architecture / repository contract wins
```

Series 02 v2 owns global Admin navigation.

Series 03 v2 owns the Spatial Verification workflow.

Series 00 owns cross-product visual language.

## 0.4 Implementation-maturity vocabulary

Phase ownership and implementation maturity are separate. Never use a phase label such as `CURRENT FOUNDATION` as proof that a screen is visually complete.

```text
ARCHITECTURE / CONTRACT READY
= authority, domain semantics, schema/contracts, or service boundary exist

FUNCTIONALLY PRESENT
= route/service/interaction works

VISUALLY CONVERGED
= observed UI closely matches the canonical board for composition, hierarchy, density and component language

BROWSER VERIFIED
= the target state was actually observed in a browser at the required viewport

DATA READY
= exact governed data/release required by the feature is approved

PROVIDER READY
= external runtime/delivery path required by the feature is verified

ACCURACY VERIFIED
= any factual/spatial accuracy claim has suitable evidence
```

These labels are independent. A Phase 0 capability may be `FUNCTIONALLY PRESENT` while its later visual-convergence work is still incomplete.

## 0.5 Reference-fidelity rule

The canonical Series 00–10 boards are **visual acceptance targets**, not loose moodboards. For UI work, the implementation should converge closely to the relevant board unless a higher authority requires a deviation.

Preserve, as applicable:

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

Current CSS or current page layout is not a visual authority merely because it already exists. Generic or placeholder presentation may be replaced while preserving domain, routing, security, accessibility and architecture contracts.

A visual task is not accepted from code inspection or green CI alone. It requires observed browser output and side-by-side comparison with the canonical board. Browser/font/WebGL differences may prevent mathematical pixel identity, but unexplained differences in composition, hierarchy, density, component treatment or overall visual character are defects.

Never create fake production facts, fake verification, fake publication, fake system health or unavailable features merely to fill a visual. Use truthful empty, disabled, loading or degraded states while preserving the canonical composition.

## 0.6 Series 00 convergence seed

Until superseded by explicitly approved code tokens, visual implementation should normalize the Series 00 language into shared tokens/components rather than scattering one-off CSS. The board currently presents this target language:

```text
Primary   #0EA5A8
Success   #16A34A
Warning   #F59E0B
Danger    #EF4444
Navy      #0F2A3D
Charcoal  #1E3A5F
Gray      #64748B
Surface   #F8FAFC
UI font   Inter / Vietnamese-capable fallback stack
```

Series 00 also establishes the intended white/light application surfaces, deep-navy navigation, teal primary actions, compact data-dense cards/tables, restrained borders/shadows, spatial controls and independent trust-status families. Exact numeric spacing/radius values should be centralized as code tokens and validated against the board rather than copied ad hoc.

---

# 1. SERIES 00 — DESIGN SYSTEM TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DS-001 | All surfaces | All | Shared visual language | Approved design tokens | Consistent UI | Presentation | Series 00 + approved shared code tokens | None | N/A | Design system | All | Shared tokens/components converge to Series 00; browser comparison confirms typography, palette, density and surface language |
| DS-002 | Status badge | Public/Admin | Show verification state | Verification state | Verified/Declared/Unknown/etc. badge | Verification | Verification domain | Read contract | Viewer-dependent | Verification | All | Never confused with publication/source authority |
| DS-003 | Status badge | Public/Admin | Show source authority | Source authority | Official/LAND Observed/Seller/etc. | Provenance | Source Registry | Read contract | Viewer-dependent | Source domain | All | Independent from Verification |
| DS-004 | Status badge | Public/Admin | Show publication state | Publication state | Draft/Review/Published/Archived | Publication | Publication/domain policy | Read contract | Viewer-dependent | Publication | All | Published never rendered as Verified |
| DS-005 | Table | Admin | Dense record browsing | Typed records | Sortable/filterable rows | Presentation | Domain APIs | Read APIs | Admin/RBAC | Domain modules | All | No semantic state lost; density, header treatment, filters, row states and actions converge to Series 00 |
| DS-006 | Card | Public/Admin | Summarize entity/state | Safe entity data | Compact entity summary | Presentation | Domain APIs | Read APIs | Role-dependent | Domain modules | All | Card data matches detail truth and card hierarchy/media/status treatment converges to Series 00 |
| DS-007 | Drawer | Public/Admin | Preserve context while showing detail | Selected entity | Contextual detail | Presentation | Domain APIs | Read APIs | Role-dependent | Map/list selection | All | No hidden mutation; desktop drawer/tablet panel/mobile sheet follow Series 00/08 composition |
| DS-008 | Modal | Admin | Confirm bounded action | Action intent | Confirm/cancel | Workflow | Application state | Action endpoint | Role-dependent | Mutation service | All | Dangerous action requires explicit confirmation |
| DS-009 | Toast | All | Communicate result | Operation result | Success/error feedback | Presentation | Operation result | N/A | N/A | Action state | All | Toast never substitutes persistent audit/state |
| DS-010 | Stepper | Admin | Show multi-stage workflow | Workflow state | Current/completed stages | Workflow | Application/domain state | Workflow APIs | Role-dependent | Import/release | All | Stepper cannot skip mandatory domain gates |
| DS-011 | Search/Filter | Public/Admin | Find governed objects | Query/filter | Result set | Query | Domain source | Query APIs | Role-dependent | Search/index/query | All | No private data leak |
| DS-012 | Loading state | All | Make pending work explicit | Async state | Loading UI | UI state | Runtime state | N/A | N/A | Any async module | All | Loading not confused with empty/unknown |
| DS-013 | Empty state | All | Explain valid no-data state | Empty result | Guidance | UI state | Query result | N/A | N/A | Domain query | All | Empty not shown as error |
| DS-014 | Error state | All | Explain known failure | Error | Recoverable guidance | UI state | Runtime/action result | N/A | N/A | Any module | All | No fabricated fallback facts |
| DS-015 | Review state | Admin | Show human attention required | Review flag | Review CTA/state | Workflow | Domain workflow | Review APIs | Reviewer | Verification/import/release | All | Review distinct from fail/unknown |
| DS-016 | Map controls | Public/Admin | Navigate spatial scene | Camera/map state | Updated view | Presentation | Client state | None | N/A | Cesium/map | All | No authoritative mutation |
| DS-017 | Layer panel | Public/Admin | Toggle approved layers | Layer registry/config | Visible layer set | Presentation | Approved layer/release config | Layer/read API | Role-dependent | Dataset/Release | All | No arbitrary external endpoint |
| DS-018 | Marker state | Public/Admin | Show entity + selection/trust | Entity geometry/state | Marker style | Presentation | PostGIS + domain state | Read API | Role-dependent | Place/Verification | All | Marker style does not invent truth |
| DS-019 | Cluster state | Public | Improve readability/performance | Visible markers | Cluster glyph | Presentation | Client aggregation | None | Public | Map | Phase 1 | Clustering does not merge entities |
| DS-020 | Geometry state | Admin | Differentiate declared/candidate/verified | Geometry versions | Distinct geometry rendering | Spatial workflow | Geometry history | Spatial APIs | Reviewer/editor | Verification | All | Candidate never visually masquerades as Verified |

---

# 2. SERIES 01 v2 — PUBLIC MAP & 3D EXPERIENCE TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PUB-001 | `/map` | Public Visitor | Main regional 3D experience | Terrain/imagery/Places | Interactive 3D map | Public spatial presentation | Published releases + public Place data | Public spatial APIs | Public | Cesium, Release, Place | Phase 1 | `/map` loads reliably **and is map-first**; canonical desktop composition is dominated by the spatial canvas with integrated navigation/search/controls, not a marketing intro above a boxed viewer |
| PUB-002 | Regional overview | Public Visitor | Orient user spatially | Camera preset/AOI | Initial regional view | Presentation | Approved AOI/camera config | None | Public | Cesium | Phase 1 | Deterministic regional framing comes from approved AOI/config and visually resembles the Series 01 regional overview without borrowing screenshot coordinates |
| PUB-003 | Camera controls | Public Visitor | Reset/preset/fly | Camera state | New camera state | Presentation | Client state | None | Public | Cesium | Phase 1 | Reset/presets deterministic and usable |
| PUB-004 | Place markers | Public Visitor | Show published Places | Public-safe Place geometry | Cesium markers | Place/publication | PostGIS public projection | Public Place API | Public | Place publication | Phase 1 | Only published safe Places render |
| PUB-005 | Marker clusters | Public Visitor | Reduce clutter | Visible Place markers | Cluster markers | Presentation | Client aggregation | None | Public | PUB-004 | Phase 1 | Clustering remains performant and semantically safe |
| PUB-006 | Global search | Public Visitor | Find published Places | Query | Search results | Query | Public Place search contract | Public search API | Public | Place/publication | Phase 1 | Search finds approved Places only |
| PUB-007 | Explore list + map | Public Visitor | Browse and compare spatial context | Published Place set | Synchronized list/map | Presentation/query | Public Place DTO | Public API | Public | Search/map | Phase 1 | List selection syncs with map; split/list-over-map composition and density converge to Series 01 while preserving map context |
| PUB-008 | Selected Place card | Public Visitor | Show compact Place context | Selected Place | Summary card | Place | Public Place DTO | Public API | Public | PUB-004/006 | Phase 1 | Card matches authoritative public facts |
| PUB-009 | Place detail drawer | Public Visitor | Show deeper Place data without leaving map | Place ID | Detail drawer | Place | Public Place DTO | Public Place detail API | Public | PUB-008 | Phase 1 | Source/verification visible; no private fields; desktop drawer and responsive sheet preserve Series 01/08 visual hierarchy |
| PUB-010 | Layer panel | Public Visitor | Toggle public spatial layers | Approved layer registry | Layer visibility state | Dataset/Release | Published release config | Public layer config | Public | Series 06 | Phase 1 | Toggling does not reload whole app; panel follows Series 01 layer hierarchy and shows unavailable layers honestly rather than fake-enabled |
| PUB-011 | Imagery comparison | Public Visitor | Compare approved imagery/data views | Two approved sources/releases | Comparison UI | Dataset/Release | Approved releases | Public release API | Public | REL-* | Phase 2 | Deferred by approved Phase 1 spec; when implemented, comparison must not imply verification |
| PUB-012 | Access context | Public Visitor | Explain relation to roads/access | Place + road data | Bounded mapped-road context | Spatial read | PostGIS + approved road release | Existing safe read contract | Public | Roads/Place | Phase 1 minimal / Phase 2 advanced | Phase 1 may show non-analytical mapped-road context only; road mapping never implies safety, legality or passability |
| PUB-013 | Route context | Public Visitor | Show bounded route/access geometry | Approved route/network context | Route overlay | Spatial derived | Approved road/network data | Spatial service | Public | Road service | Phase 2 conditional | Deferred from Phase 1; no unsupported travel-commerce routing |
| PUB-014 | Elevation profile | Public Visitor | Explain vertical terrain along line/path | Geometry + terrain release | Profile chart | Deterministic derived | Terrain release + algorithm policy | Spatial analysis API | Public | Terrain release | Phase 2 | Deferred by approved Phase 1 spec; source/release/vertical assumptions and sampling policy must be explicit |
| PUB-015 | Terrain inspector | Public Visitor | Explain terrain at point/area | Selected point/area | Terrain analysis | Deterministic spatial | Terrain release | Spatial API | Public | Terrain | Phase 2 | Deferred by approved Phase 1 spec; Phase 1 may expose release/source metadata only, with no fabricated analytical metrics |
| PUB-016 | Slope layer | Public Visitor | Visualize terrain slope | Terrain release | Slope raster/vector | Derived intelligence | Release + algorithm version | Spatial analysis API | Public | Phase 2 analytics | Phase 2 | Reproducible from known inputs |
| PUB-017 | Source explanation | Public Visitor | Explain where data came from | Source metadata | Source panel/badge | Provenance | Source Registry | Public provenance API | Public | Source domain | Phase 1 | Source authority shown safely |
| PUB-018 | Verification explanation | Public Visitor | Explain trust status | Verification summary | Trust badge/panel | Verification | Verification domain | Public trust API | Public | Verification | Phase 1 | Published != Verified preserved |
| PUB-019 | Nearby Places | Public Visitor | Discover nearby public Places | Place/point + distance policy | Nearby list/map | Spatial query | PostGIS | Public spatial API | Public | Place | Phase 2 unless separately approved | Advanced nearby analysis is deferred from the approved Phase 1 core; distance semantics must be explicit when added |
| PUB-020 | Place comparison | Public Visitor | Compare approved Place attributes | Selected Places | Comparison view | Place | Public-safe Place DTOs | Public APIs | Public | Place | Phase 2 | Deferred from approved Phase 1; source/verification differences must remain visible |
| PUB-021 | Share/deep link | Public Visitor | Share selected spatial state | Map/Place selection | URL state | Presentation | Public identifiers | Router | Public | Map state | Phase 1 | No private/admin IDs leak |
| PUB-022 | WebGL fallback | Public Visitor | Preserve useful access if 3D fails | Runtime capability/error | Degraded experience | Runtime/UI state | Browser runtime | None | Public | Cesium | Phase 1 | Useful fallback exists |
| PUB-023 | Future Property layer entry | Public Visitor | Product continuity only | Future Property data | Disabled/future entry | Future Property | N/A until Phase 3 | N/A | Public future | Series 09 | Deferred | Must not trigger Phase 1 Property implementation |
| PUB-024 | Future LAND Advisor entry | Public Visitor | Product continuity only | Future AI | Future entry | AI | N/A until Phase 4 | N/A | Public future | Series 10 | Deferred | No AI runtime in Phase 1 |

---

# 3. SERIES 02 v2 — GLOBAL ADMIN TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ADM-001 | Admin shell | Admin | Global navigation authority | Route/module registry | Stable sidebar | IA | Series 02 + repository routes | Router | Authenticated LAND Admin | All admin modules | Current foundation | Series 02 owns global IA; current route subset does not equal visual completion; sidebar/header/density must converge before `VISUALLY CONVERGED` |
| ADM-002 | Command Center | Admin | Spatial operational overview | Review/data/health/activity | Dashboard | Aggregated read model | Domain APIs | Admin read APIs | Admin | Place/Verification/Ops | Current foundation | Not generic marketing analytics; target is the Series 02 spatial command-center composition, not a generic card dashboard |
| ADM-003 | Admin spatial map | Admin | Spatially locate managed objects | Admin-safe spatial data | Admin map | Spatial presentation | PostGIS/domain APIs | Admin spatial API | Admin | Place/Verification | Current foundation | No alternate truth source |
| ADM-004 | Unified Review Center | Reviewer/Admin | Consolidate review attention | Review queues | Cross-domain task list | Workflow | Domain review sources | Review aggregation service | Reviewer/Admin | VER/IMP/REL | Current/future | Routes into domain-specific decisions |
| ADM-005 | Place overview entry | Admin | Enter Place management | Place summaries | Place workspace | Place | Place domain | Admin Place API | Admin/editor | Series 04 | Current foundation | Canonical Place workflow delegated to Series 04 |
| ADM-006 | Excel Import entry | Admin | Enter bulk ingest workflow | Import summaries | Import workspace | Import | Import domain | Import API | Authorized importer | Series 05 | Current foundation | Canonical seven-step flow preserved |
| ADM-007 | Spatial Verification entry | Reviewer | Enter verification workflow | Queue summary | Verification workspace | Verification | Verification domain | Verification API | Reviewer | Series 03 | Current foundation | Series 03 owns workflow |
| ADM-008 | Source Registry entry | Admin | Manage provenance sources | Source records | Source workspace | Provenance | Source Registry | Source API | Admin | Source domain | Current foundation | Authority/freshness separated |
| ADM-009 | Dataset & Release entry | Operator/Admin | Manage spatial datasets/releases | Dataset summaries | Release workspace | Dataset/Release | Dataset domain | Dataset API | Operator/Admin policy | Series 06 | Current foundation | Dataset != Release preserved |
| ADM-010 | Media entry | Admin/Editor | Govern media | Media records | Media workspace | Media | Media/domain storage | Media API | Authorized | Place | Current foundation | Public/private visibility respected |
| ADM-011 | System Health | Admin/Operator | View operational readiness | Health checks | Health matrix | Operations | Diagnostics evidence | Diagnostics API | Admin/Operator | Series 07 | Phase 0.5 | Configured != Healthy |
| ADM-012 | Provider & Security Readiness | Operator | View provider acceptance/security | Provider evidence | Readiness state | Operations/security | Provider diagnostics | Ops API | Operator | Series 07 | Phase 0.5 | Partial/Not Run/Unknown distinct |
| ADM-013 | Users | System Admin | Manage users | User records | User admin | Identity | Auth/user store | User API | System Admin | RBAC | Current foundation | Least privilege preserved |
| ADM-014 | Role/User matrix | System Admin | Inspect role assignment | Users/roles | Matrix | RBAC | Auth policy | RBAC API | System Admin | Users | Current foundation | Matches actual permissions |
| ADM-015 | RBAC matrix | System Admin | Explain capability permissions | Roles/policies | Capability matrix | Security | RBAC policy | RBAC read API | System Admin | All modules | Current foundation | UI not stronger than backend authorization |
| ADM-016 | Audit Log | Admin/Auditor | Inspect authoritative actions | Audit events | Searchable log | Audit | Audit store | Audit API | Authorized | All mutations | Current foundation | Immutable/traceable according to policy |
| ADM-017 | Notifications | Admin | Surface actionable events | Domain notifications | Notification UI | Workflow | Domain events | Notification service | Admin | Review/Ops | Future/Current partial | Notification not source of truth |
| ADM-018 | Global LAND search | Admin | Find typed admin objects | Query | Typed results | Query | Domain APIs | Search service | Admin | Multiple domains | Future/current partial | Result type explicit |
| ADM-019 | Settings | System Admin | Configure bounded app settings | Approved config fields | Updated settings | Configuration | Config store | Settings service | System Admin | Security policy | Current/future | No secret disclosure |
| ADM-020 | Future Property nav | Admin | Reserve future module location | Future | Future route | Property | N/A | N/A | Future | Series 09 | Deferred | Does not authorize Property early |
| ADM-021 | Future AI Control nav | Admin | Reserve future AI governance | Future | Future route | AI | N/A | N/A | Future | Series 10 | Deferred | Does not authorize AI runtime early |

---

# 4. SERIES 03 v2 — SPATIAL VERIFICATION TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| VER-001 | Verification overview | Reviewer | Summarize verification workload | Review states | Overview metrics | Verification | Verification domain | Verification API | Reviewer | Audit/Place | Current foundation | Counts derived from real states |
| VER-002 | Verification queue | Reviewer | Prioritize items needing review | Candidates/conflicts/expiry | Queue | Review workflow | Verification domain | Queue API | Reviewer | Evidence/source | Current foundation/Phase 2 | Reasons explicit |
| VER-003 | Verification map | Reviewer | Compare spatial evidence | Current/candidate/source geometries | Map overlays | Geometry verification | PostGIS/history | Spatial verification API | Reviewer | Geometry history | Current foundation | No silent mutation |
| VER-004 | Object under review | Reviewer | Inspect full review context | Object ID | Review detail | Verification | Domain read model | Verification detail API | Reviewer | Place/Source/Evidence | Current foundation | All trust dimensions visible |
| VER-005 | Declared vs Observed vs Verified | Reviewer | Preserve truth distinctions | Claims/evidence/current verified | Comparison | Verification semantics | Verification domain | Read API | Reviewer | Evidence | Current foundation | States never collapsed |
| VER-006 | Candidate geometry | Editor/Reviewer | Propose correction | New geometry | Candidate version | Candidate | Geometry history | Candidate service | Authorized editor/reviewer | PostGIS | Current foundation | Candidate not authoritative yet |
| VER-007 | Map picker candidate | Editor/Reviewer | Create candidate from map | Map interaction | Candidate geometry | Candidate | Candidate state | Spatial service | Authorized | VER-006 | Current foundation | Dragging marker != Verify |
| VER-008 | Evidence panel | Reviewer | Evaluate supporting evidence | Evidence/source refs | Evidence view | Evidence | Evidence store/source registry | Evidence API | Reviewer | Source | Current foundation | Private evidence stays private |
| VER-009 | Source authority matrix | Reviewer | Compare source authority | Source refs | Authority summary | Provenance | Source Registry | Source API | Reviewer | Source domain | Current foundation/Phase 2 | Authority != Verification |
| VER-010 | Deterministic checks | Reviewer | Surface anomalies/objective checks | Geometry/data/releases | Check results | Derived review evidence | Deterministic services | Validation API | Reviewer | Spatial services | Current/Phase 2 | Check does not auto-Verify |
| VER-011 | Reviewer checklist | Reviewer | Enforce review completeness | Required criteria | Completed checklist | Workflow | Review policy | Verification service | Reviewer | Evidence/checks | Current foundation | Mandatory criteria enforced |
| VER-012 | Accept candidate | Reviewer | Authorize candidate | Candidate + evidence | Verification decision | Verified | Verification service | Mutation API | Reviewer | Geometry history/audit | Current foundation | Previous authoritative geometry retained |
| VER-013 | Reject candidate | Reviewer | Reject proposed change | Candidate + reason | Rejected decision | Review history | Verification service | Mutation API | Reviewer | Audit | Current foundation | Reason/history retained |
| VER-014 | Request more evidence | Reviewer | Keep case unresolved | Missing evidence | Review-required state | Review | Verification workflow | Mutation API | Reviewer | Evidence | Current foundation | No forced binary decision |
| VER-015 | Verification history | Reviewer/Admin | Inspect past decisions | Object ID | Timeline | Audit/history | Verification/audit store | Read API | Authorized | Audit | Current foundation | Actor/time/evidence traceable |
| VER-016 | Expiry/re-review queue | Reviewer | Revisit stale verification | Policy/freshness | Queue | Expiry/review | Verification policy | Queue API | Reviewer | Freshness | Phase 2 | Expired != false |
| VER-017 | Data conflict resolution | Reviewer | Resolve conflicting source facts | Conflicting claims | Explicit outcome | Verification/provenance | Domain + source data | Review service | Reviewer | Source | Phase 2/3 | No silent overwrite |
| VER-018 | AI anomaly advisory | Reviewer | Explain anomalies without authority | Review-safe data | Advisory | AI read-only | LAND data | Typed AI tool | Reviewer | Series 10 future | Deferred Phase 4 | AI cannot Verify |
| VER-019 | Dataset/release linkage | Reviewer | Trace spatial evidence dependency | Release IDs | Lineage view | Provenance | Dataset/Release | Read API | Reviewer | Series 06 | Phase 2 | Release dependency explicit |
| VER-020 | Assignment/bulk review | Reviewer/Admin | Coordinate workload | Tasks/users | Assignment state | Workflow | Verification workflow | Assignment API | Admin/reviewer | Queue/users | Phase 2 | Bulk actions cannot bypass evidence gates |
| VER-021 | Verification diagnostics | Operator/Reviewer | Diagnose workflow failures | Job/error/check data | Diagnostics | Operations | Diagnostics | Ops API | Authorized | Series 07 | Phase 2 | No arbitrary SQL/shell |
| VER-022 | Mobile field verification | Reviewer | Review evidence in field | Mobile context | Mobile workflow | Same verification truth | Verification domain | Same APIs | Reviewer | Series 08 | Phase 2 | Same semantics as desktop |
| VER-023 | Tablet verification workspace | Reviewer | Larger field/desk review | Review data | Split layout | Presentation | Same APIs | Same | Reviewer | Series 08 | Phase 2 | Same facts as desktop |

---

# 5. SERIES 04 — PLACE / POI TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PLC-001 | Place dashboard | Admin/Editor | Summarize Place estate | Place states | Overview | Place | Place domain | Admin Place API | Authorized | Source/Verification | Current foundation | Real counts only |
| PLC-002 | Place table | Admin/Editor | Browse/filter Places | Query/filter | Rows | Place/query | Place domain | Place API | Authorized | DS tables | Current foundation | Filters preserve status distinctions |
| PLC-003 | Place map | Admin/Editor | Locate Places spatially | Admin-safe geometries | Map | Spatial presentation | PostGIS | Admin spatial API | Authorized | Cesium/map | Current foundation | Map is not alternate truth |
| PLC-004 | Place detail | Admin/Editor/Reviewer | Inspect governed Place | Place ID | Detail | Place | Place domain | Place detail API | Authorized | Source/Verification/Media | Current foundation | All major domains distinct |
| PLC-005 | Create Place | Editor/Admin | Create controlled Place draft | Valid input | Draft Place | Draft | Place service | Mutation API | Editor/Admin | Source policy | Current foundation | No auto-Verify/Publish |
| PLC-006 | Edit Place content | Editor/Admin | Update non-authoritative content fields | Draft/current Place | Updated draft | Place | Place service | Mutation API | Editor/Admin | Audit | Current foundation | Geometry/verification not silently changed |
| PLC-007 | Edit geometry candidate | Editor/Reviewer | Propose spatial correction | Geometry | Candidate | Candidate geometry | Geometry history | Spatial mutation API | Authorized | VER-006 | Current foundation | Candidate distinct from verified |
| PLC-008 | Category | Editor/Admin | Classify Place | Category selection | Category state | Place taxonomy | Domain taxonomy | Place API | Authorized | Config/taxonomy | Current foundation | Valid canonical values only |
| PLC-009 | Access info | Editor/Reviewer | Store approved access context | Source/evidence | Access facts | Place/access | Domain facts | Place API | Authorized | Roads/source | Current foundation | No safety certification inference |
| PLC-010 | Safety/warnings | Admin/Reviewer | Present bounded warnings | Approved facts | Warning UI | Place/safety | Domain/source | Read/mutation policy | Authorized | Verification | Current/future | Unknown stays Unknown |
| PLC-011 | Media | Editor/Admin | Associate media | Media metadata | Media relation | Media | Media/domain storage | Media API | Authorized | Storage | Current foundation | Public/private rules applied |
| PLC-012 | Source linkage | Editor/Admin | Attach provenance | Source ref | Provenance relation | Source | Source Registry | Source API | Authorized | Source domain | Current foundation | Authority recorded |
| PLC-013 | Verification linkage | Reviewer | View/manage trust state | Verification records | Verification summary | Verification | Verification domain | Verification API | Reviewer | Series 03 | Current foundation | Place UI does not implement independent verification semantics |
| PLC-014 | Publication | Publisher/Admin | Control public availability | Eligible Place | Publication state | Publication | Publication policy | Publication service | Authorized | Source/public-safety policy | Current foundation | Publication independent from verification |
| PLC-015 | History/versioning | Admin/Reviewer | Inspect changes | Place ID | Timeline | Audit/history | Domain/audit store | Read API | Authorized | Audit | Current foundation | Geometry history retained |
| PLC-016 | Advanced filters | Admin | Find operational subsets | Filters | Result subset | Query | Place domain | Search/filter API | Admin | PLC-002 | Current foundation | No state conflation |
| PLC-017 | Reporting/summary | Admin | Operational Place summary | Place dataset | Report | Read model | Domain APIs | Reporting API | Admin | Place | Future/current partial | No sample counts hard-coded |
| PLC-018 | Excel Import entry | Admin | Start import from Place context | File/action | Import workflow | Import | Import domain | Import route | Authorized | Series 05 | Current foundation | Redirects to canonical import flow |
| PLC-019 | Public share link | Publisher/Admin | Open public Place representation | Published Place | Public URL | Publication | Public identifier | Router | Authorized | PUB-021 | Phase 1 | Only published safe state |

---

# 6. SERIES 05 — EXCEL IMPORT / DATA QA TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| IMP-001 | Import dashboard | Admin | View batches/status | Import batches | Overview | Import | Import domain | Import API | Authorized | Ops | Current foundation | Real states shown |
| IMP-002 | Upload | Importer/Admin | Securely receive workbook | File | Private object/batch | Uploaded | Import/storage | Signed upload/finalize APIs | Authorized | Private storage | Current foundation | Untrusted file controls enforced |
| IMP-003 | Workbook inspection | Importer/Admin | Inspect workbook structure | Uploaded workbook | Inspection report | Inspected | Import parser | Inspection service | Authorized | Parser/storage | Current foundation | Macros/hidden/etc. policy enforced |
| IMP-004 | Sheet selection | Importer/Admin | Choose relevant sheet | Workbook metadata | Selected sheet | Workflow | Import state | Import API | Authorized | IMP-003 | Current foundation | Only inspected sheets |
| IMP-005 | Field mapping | Importer/Admin | Map source columns to canonical fields | Headers | Mapping config | Mapped | Import mapping | Mapping service | Authorized | Domain schema contract | Current foundation | Required mapping validated |
| IMP-006 | Normalization | System | Produce explicit normalized interpretation | Raw cells | Normalized values | Normalized | Import pipeline | Normalize service | Internal | IMP-005 | Current foundation | Raw source retained |
| IMP-007 | Validation | System/Admin | Validate domain/spatial constraints | Normalized rows | Validation results | Valid/invalid/review | Deterministic validation | Validation service | Authorized read | Place/source/spatial | Current foundation | Explainable row errors |
| IMP-008 | Coordinate validation | System/Reviewer | Detect malformed/suspicious coordinates | Coordinates | Error/review result | Spatial QA | Spatial validation | Spatial service | Authorized | PostGIS/AOI | Current foundation | AI does not guess replacements |
| IMP-009 | Duplicate detection | System/Admin | Flag possible duplicate entities | Rows + existing data | Candidate matches | Advisory | Domain query | Duplicate service | Authorized | Place/PostGIS | Current foundation | Advisory unless strict identity rule |
| IMP-010 | Spatial validation map | Admin/Reviewer | Inspect rows geographically | Validatable rows | Map preview | Presentation/review | Staging data | Spatial QA API | Authorized | Cesium/map | Current foundation | Preview not authoritative |
| IMP-011 | Provenance/source mapping | Admin | Attach source info | Import/source data | Source linkage | Provenance | Source Registry | Source API | Authorized | Series 04/source | Current foundation | Source retained through commit |
| IMP-012 | Stage | System/Admin | Prepare controlled domain decisions | Valid rows | Staged rows | Staged | Import domain | Staging service | Authorized | Validation | Current foundation | No Place mutation before commit |
| IMP-013 | Pre-commit review | Admin | Review CREATE/UPDATE/SKIP | Staged rows | Approved decisions | Review | Import workflow | Review service | Authorized | Place/source | Current foundation | Warnings visible |
| IMP-014 | Commit | Admin/System | Apply controlled domain mutation | Reviewed staged data | Commit result | Committed | Application service | Commit service | Authorized | Transaction/audit | Current foundation | Atomic/idempotent as designed |
| IMP-015 | Commit result report | Admin | Explain outcome | Commit result | Counts/errors/report | Import result | Commit/audit data | Import API | Authorized | IMP-014 | Current foundation | CREATE/UPDATE/SKIP explainable |
| IMP-016 | Invalid workbook state | Admin | Safely reject unsupported/malicious files | Unsafe input | Rejection | Failed validation | Security/import policy | Upload/inspection | Authorized | Parser/security | Current foundation | No partial unsafe mutation |
| IMP-017 | Large import performance | Operator/Admin | Validate supported workload | 100/500/2000 rows etc. | Timing/memory evidence | Operations | Runtime evidence | Diagnostics | Operator | Series 07 | Phase 0.5 acceptance | No fabricated timings |
| IMP-018 | Import diagnostics | Operator/Admin | Diagnose import failures | Batch/job diagnostics | Structured diagnostics | Operations | Diagnostics evidence | Ops API | Authorized | Series 07 | Phase 0.5+ | No secret leakage |

---

# 7. SERIES 06 — DATASET / RELEASE TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| REL-001 | Dataset overview | Operator/Admin | Browse governed datasets | Dataset registry | Dataset list | Dataset | Dataset domain | Dataset API | Authorized | Source | Current foundation | Dataset distinct from Release |
| REL-002 | Create Dataset | Operator | Register logical collection | Metadata/source | Dataset | Dataset | Dataset service | Mutation API | Operator | Source Registry | Current foundation | No implicit publish |
| REL-003 | Terrain dataset detail | Operator | Manage terrain lineage/releases | Dataset ID | Detail | Dataset | Dataset domain | Dataset API | Operator | Terrain pipeline | Current/Phase 1 | Source/CRS/coverage visible |
| REL-004 | Imagery workspace | Operator | Manage imagery source/release | Imagery source | Dataset/release data | Dataset | Dataset domain | Dataset API | Operator | Rights/storage | Phase 1 | Rights/freshness recorded |
| REL-005 | Road network workspace | Operator | Manage road release | Road source | Dataset/release | Dataset | Dataset domain | Dataset API | Operator | Source/PostGIS | Phase 1 | Observation/freshness preserved |
| REL-006 | 3D Tiles dataset | Operator | Manage future high-detail assets | Approved assets | Dataset/release | Dataset | Dataset domain | Dataset API | Operator | Cesium/3D Tiles | Phase 1/2 if approved | No core-engine change without ADR |
| REL-007 | Source artifact registration | Operator | Preserve source artifact/provenance | Source file/metadata | Source artifact record | Source/raw | Dataset/source store | Dataset service | Operator | Source Registry | Current foundation | Original lineage retained |
| REL-008 | CRS metadata | Operator | Record spatial reference | CRS metadata | CRS record | Spatial metadata | Dataset domain | Dataset API | Operator | Spatial policy | Current foundation | CRS explicit |
| REL-009 | Coverage metadata | Operator | Record data coverage | Geometry/extent | Coverage | Spatial metadata | Dataset domain | Dataset API | Operator | PostGIS | Current foundation | Coverage not inferred from screenshot |
| REL-010 | Raw artifact | Pipeline/Operator | Preserve immutable source stage | Source artifact | Raw stage | RAW | Object storage + registry | Pipeline | Operator | Storage | Current foundation | Traceable checksum |
| REL-011 | Normalized artifact | Pipeline | Standardize source | Raw artifact | Normalized stage | NORMALIZED | Pipeline output | Pipeline | Internal | REL-010 | Current foundation | Reproducible |
| REL-012 | Derived artifact | Pipeline | Produce usable spatial output | Normalized input | Derived artifact | DERIVED | Pipeline output | Pipeline | Internal | REL-011 | Current foundation/Phase 1 | Processing version recorded |
| REL-013 | Release QA | Operator/Reviewer | Evaluate candidate artifacts | Derived output | QA result | QA | QA evidence | QA service | Operator | Checksums/visual review | Current/Phase 1 | QA distinct from publication |
| REL-014 | Visual comparison | Operator/Reviewer | Compare release candidates visually | Candidate/current | Comparison | QA/presentation | Release artifacts | Viewer | Authorized | Cesium | Phase 1/2 | Visual match not accuracy proof |
| REL-015 | Release Candidate | Operator | Freeze proposed release inputs | QA-approved artifacts | RC | RELEASE_CANDIDATE | Release domain | Release service | Operator | QA | Current foundation | RC != Published |
| REL-016 | Publish Release | Operator | Create immutable published release | Approved RC | Published Release | PUBLISHED | Release domain | Publication pipeline | Operator | Published storage | Current/Phase 1 | Immutable release created |
| REL-017 | Published release history | Operator/Admin | Inspect versions | Dataset ID | Release timeline | Release history | Release domain | Read API | Authorized | Audit | Current foundation | Successor releases preserved |
| REL-018 | Published asset delivery | Public/Operator | Serve approved release bytes | Published asset | Public asset | Delivery | Published release registry/object store | Public delivery | Public read / operator write | R2/CDN | Phase 0.5/1 | Integrity/public access proven |
| REL-019 | Checksum/integrity | Operator | Prove bytes match | Object bytes/metadata | Hash result | Integrity | Stored checksum + bytes | Diagnostics | Operator | Storage | Phase 0.5+ | Exact-byte/SHA check passes |
| REL-020 | Release metadata public view | Public | Explain terrain/layer provenance | Release metadata | Safe metadata | Provenance | Release domain | Public release API | Public | PUB-010/015 | Phase 1 | Safe source/rights/version visible |
| REL-021 | Mobile dataset quick view | Operator/Admin | Inspect release state on mobile | Dataset/release | Compact view | Presentation | Same domain APIs | Same | Authorized | Series 08 | Future/current partial | Same truth as desktop |

---

# 8. SERIES 07 — OPERATIONS / DIAGNOSTICS / SECURITY TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OPS-001 | System status | Admin/Operator | Summarize operational readiness | Diagnostic results | Status overview | Operations | Diagnostics evidence | Ops API | Authorized | All providers | Phase 0.5 | PASS/WARN/FAIL/UNKNOWN/NOT RUN/PARTIAL distinct |
| OPS-002 | Service-health matrix | Operator | Compare subsystem health | Health checks | Matrix | Operations | Runtime evidence | Diagnostics | Operator | Web/DB/storage | Phase 0.5 | Configured != Healthy |
| OPS-003 | Web app status | Operator | Verify deployment/runtime reachability | Deployment endpoint | Reachability/result | Operations | External check | Diagnostics | Operator | Vercel | Phase 0.5 | Tested environment identified |
| OPS-004 | Map readiness | Operator/Admin | Verify map runtime readiness | App + assets | Readiness | Operations | Browser/runtime evidence | Diagnostics/browser | Authorized | Cesium/release | Phase 0.5/1 | No claim if not run |
| OPS-005 | Database diagnostics | Operator | Validate DB connectivity/runtime identity | Runtime DB config | Structured result | Operations/security | Actual connection | Diagnostics | Operator | Supabase/Postgres | Phase 0.5 | No secret values exposed |
| OPS-006 | PostGIS diagnostics | Operator | Validate spatial DB readiness | DB connection | Extension/query result | Operations/spatial | Actual PostGIS | Diagnostics | Operator | DB | Phase 0.5 | Correct runtime identity/privileges |
| OPS-007 | Private storage lifecycle | Operator | Prove private object operations | Diagnostic object | PUT/HEAD/GET/DELETE evidence | Storage | Cloud storage evidence | Storage diagnostics | Operator/runtime bounded | R2 private | Phase 0.5 | Exact bytes/hash/cleanup |
| OPS-008 | Published operator lifecycle | Operator | Prove separate published write path | Diagnostic object | Lifecycle evidence | Storage/security | Cloud storage evidence | Operator diagnostics | Published operator | R2 published | Phase 0.5 | Operator credential separate |
| OPS-009 | Public published delivery | Public/Operator | Prove anonymous public delivery | Published diagnostic object | HTTP response/bytes | Delivery | Public endpoint | HTTP check | Public read | R2/CDN | Phase 0.5 | Anonymous GET exact bytes |
| OPS-010 | Credential separation | Operator | Prove least privilege | Presence/absence checks | Sanitized evidence | Security | Runtime env configuration | Diagnostics | Operator | Web/runtime/operator env | Phase 0.5 | No owner/published-op cred in web runtime |
| OPS-011 | Environment config | Operator | Inspect safe config presence | Config metadata | Presence/absence | Configuration | Runtime config | Diagnostics | Operator | Deployment | Phase 0.5 | Values not printed |
| OPS-012 | Import diagnostics | Operator/Admin | Inspect import operational state | Batch/job evidence | Diagnostics | Operations | Job/import evidence | Ops API | Authorized | IMP-* | Phase 0.5+ | No private workbook leakage |
| OPS-013 | Processing jobs | Operator | Inspect pipeline jobs | Job states | Job table/detail | Operations | Job system | Job API | Operator | Dataset/import | Current/future | Accurate status |
| OPS-014 | Diagnostic run | Operator | Execute bounded health check | Approved check type | Diagnostic result | Operations | Runtime/provider evidence | Bounded diagnostics API | Operator | Security policy | Phase 0.5+ | No arbitrary SQL/shell/HTTP |
| OPS-015 | Provider acceptance | Operator/Admin | Assess Phase 0.5 provider readiness | Required evidence | PASS/PARTIAL/etc. | Acceptance | Sanitized report/evidence | Ops reporting | Authorized | OPS-003..010 | Phase 0.5 | No PASS while required evidence missing |
| OPS-016 | Release readiness | Operator | Decide release operational readiness | QA/provider state | Readiness state | Operations/release | Release + provider evidence | Ops/Release APIs | Operator | REL-* | Phase 0.5/1 | Mergeable != accepted |
| OPS-017 | Incident Center | Operator/Admin | Track meaningful incidents | Operational events | Incident list | Incident | Incident domain | Incident API | Authorized | Diagnostics | Future/current partial | Error event not automatically Incident |
| OPS-018 | Incident Detail | Operator/Admin | Investigate one incident | Incident ID | Timeline/context | Incident | Incident/audit store | Incident API | Authorized | Logs/audit | Future/current partial | No secret disclosure |
| OPS-019 | Users/RBAC ops view | Admin | Inspect access/security | Users/roles | Security view | RBAC | Auth system | User/RBAC APIs | System Admin | ADM-* | Current foundation | Least privilege |
| OPS-020 | Sessions | Admin/Operator | Inspect sessions/security state | Session metadata | Session view | Auth/security | Session store | Session API | Authorized | Auth | Current/future | No credential/token exposure |
| OPS-021 | Audit | Admin/Auditor | Inspect security actions | Audit events | Audit table | Audit | Audit store | Audit API | Authorized | All mutation domains | Current foundation | Traceable |
| OPS-022 | Object upload integrity | Operator | Verify object upload/readback | Object bytes/hash | Integrity result | Storage | Object store + checksum | Diagnostics | Operator | R2 | Phase 0.5 | Hash matches |
| OPS-023 | Local TLS failure state | Operator | Record client-path limitation accurately | Local failure evidence | Limitation note | Operations | Observed client result | Report | Operator | R2 local path | Phase 0.5 | Local failure != provider failure |
| OPS-024 | Mobile ops view | Operator/Admin | Inspect health on mobile | Ops data | Compact cards | Presentation | Same Ops API | Same | Authorized | Series 08 | Future/current partial | Same status semantics |

---

# 9. SERIES 08 — RESPONSIVE TRACEABILITY

| Feature ID | Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RSP-001 | Public mobile map | Public | Mobile map-first experience | Same public data | Mobile map | Presentation | Same public APIs | Same | Public | Series 01 | Phase 1 | Same facts as desktop; Series 08 phone composition is the visual target with map dominant and touch-first controls |
| RSP-002 | Expanded mobile search | Public | Search without losing map context | Query | Search sheet/results | Presentation | Public search | Same API | Public | PUB-006 | Phase 1 | Keyboard/touch usable |
| RSP-003 | Compact Place card | Public | Small selected state | Place DTO | Compact card | Presentation | Same DTO | Same | Public | PUB-008 | Phase 1 | No semantic loss |
| RSP-004 | Half-screen Place | Public | Intermediate detail | Place DTO | Half sheet | Presentation | Same DTO | Same | Public | PUB-009 | Phase 1 | Map remains contextual |
| RSP-005 | Full-screen Place | Public | Deep mobile detail | Place DTO | Full sheet | Presentation | Same DTO | Same | Public | PUB-009 | Phase 1 | Same source/verification facts |
| RSP-006 | Mobile layer sheet | Public | Manage layers on small screens | Layer registry | Layer sheet | Presentation | Same config | Same | Public | PUB-010 | Phase 1 | No hidden layer authority change |
| RSP-007 | Mobile filters | Public/Admin | Compact filtering | Filters | Filter sheet | Presentation | Same query model | Same | Role-based | Search/table | All | Same result semantics |
| RSP-008 | Mobile clusters | Public | Keep map readable | Markers | Clusters | Presentation | Client | None | Public | PUB-005 | Phase 1 | Performance acceptable |
| RSP-009 | Mobile access/elevation | Public | Show spatial context compactly | Same spatial results | Mobile charts/cards | Presentation | Same analysis | Same API | Public | PUB-012/014 | Conditional | Same assumptions |
| RSP-010 | Admin Place mobile | Editor/Admin | Manage Place on small screen | Place data | Cards/quick edit | Presentation/mutation | Same Place domain | Same API | Authorized | PLC-* | Current/future | No weaker RBAC |
| RSP-011 | Mobile field verification | Reviewer | Field review | Verification data | Mobile workflow | Verification | Same domain | Same API | Reviewer | VER-022 | Phase 2 | Same truth/decision policy |
| RSP-012 | Import summary mobile | Admin | Inspect import state | Batch data | Compact summary | Import | Same domain | Same API | Authorized | IMP-* | Future/current partial | No stage skipping |
| RSP-013 | Dataset quick view | Operator | Inspect release state | Dataset/release | Compact view | Dataset/Release | Same domain | Same API | Operator | REL-021 | Future/current partial | Dataset != Release remains visible |
| RSP-014 | Ops health mobile | Operator/Admin | View system health | Ops state | Compact health cards | Operations | Same diagnostics | Same API | Authorized | OPS-024 | Phase 0.5+ | Same PASS/WARN/etc. semantics |
| RSP-015 | Tablet side panel | Public/Admin | Adapt desktop drawer | Same data | Side panel | Presentation | Same domain | Same API | Same | Multiple | All | Layout changes only; use Series 08 tablet proportions and preserve map/context |
| RSP-016 | Mobile bottom sheet | Public/Admin | Adapt drawer to mobile | Same data | Bottom sheet | Presentation | Same domain | Same API | Same | Multiple | All | No truth change; support compact/half/full states where the canonical flow requires them |
| RSP-017 | Mobile card conversion | Admin | Replace dense table | Same rows | Cards | Presentation | Same domain | Same API | Same | DS-005 | All | All critical fields/status accessible |

---

# 10. SERIES 09 — FUTURE PROPERTY TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PRP-001 | Property Registry | Admin | Register Property entities | Property identity/provenance | Property record | Property | Future Property domain | Future service | Authorized | PostGIS/source | Phase 3 | Property distinct from Parcel/Listing |
| PRP-002 | Property map | Admin/Public future | Spatially locate Property | Safe Property geometry | Map layer | Property/spatial | PostGIS | Future Property API | Role-based | Cesium | Phase 3 | Geometry authority explicit |
| PRP-003 | Create Property | Admin | Create governed Property | Input/source | Property draft | Property | Future domain | Mutation service | Authorized | Source/verification | Phase 3 | No automatic legal certainty |
| PRP-004 | Property detail | Admin/Public future | Inspect Property | Property ID | Detail | Property | Property domain | Future API | Role-based | Multiple | Phase 3 | Provenance/uncertainty visible |
| PRP-005 | Parcel association | Admin/Reviewer | Link Parcel to Property | Parcel ref/geometry | Association | Parcel | Approved parcel source | Future service | Authorized | Source/verification | Phase 3 | Parcel != Property |
| PRP-006 | Parcel geometry comparison | Reviewer | Compare claimed/official/candidate geometry | Multiple geometries | Comparison | Spatial verification | Approved sources/PostGIS | Future spatial API | Reviewer | Series 03 | Phase 3 | LAND polygon not auto-official |
| PRP-007 | Property facts | Admin | Store sourced facts | Fact + source | Fact record | PropertyFact | Property/source domain | Future service | Authorized | Provenance | Phase 3 | Conflicting facts may coexist |
| PRP-008 | Fact provenance | Admin/Public safe | Explain source of Property fact | Source refs | Provenance view | Provenance | Source Registry | Future API | Role-based | PRP-007 | Phase 3 | Seller Claim != Verified Fact |
| PRP-009 | Listing association | Admin | Link listing to Property | Listing data | Listing relation | Listing | Listing domain | Future service | Authorized | Property | Phase 3 | Listing != Property |
| PRP-010 | Asking price | Admin/Public future | Show listing ask | Listing price | Asking price | Listing | Listing source | Future API | Role-based | PRP-009 | Phase 3 | Asking Price != Market Value |
| PRP-011 | Access intelligence | Admin/Public future | Explain access | Property geometry + roads | Access metrics | Derived intelligence | PostGIS + road release | Future spatial service | Role-based | Phase 2 foundation | Phase 4 | Distance/network semantics explicit |
| PRP-012 | Terrain intelligence | Admin/Public future | Explain terrain context | Property geometry + terrain | Terrain metrics | Derived intelligence | Release + algorithms | Future spatial service | Role-based | Phase 2 foundation | Phase 4 | Deterministic |
| PRP-013 | Slope/aspect | Admin/Public future | Explain terrain orientation | Terrain release | Metrics | Derived intelligence | Release + algorithm | Future service | Role-based | PRP-012 | Phase 4 | Aspect != View |
| PRP-014 | Viewshed | Admin/Public future | Estimate visibility | Geometry + terrain + assumptions | Viewshed result | Derived intelligence | Release + algorithm | Future service | Role-based | Phase 2 | Phase 4 | Not guaranteed real-world view |
| PRP-015 | Nearby context | Admin/Public future | Explain surrounding Places/infrastructure | Property geometry | Nearby result | Spatial query | PostGIS | Future service | Role-based | Place/roads | Phase 4 | Distance semantics explicit |
| PRP-016 | Infrastructure context | Admin/Public future | Explain nearby infrastructure | Approved infra data | Context | Spatial | Approved datasets | Future service | Role-based | Dataset/Release | Phase 4 | Source/freshness shown |
| PRP-017 | Domain confidence | Admin/Public future | Express uncertainty by dimension | Evidence per domain | Confidence states | Trust | Future policy | Future service | Role-based | Verification | Phase 4 | No magic overall score |
| PRP-018 | Legal/planning info | Admin/Public future | Present sourced legal/planning facts | Approved source | Legal/planning fields | Property | Approved authority only | Future API | Role-based | Provenance | Phase 3/4 | UNKNOWN remains Unknown |
| PRP-019 | Price Evidence | Admin | Register comparable/price evidence | Evidence | Price evidence record | PriceEvidence | Future domain | Future service | Authorized | Source | Phase 4 | Evidence != valuation |
| PRP-020 | Comparables | Admin/Public future | Compare relevant properties/evidence | Property + evidence | Comparable analysis | Intelligence | Deterministic policy/data | Future service | Role-based | PRP-019 | Phase 4 | Method/version explainable |
| PRP-021 | Property Intelligence summary | Admin/Public future | Summarize deterministic signals | Multiple analyses | Summary | Intelligence | Derived services | Future API | Role-based | PRP-011..020 | Phase 4 | No unsupported certainty |
| PRP-022 | Future AI entry | Admin/Public future | Ask grounded questions | Safe Property context | AI explanation | AI | LAND safe tools | AI tools | Role-based | Series 10 | Phase 4 | AI read-only by default |

---

# 11. SERIES 10 — FUTURE AI TRACEABILITY

| Feature ID | Screen / Surface | Actor | Purpose | Input | Output | Domain / State | Source of Truth | Service / API | Permission | Dependencies | Phase | Acceptance |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AI-001 | Public LAND Advisor | Public | Ask grounded LAND questions | User query | Answer | AI explanation | LAND data remains authority | Typed AI gateway | Public-safe | Place/Property future | Phase 4 | Grounded answer only |
| AI-002 | Place query | Public | Ask about Place | Place/query | Place answer | AI read | Place domain | Typed Place tool | Public-safe | PLC/PUB | Phase 4 | No private fields |
| AI-003 | Nearby search | Public | Ask for nearby Places | Query/location | Ranked places | AI + spatial read | PostGIS/public Place data | Typed spatial search tool | Public | PUB-019 | Phase 4 | Distance semantics preserved |
| AI-004 | Terrain/view explanation | Public | Explain deterministic terrain results | Analysis results | Explanation | AI explanation | Spatial service output | Typed analysis tool | Public | Phase 2 | Phase 4 | AI does not invent metrics |
| AI-005 | Property comparison | Public/Admin future | Explain Property differences | Approved Property facts/analysis | Explanation | AI explanation | Property domain | Typed Property tools | Role-based | Series 09 | Phase 4 | Asking price != value |
| AI-006 | Stale/conflicting data explanation | Admin/Public safe | Explain uncertainty/conflict | Provenance/conflict data | Explanation | AI explanation | Source/verification domains | Typed provenance tools | Role-based | VER/PRP | Phase 4 | AI cannot resolve authority itself |
| AI-007 | Legal/price-safe answer | Public/Admin | Explain without inventing legal/valuation claims | Approved source/evidence | Bounded answer | AI policy | Approved data | Typed safe tools | Role-based | Property/source | Phase 4 | Unknown remains Unknown |
| AI-008 | Admin Assistant | Admin | Explain operational/domain workflows | Admin-safe context | Explanation | AI read | LAND admin data | Typed admin tools | Admin | Multiple | Phase 4 | No broad DB access |
| AI-009 | Import explanation | Admin | Explain import validation/result | Import batch safe view | Explanation | AI read | Import domain | Typed import tool | Admin | IMP-* | Phase 4 | Cannot commit/verify unless later explicitly authorized |
| AI-010 | Release QA explanation | Operator/Admin | Explain QA/release metadata | Release QA data | Explanation | AI read | Release domain | Typed release tool | Authorized | REL-* | Phase 4 | Cannot publish |
| AI-011 | Stale Property review support | Reviewer/Admin | Explain review reasons | Property/verification data | Advisory | AI read | Property/verification | Typed tools | Authorized | PRP/VER | Phase 4 | Cannot approve |
| AI-012 | Provenance/tool activity | Admin | Show what AI read/did | Tool-call metadata | Trace view | AI audit | AI gateway/audit | AI audit API | Admin | AI tools | Phase 4 | Transparent tool usage |
| AI-013 | Provider/model registry | AI Admin | Configure approved providers/models | Provider metadata | Registry | AI config | AI config store | AI config API | AI Admin | Security | Phase 4 | No raw secret display |
| AI-014 | Persona/tool registry | AI Admin | Define bounded agent roles/tools | Persona/tool config | Registry | AI policy | AI config | AI config API | AI Admin | Typed tools | Phase 4 | Least authority |
| AI-015 | Policy/prompt versions | AI Admin | Version AI behavior | Policy/prompt content | Versioned config | AI config | AI config store | Config service | AI Admin | Audit | Phase 4 | Version traceable |
| AI-016 | AI config release | AI Admin | Promote approved AI configuration | Reviewed config | Config release | AI release | AI config release domain | Release service | AI Admin | Policy/evals | Phase 4 | Versioned, auditable |
| AI-017 | Policy violations | AI Admin/Auditor | Inspect blocked/unsafe attempts | Audit events | Violation view | Security/audit | AI audit | Audit API | Authorized | AI gateway | Phase 4 | No secret payload leakage |
| AI-018 | Kill switch | AI Admin/Operator | Disable AI safely | Admin action | AI disabled | AI operational state | Config/feature flag | Control service | Highly privileged | Ops/security | Phase 4 | Core LAND remains functional |
| AI-019 | Usage/cost diagnostics | AI Admin | Monitor AI utilization | Usage data | Metrics | Operations | Provider/gateway metrics | AI ops API | Authorized | Provider registry | Phase 4 | No sensitive prompt leakage by default |
| AI-020 | Map fly-to | Public/Admin | Let AI focus map | Approved Place/geometry ref | UI action | Presentation only | Existing map state | Client action | Role-based | Cesium | Phase 4 | No data mutation |
| AI-021 | Highlight/show layer | Public/Admin | Let AI reveal existing approved layer | Approved layer ID | UI state | Presentation only | Layer registry | Client action | Role-based | PUB-010 | Phase 4 | Cannot invent/unapproved layer |
| AI-022 | Direct SQL | N/A | Forbidden default | N/A | N/A | Security | N/A | None | Forbidden | Security | All | Must not exist by default |
| AI-023 | Arbitrary HTTP/browser | N/A | Forbidden default | N/A | N/A | Security | N/A | None | Forbidden | Security | All | Must not exist by default |
| AI-024 | Secret access | N/A | Forbidden | N/A | N/A | Security | N/A | None | Forbidden | Security | All | Must not exist |
| AI-025 | Verify/Publish/Move geometry | N/A | Forbidden early authority | N/A | N/A | Security/domain authority | N/A | None | Forbidden by default | Verification/publication | All early phases | AI remains non-authoritative |

---

# 12. CURRENT IMPLEMENTATION DELTA + VISUAL CONVERGENCE OVERLAY

This section prevents future coding agents from confusing existing functionality with canonical visual completion. It is a reviewed implementation baseline, not a replacement for live repository inspection.

Reviewed post-spec baseline: `97d5e6ebc39ee72f3ea6b8a76f441629e96f1fbc` plus owner-observed deployed UI on 2026-09-11.

| Surface | Current implementation reality | Maturity at reviewed baseline | Canonical visual target | Coding consequence |
|---|---|---|---|---|
| `/` public landing | Minimal text + link landing page | FUNCTIONALLY PRESENT / NOT VISUALLY CONVERGED | Series 00 language; any future homepage spec must be explicit | Do not preserve the current sparse page merely because it exists |
| `/map` | Phase 0 public explorer with header + intro + boxed Cesium viewer; neutral grid appears when no eligible terrain is resolved | FUNCTIONALLY PRESENT / NOT VISUALLY CONVERGED | Series 01 v2 + Series 00 + Series 08 | Phase 1 must transform it into a map-first spatial product while preserving honest degraded/data states |
| `/admin/login` | LAND-owned email/password login through application API | FUNCTIONALLY PRESENT / NOT VISUALLY CONVERGED | Series 00 + Admin product language | Improve presentation without replacing LAND auth with Supabase Auth |
| Admin shell | Existing sidebar and protected routes cover a subset of canonical areas | FUNCTIONALLY PRESENT / PARTIAL IA / NOT VISUALLY CONVERGED | Series 02 v2 + Series 00 | Missing visual/IA areas must not be claimed complete; converge navigation only when corresponding routes/domain capability are authorized |
| Place Admin | Existing Place domain/routes/workflows | FUNCTIONALLY PRESENT foundation | Series 04 + Series 02 + Series 00 | Preserve Place/source/verification/publication semantics while visually converging |
| Excel Import | Existing controlled import workflow | FUNCTIONALLY PRESENT foundation | Series 05 + Series 02 + Series 00 | Preserve Upload→Inspect→Map→Validate→Stage→Review→Commit semantics; visual polish cannot skip stages |
| Dataset/Release | Existing registry/release foundation | FUNCTIONALLY PRESENT foundation | Series 06 + Series 02 + Series 00 | Preserve Dataset != Release and immutable published releases while visually converging |
| Diagnostics/Ops | Existing diagnostics foundation and Phase 0.5 provider evidence | FUNCTIONALLY PRESENT / PROVIDER READY for accepted gates | Series 07 + Series 02 + Series 00 | Do not display configured state as health evidence; visual status must come from actual diagnostics |

## 12.1 Authentication/environment traceability

LAND Admin identity is application-owned:

```text
/admin/login
→ /api/auth/login
→ admin_users / admin_user_roles / admin_sessions
→ scrypt password verification
```

This is **not Supabase Auth (`auth.users`)**. Supabase currently hosts the managed LAND PostgreSQL/PostGIS database, but creating a Supabase Auth user does not create a LAND Admin.

Local Docker/PostGIS and the deployed managed LAND database are separate environments. A local `admin_users` row is not automatically a deployed Admin, and a deployed Admin is not automatically present in local Docker. The deployed Vercel application authenticates against whichever LAND database its runtime `DATABASE_URL` selects.

Do not change this identity boundary without an approved architecture decision.

## 12.2 Canonical visual-convergence overlay

| Board | Visual qualities future code must preserve | Acceptance evidence |
|---|---|---|
| 00 — Design System | Light/white working surfaces, deep-navy navigation, teal primary actions, compact data density, consistent Inter-style typography, restrained borders/radii/shadows, coherent buttons/forms/tables/cards/drawers/status families | Shared tokens/components + browser screenshots across representative public/admin surfaces |
| 01 v2 — Public Map & 3D | Map dominates the product; left/nav/search and floating spatial controls are integrated around the scene; cards/drawers/layers preserve map context; selected markers and status semantics are visually obvious | Desktop reference viewport screenshot + selected/place/layer/degraded states compared side-by-side |
| 02 v2 — Admin | Stable deep-navy global sidebar, compact top utility/search bar, spatial command-center layout, dense operational cards/tables, consistent module navigation | Admin overview + representative domain screen browser comparison |
| 03 v2 — Verification | Spatial evidence comparison is primary; declared/observed/verified remain visually distinct; queue/evidence/history/action hierarchy is explicit | Queue + review workspace + geometry-state screenshot comparison |
| 04 — Place | List/map/detail/edit remain one coherent spatial workflow with media/source/verification/publication visible without collapsing semantics | Place list + selected/detail/edit screenshot comparison |
| 05 — Import | Seven-step workflow remains visually legible; dense tables, validation states, map QA and review/commit hierarchy match the board | At least one valid and one warning/error import state observed |
| 06 — Dataset/Release | Dataset/release lifecycle, QA, immutable publication and spatial preview read as an operator workflow, not generic file storage | Dataset list/detail/release/QA browser comparison |
| 07 — Ops/Security | Health/readiness/evidence states are compact and diagnostic; PASS/WARN/FAIL/UNKNOWN/PARTIAL remain distinct and never decorative | Representative diagnostics/provider/security states observed |
| 08 — Responsive | Same truth, transformed layout: drawer→panel→bottom sheet; table→cards; map remains primary on public mobile; touch targets and compact states are intentional | Desktop/tablet/mobile screenshots at fixed acceptance viewports |
| 09 — Property | Future only until Phase 3/4; preserve dense spatial registry/intelligence visual language without inventing legal/market truth | Future phase acceptance only |
| 10 — AI | Future only until Phase 4; AI visual polish must still reveal source/tool/policy boundaries and remain subordinate to LAND authority | Future phase acceptance only |

## 12.3 Phase 1 slice-to-feature traceability

The approved Phase 1 specification owns scope. Use this mapping to stop visual boards from pulling Phase 2+ concepts into the active implementation.

| Slice | Primary Feature IDs | Required visible outcome | Explicitly not included |
|---|---|---|---|
| 1A — Public 3D shell | PUB-001, PUB-002, PUB-003, PUB-022, DS-012/014/016 | Map-first shell, deterministic regional camera, reset/home, initialization/degraded states, truthful fallback | Real terrain/imagery/roads expansion, new Place DTO/search, terrain analytics |
| 1B — Published terrain | PUB-001/010, REL-003/012/013/016/018/019/020 | Eligible published terrain resolves through current Release authority and renders honestly | Elevation profile, terrain inspector, slope analysis |
| 1C — Imagery + roads | PUB-010, PUB-012 minimal, REL-004/005/012/013/016/018/020 | Approved imagery/base context and mapped roads integrate without unsupported access/safety claims | Imagery comparison, routing/network analytics |
| 1D — Published Places | PUB-004, PUB-005, DS-018/019 | Public-safe published Place markers and clustering | Property markers, private/draft Place data |
| 1E — Search / select / fly-to / detail | PUB-006/007/008/009/021 | Search→result→select→fly-to→card/drawer→deep link | Advanced nearby analysis, Place comparison |
| 1F — Layers / source / verification | PUB-010/017/018, REL-020 | Layer controls and safe source/verification/release explanation | Phase 2 deterministic terrain/access intelligence |
| 1G — Responsive / a11y / performance | RSP-001..008, RSP-015/016/017 + applicable DS states | Series 08 transformations, keyboard/focus/touch/reduced-motion, performance hardening | Semantic simplification or hidden truth |
| 1H — Final acceptance | OPS-004/016 + visual acceptance rules | Production browser/provider validation, screenshot convergence, no private leakage, degraded-state proof | New product scope |

---

# 13. CROSS-SERIES FEATURE LINKS

| Link ID | From | To | Meaning |
|---|---|---|---|
| LINK-001 | IMP-014 Commit | PLC-005/006 Place | Import commit may create/update governed Place state |
| LINK-002 | PLC-007 Candidate Geometry | VER-006 Candidate | Place geometry edit enters verification candidate flow |
| LINK-003 | VER-012 Accept Candidate | PLC geometry/history | Verified spatial state updates through controlled history |
| LINK-004 | PLC-014 Publication | PUB-004/006/009 | Published safe Place becomes available to public map/search/detail |
| LINK-005 | REL-016 Publish Release | PUB-001/010 | Published terrain/imagery/road release becomes viewer input |
| LINK-006 | REL-018 Public Delivery | PUB-001 | Cesium loads approved immutable public assets |
| LINK-007 | OPS-007/008/009 | REL-018 | Provider acceptance proves storage/delivery path works |
| LINK-008 | VER-009 Source Authority | PLC-012 Source linkage | Place trust presentation depends on provenance |
| LINK-009 | VER-019 Release Linkage | REL-* | Verification/derived results can depend on explicit release version |
| LINK-010 | RSP-* | PUB/ADM/VER/PLC/IMP/REL/OPS | Responsive changes representation, not truth |
| LINK-011 | PRP-011..020 | Phase 2 spatial services | Property Intelligence reuses deterministic LAND spatial foundation |
| LINK-012 | AI-* | PLC/VER/REL/PRP/OPS | AI reads/explains governed data through typed tools |
| LINK-013 | AI-020/021 | PUB-* | AI map actions are UI-only and non-authoritative |
| LINK-014 | ADM-004 Unified Review | VER/IMP/REL | Global review center routes to authoritative domain workflow |
| LINK-015 | DS-002/003/004 | All domain screens | Verification/source/publication badges stay distinct everywhere |

---

# 14. END-TO-END TRACEABILITY CHAINS

## 14.1 Excel to Public Place

```text
IMP-002 Upload
→ IMP-003 Inspect
→ IMP-005 Map
→ IMP-007 Validate
→ IMP-012 Stage
→ IMP-013 Review
→ IMP-014 Commit
→ PLC-005/006 Place
├──→ VER-* Verification / trust lifecycle
│     (independent; may remain UNKNOWN and may change before or after publication)
└──→ PLC-014 Publication
      → PUB-006 Search
      → PUB-004 Marker
      → PUB-009 Place Drawer
```

`VER-*` may enrich or change trust state independently and does not need to complete before publication. Publication and public projection remain subject to their independent source, eligibility and public-safety gates.

Critical semantic stops:

```text
IMP-014 Commit
does not imply
VER-012 Verified

VER-012 Verified
does not imply
PLC-014 Published

PLC-014 Published
does not imply
VER-012 Verified
```

## 14.2 Terrain Source to Cesium

```text
REL-007 Source Artifact
→ REL-010 Raw
→ REL-011 Normalized
→ REL-012 Derived
→ REL-013 QA
→ REL-015 Release Candidate
→ REL-016 Published Release
→ REL-018 Public Delivery
→ PUB-001 Cesium Map
→ PUB-015 Terrain Inspector
```

## 14.3 Candidate Geometry to Verified Geometry

```text
PLC-007 / VER-007
→ VER-006 Candidate
→ VER-008 Evidence
→ VER-010 Deterministic Checks
→ VER-011 Checklist
→ VER-012 Reviewer Decision
→ VER-015 History
```

## 14.4 Operations Acceptance

```text
OPS-003 Web
+ OPS-005 DB
+ OPS-006 PostGIS
+ OPS-007 Private Storage
+ OPS-008 Published Operator
+ OPS-009 Public Delivery
+ OPS-010 Credential Separation
+ OPS-022 Integrity
→ OPS-015 Provider Acceptance
```

If any required evidence is unproven:

```text
PARTIAL PASS
```

not PASS.

## 14.5 Future Property Intelligence

```text
PRP-001 Registry
→ PRP-005 Parcel association
→ PRP-007 Facts
→ PRP-008 Provenance
→ VER-* Verification
→ PRP-011 Access
→ PRP-012 Terrain
→ PRP-014 Viewshed
→ PRP-019 Price Evidence
→ PRP-020 Comparables
→ PRP-021 Intelligence Summary
→ AI-005 Explanation
```

---

# 15. SCREEN-TO-DOMAIN MATRIX

| Screen | Primary domain | Supporting domains |
|---|---|---|
| Public 3D Map | Public spatial presentation | Place, Dataset/Release, Verification |
| Public Search | Place query | Publication |
| Place Drawer | Place | Source, Verification, Media |
| Admin Command Center | Aggregated read model | Place, Verification, Ops |
| Place List/Detail | Place | Source, Verification, Publication |
| Excel Import | Import | Place, Source, Validation, Storage |
| Verification Workspace | Verification | Geometry history, Evidence, Source |
| Dataset Workspace | Dataset/Release | Source, Processing, Storage |
| Operations | Operations/Security | Deployment, DB, Storage, Auth |
| Mobile Public | Presentation | Same public domains |
| Mobile Admin | Presentation | Same admin domains |
| Property Registry | Future Property | Source, Verification, Spatial |
| AI Advisor | Future AI | Typed read-only LAND domains |

---

# 16. ACTION CLASSIFICATION MATRIX

| Action | Class | Authoritative mutation? | Typical owner |
|---|---|---:|---|
| Pan/zoom/fly-to | Presentation | No | Client |
| Toggle layer | Presentation | No | Client |
| Open drawer | Presentation | No | Client |
| Search | Query | No | Read service |
| Edit Place text | Draft/domain mutation | Yes | Place service |
| Move Place marker in editor | Candidate mutation | Candidate only | Geometry service |
| Accept candidate | Verification decision | Yes | Verification service |
| Publish Place | Publication decision | Yes | Publication service |
| Upload Excel | Ingestion | No domain mutation yet | Import/storage |
| Commit import | Domain mutation | Yes | Import application service |
| Register Dataset | Dataset mutation | Yes | Dataset service |
| Publish Release | Release publication | Yes/immutable result | Release operator |
| Run health diagnostic | Operational evidence | No domain mutation | Diagnostics |
| AI fly-to | Presentation | No | Client |
| AI verify | Forbidden default | N/A | None |
| AI publish | Forbidden default | N/A | None |
| AI arbitrary SQL | Forbidden | N/A | None |

---

# 17. SOURCE-OF-TRUTH QUICK MATRIX

| UI concept | Must ultimately come from |
|---|---|
| Place name/category | Place domain |
| Place coordinates | PostGIS / geometry history |
| Verified badge | Verification domain |
| Official/Seller/LAND Observed badge | Source Registry |
| Published badge | Publication state |
| Terrain | Published Dataset Release |
| Imagery | Approved imagery release/source |
| Road geometry | Approved road release/PostGIS |
| Elevation/slope | Deterministic spatial service tied to release |
| Viewshed | Deterministic analysis + assumptions |
| Public asset URL | Published release/public delivery contract |
| Health PASS | Actual diagnostic evidence |
| User role | Auth/RBAC |
| AI answer | Explanation only; facts still come from LAND domains |
| Sample number in board | No authority |

---

# 18. PHASE TRACEABILITY

| Phase | In-scope families | Not implied by visuals |
|---|---|---|
| 0A | DS, REL foundation, OPS foundation | Property, AI |
| 0B | PLC, VER foundation, ADM | Full Digital Twin |
| 0C | IMP | Auto publish/verify |
| 0.5 | OPS provider acceptance | New Phase 1 UX expansion |
| 1 | PUB core + supporting PLC/REL/RSP; active implementation begins with Slice 1A | Property, AI, imagery comparison, elevation profile, terrain inspector, advanced route/nearby/place comparison, full viewshed |
| 2 | VER expansion + deterministic terrain/access/view intelligence | Automatic valuation |
| 3 | PRP Registry | Full AI/property intelligence |
| 4 | PRP Intelligence + AI | AI authority over verification/publication |
| 5 | Brokerage future | No implementation without separate spec/compliance |

---

# 19. CRITICAL NEGATIVE TRACEABILITY

These visual misunderstandings are explicitly forbidden:

| Visual impression | Correct interpretation |
|---|---|
| Green Published badge looks trusted | Published != Verified |
| Marker is draggable | Drag creates Candidate, not authoritative geometry |
| External map looks accurate | External map != LAND verified geometry |
| Dataset file uploaded | Upload != Published Release |
| Release Candidate visible | RC != Published Release |
| Excel row passes validation | Valid != Verified != Published |
| Seller parcel polygon exists | Seller claim != official cadastral boundary |
| Road line exists | Road mapping != safety/passability |
| Slope/aspect looks scenic | Aspect != View |
| Viewshed polygon exists | Viewshed != guaranteed real-world visibility |
| AI says a fact confidently | AI != authority |
| Service credentials are configured | Configured != Healthy/PASS |
| Mobile UI has fewer fields | Hidden detail must not change underlying truth |
| High-resolution 3D looks precise | Rendered detail != survey/field accuracy |

---

# 20. ACCEPTANCE TRACEABILITY CHECKLIST

Before declaring a visual feature complete, verify:

```text
[ ] feature belongs to current approved phase and active slice
[ ] canonical visual board + exact target surface/state identified
[ ] current implementation maturity identified (contract/function/visual/browser/data/provider/accuracy)
[ ] architecture/repository contracts inspected
[ ] domain owner identified
[ ] source-of-truth identified
[ ] state transition identified
[ ] permission identified
[ ] API/application-service boundary identified
[ ] private/public boundary checked
[ ] verification/publication semantics preserved
[ ] spatial assumptions documented where relevant
[ ] error/unknown/degraded states handled
[ ] responsive behavior preserves same truth
[ ] accessibility checked
[ ] functional test exists where appropriate
[ ] domain/state test exists where appropriate
[ ] canonical viewport defined for visual work
[ ] browser screenshot captured for the intended state
[ ] side-by-side board comparison performed
[ ] composition/hierarchy/proportions visually converge
[ ] typography/palette/density/surfaces visually converge
[ ] controls/cards/drawers/status states use Series 00 language
[ ] material visual deviations are documented and owner-visible
[ ] no sample visual data promoted to production truth
```

---

# 21. CODEX IMPLEMENTATION LOOKUP RULE

When Codex receives a screenshot/board-driven task, it should resolve the work in this order:

```text
1. Locate the canonical board element and target viewport/state.
2. Locate Feature ID in this matrix.
3. Read the corresponding system rules in
   TA_XUA_LAND_MASTER_PRODUCT_SYSTEM_BLUEPRINT.md.
4. Confirm approved phase + active slice.
5. Inspect current repository contracts and current implementation maturity.
6. Identify domain/service owner and source-of-truth.
7. Implement only the permitted behavior, reusing shared Series 00 tokens/components.
8. Test semantics and authority boundaries.
9. Render the real route/state in the browser.
10. Capture the target screenshot and compare side-by-side with the board.
11. Fix material visual discrepancies; repeat until converged or document a justified blocker/deviation.
12. Report separately:
    - built,
    - functionally tested,
    - observed in browser,
    - visually converged,
    - data/provider/accuracy verified,
    - still unknown/deferred.
```

---

# 22. FINAL TRACEABILITY RULE

Every significant visual element should have an explainable chain:

```text
BOARD
→ FEATURE ID
→ SCREEN / TARGET STATE
→ ACTOR
→ PURPOSE
→ DOMAIN
→ DATA
→ STATE
→ AUTHORITY
→ SERVICE
→ PERMISSION
→ DEPENDENCY
→ PHASE / ACTIVE SLICE
→ FUNCTIONAL TEST
→ OBSERVED BROWSER OUTPUT
→ SIDE-BY-SIDE VISUAL COMPARISON
→ SEMANTIC + VISUAL ACCEPTANCE
```

If that chain cannot be explained, the implementation is not ready to be treated as a canonical LAND feature.

**The visual boards are not schema/factual templates; they are canonical visual acceptance targets.**

High visual fidelity never authorizes fabricated data or future features, and semantic correctness never excuses a visibly non-canonical interface. A LAND screen is complete only when its authority/behavior is correct **and** its observed presentation has converged to the approved visual language for the relevant phase.
