# TÀ XÙA LAND — OPEN DECISIONS, RISKS & DEFERRED ITEMS

Handoff version: 1.0
Snapshot: 2026-09-11
Purpose: preserve decisions already made, identify what is still open, and stop future sessions from silently re-deciding architecture.

---

# 0. HOW TO USE THIS FILE

Every new ChatGPT/Codex/developer session should classify questions into one of four states before changing architecture or implementation:

```text
DECIDED
OPEN
DEFERRED
KNOWN LIMITATION
```

Definitions:

**DECIDED**
A product/architecture decision has already been made. Do not redesign it casually.

**OPEN**
A decision is genuinely unresolved and must be closed before or during the relevant phase.

**DEFERRED**
A valid future question, but intentionally not decided yet because the required product/data/legal maturity does not exist.

**KNOWN LIMITATION**
A current constraint or incomplete validation that should be preserved and handled, not misclassified as a new architecture problem.

If a new requirement conflicts with a DECIDED item:

1. identify the conflict;
2. inspect current repository/ADRs;
3. propose options;
4. explain migration/security/data impact;
5. request explicit approval before changing the decision.

---

# 1. DECIDED — PRODUCT IDENTITY

## D-001 — LAND is a spatial authority

Status:

```text
DECIDED
```

TÀ XÙA LAND is an independent geospatial/spatial-intelligence platform.

It is not primarily:

- a tourism CMS;
- a booking website;
- a property listing portal;
- a generic map wrapper;
- an AI chatbot.

Long-term progression:

```text
Digital Twin
-> Spatial Intelligence
-> Property Registry
-> Property Intelligence
-> Brokerage
```

Do not reverse this order without explicit product review.

---

# 2. DECIDED — ECOSYSTEM BOUNDARY

## D-002 — LAND / BIKER / TRIP remain separate products

Status:

```text
DECIDED
```

Canonical responsibility:

```text
LAND  = Spatial Authority
BIKER = Mobility / Live Local
TRIP  = Travel Commerce / Itinerary
```

Integration is allowed through narrow public-safe contracts.

Do not merge databases or share service-role credentials for convenience.

---

# 3. DECIDED — AUTHORITATIVE DATA STORE

## D-003 — PostgreSQL/PostGIS is authoritative

Status:

```text
DECIDED
```

PostGIS is the authoritative spatial datastore.

Cesium is a geospatial client.

Object storage holds artifacts.

Neither Cesium nor object storage becomes the domain source of truth.

---

# 4. DECIDED — 3D CLIENT

## D-004 — CesiumJS is the primary 3D map client

Status:

```text
DECIDED
```

Use CesiumJS for:

- 3D terrain;
- camera;
- 3D Tiles;
- spatial overlays;
- regional map experience.

Do not replace Cesium simply because another visualization library is easier for one feature.

A replacement requires an architecture-level decision.

---

# 5. DECIDED — GIS PROCESSING

## D-005 — Spatial processing must be reproducible

Status:

```text
DECIDED
```

Preferred GIS ecosystem includes:

- GDAL;
- PROJ;
- Rasterio;
- GeoPandas;
- Shapely;
- Pyogrio;
- PDAL when LiDAR is relevant.

Regional Digital Twin data should be rebuildable from source artifacts and processing pipelines.

Do not make hand-edited 3D assets the only authoritative representation of the region.

---

# 6. DECIDED — CRS

## D-006 — EPSG:4326 is canonical interchange geometry

Status:

```text
DECIDED
```

Application interchange geometry uses EPSG:4326.

Longitude/latitude order must be explicit.

Metric calculations must not treat degrees as meters.

Projected CRS may be used inside GIS processing when appropriate.

Vertical datum/reference must be explicit where relevant.

---

# 7. DECIDED — SOURCE / PROVENANCE

## D-007 — Source and provenance are first-class

Status:

```text
DECIDED
```

Important spatial facts/layers must be traceable to:

- source/provider;
- rights/license;
- timestamps;
- verification;
- CRS;
- accuracy/uncertainty where known;
- version;
- public/private classification;
- processing/release lineage where applicable.

Do not hide uncertainty or origin merely to simplify UI.

---

# 8. DECIDED — SOURCE AUTHORITY != VERIFICATION

## D-008 — Source authority and verification are separate dimensions

Status:

```text
DECIDED
```

Example valid combinations:

```text
OFFICIAL + REVIEW_REQUIRED
LAND_OBSERVED + VERIFIED
PARTNER + DECLARED
SELLER + DECLARED
THIRD_PARTY + UNKNOWN
```

Do not collapse source authority into verification.

---

# 9. DECIDED — SPATIAL TRUTH MODEL

## D-009 — Declared != Observed != Verified

Status:

```text
DECIDED
```

Canonical model:

```text
DECLARED
!=
OBSERVED
!=
VERIFIED
```

Declared:
a claim.

Observed:
evidence/measurement/observation.

Verified:
authorized verification result.

Observed does not automatically become Verified.

External map data does not automatically become Verified.

---

# 10. DECIDED — CANDIDATE GEOMETRY

## D-010 — Editing creates candidate geometry before authority changes

Status:

```text
DECIDED
```

Dragging/clicking/editing geometry should not silently overwrite authoritative spatial truth.

Use:

```text
Current
-> Candidate
-> Review
-> Verification/approval
```

where the domain requires verification.

---

# 11. DECIDED — GEOMETRY HISTORY

## D-011 — Geometry history is preserved

Status:

```text
DECIDED
```

Do not destructively overwrite important spatial history.

Old versions may become:

- superseded;
- expired;
- historical.

But they remain traceable.

---

# 12. DECIDED — IMPORT

## D-012 — Excel is an input format, not the database schema

Status:

```text
DECIDED
```

Canonical flow:

```text
Upload
-> Inspect
-> Map
-> Validate
-> Stage
-> Review
-> Commit
```

Commit does not imply:

- Verify;
- Publish.

Invalid coordinates do not get silently AI-corrected.

---

# 13. DECIDED — STORAGE LIFECYCLE

## D-013 — Private processing and published assets are separate

Status:

```text
DECIDED
```

Conceptual data lifecycle:

```text
SOURCE
-> RAW
-> NORMALIZED
-> DERIVED
-> QA
-> RELEASE CANDIDATE
-> PUBLISHED RELEASE
-> PUBLIC DELIVERY
```

Private/import storage and published delivery storage have different privilege requirements.

---

# 14. DECIDED — PUBLISHED RELEASE IMMUTABILITY

## D-014 — Published releases are immutable

Status:

```text
DECIDED
```

Update strategy:

```text
create successor release
```

Do not normally overwrite published release bytes in place.

---

# 15. DECIDED — RUNTIME / OPERATOR CREDENTIAL SEPARATION

## D-015 — Web runtime must not have release-operator authority

Status:

```text
DECIDED
```

Web runtime may have:

- application DB runtime role;
- private object-storage runtime credentials where required;
- public asset base URL.

Web runtime must not have:

- DB owner/bootstrap credential;
- published release operator credential;
- provider master credential.

This is a hard security boundary.

---

# 16. DECIDED — ADMIN IA

## D-016 — Series 02 v2 is global Admin IA authority

Status:

```text
DECIDED
```

Canonical high-level Admin sections:

- Tổng quan;
- Địa điểm;
- Excel import;
- Xác minh không gian;
- Nguồn dữ liệu;
- Dataset & release;
- Media;
- Người dùng;
- Nhật ký;
- Chẩn đoán;
- Cài đặt.

If another visual board shows a conflicting global sidebar:

Series 02 wins.

---

# 17. DECIDED — VERIFICATION VISUAL AUTHORITY

## D-017 — Series 03 v2 governs Spatial Verification workflow

Status:

```text
DECIDED
```

Series 03 owns:

- verification queue;
- Declared/Observed/Verified comparison;
- candidate geometry;
- evidence;
- deterministic anomaly checks;
- reviewer decision;
- history;
- domain verification states.

Its local/workspace navigation does not override Series 02 global Admin IA.

---

# 18. DECIDED — RESPONSIVE AUTHORITY

## D-018 — Series 08 governs responsive transformation

Status:

```text
DECIDED
```

Responsive layout can change:

- drawer;
- table;
- panel;
- map density.

It must not change authoritative facts.

---

# 19. DECIDED — PROPERTY DOMAIN

## D-019 — Property != Parcel != Listing

Status:

```text
DECIDED
```

Property:
persistent domain object.

Parcel:
spatial land geometry/reference.

Listing:
commercial representation/offer.

Do not model a Property as merely a Listing.

---

# 20. DECIDED — PROPERTY FACTS

## D-020 — Conflicting Property facts may coexist

Status:

```text
DECIDED
```

Example:

```text
Seller area claim: 2,450 m² — Declared
LAND computed area: 2,412 m² — Computed
Official reference: separate fact if available
```

Do not silently overwrite claims.

---

# 21. DECIDED — LEGAL CONSERVATISM

## D-021 — LAND does not invent legal/planning certainty

Status:

```text
DECIDED
```

Unknown ownership/planning/legal state remains:

```text
UNKNOWN
```

Do not infer:

- clean ownership;
- official parcel boundary;
- planning clearance;
- legal transaction readiness.

---

# 22. DECIDED — ASKING PRICE != MARKET VALUE

## D-022 — Listing price semantics remain explicit

Status:

```text
DECIDED
```

Seller/listing asking price is evidence.

It is not automatically:

- market value;
- appraisal value;
- transaction price;
- investment value.

---

# 23. DECIDED — DETERMINISTIC ANALYTICS BEFORE AI

## D-023 — Computation is authoritative; AI explains

Status:

```text
DECIDED
```

Examples:

- elevation;
- slope;
- aspect;
- proximity;
- network distance;
- viewshed;
- future Property analysis.

These must be deterministic and reproducible.

AI may explain the outputs.

AI must not invent them.

---

# 24. DECIDED — AI SECURITY

## D-024 — Early AI is read-only over explicit tools

Status:

```text
DECIDED
```

AI may:

- search;
- retrieve;
- compare;
- explain;
- summarize;
- fly map;
- highlight;
- toggle approved layers.

AI must not have:

- arbitrary SQL;
- direct DB access;
- generic RPC;
- arbitrary HTTP/browser;
- shell/filesystem;
- secret access;
- verify;
- publish;
- authoritative geometry mutation;
- legal authority.

---

# 25. DECIDED — AI IS OPTIONAL

## D-025 — LAND core cannot depend on AI availability

Status:

```text
DECIDED
```

If AI is unavailable:

- map still works;
- search works;
- Place works;
- deterministic Property analysis works when implemented;
- Admin works.

AI is an explanation/orchestration layer, not the spatial source of truth.

---

# 26. DECIDED — CURRENT PHASE

## D-026 — Phase 0.5 must close before Phase 1

Status:

```text
DECIDED
```

Current snapshot:

```text
Phase 0.5 = current
PR #2 = open + draft + unmerged
Phase 1 = not started
```

No Phase 1 implementation before Phase 0.5 closeout/merge.

---

# 27. OPEN — CLOUD R2 PROVIDER ACCEPTANCE

## O-001

Status:

```text
OPEN
CURRENT BLOCKER / CLOSEOUT GATE
```

Question:

Can the configured R2 private and published buckets complete the expected lifecycle from an independent cloud environment?

Required evidence:

Private:
- PUT;
- HEAD;
- GET;
- byte/hash verification;
- cleanup.

Published:
- operator PUT;
- HEAD;
- GET;
- anonymous public GET;
- byte/hash verification;
- cleanup.

Reason this remains open:

The current Windows workstation has a TLS handshake failure to the R2 S3 endpoint.

The local failure does not prove provider failure.

---

# 28. OPEN — DEPLOYED CREDENTIAL-SEPARATION EVIDENCE

## O-002

Status:

```text
OPEN
CURRENT BLOCKER / CLOSEOUT GATE
```

Need explicit evidence that deployed web runtime does NOT contain:

- published operator credential;
- DB owner/bootstrap credential;
- provider master credential.

Do not expose values while collecting evidence.

---

# 29. OPEN — FINAL PHASE 0.5 PROVIDER REPORT

## O-003

Status:

```text
OPEN
```

The final provider-acceptance report must reconcile:

- Vercel PASS;
- DB/PostGIS PASS;
- Admin PASS;
- local Windows R2 TLS failure;
- independent cloud R2 result;
- credential separation;
- cleanup;
- final conclusion.

Do not mark PASS before evidence exists.

---

# 30. OPEN — PR #2 CLOSEOUT / MERGE

## O-004

Status:

```text
OPEN
```

PR #2 remains draft/unmerged at the current handoff snapshot.

After provider acceptance:

- final diff review;
- secret scan;
- required checks;
- Ready for Review;
- review;
- merge.

Phase 1 starts from a clean post-merge baseline.

---

# 31. OPEN — FINAL BRANDED PUBLIC ASSET DOMAIN

## O-005

Status:

```text
OPEN
NON-BLOCKING FOR CURRENT STAGING IF r2.dev IS ACCEPTED FOR TEST
```

Current temporary published staging base uses an R2 development URL.

A final branded hostname should be configured only after the owner controls an appropriate domain/Cloudflare zone.

Do not invent ownership of:

```text
taxualand.vn
```

or any other domain.

---

# 32. OPEN — PHASE 1 TERRAIN SOURCE

## O-006

Status:

```text
OPEN
PHASE 1 DATA DECISION
```

Before production public terrain:

decide/confirm:

- exact DEM source;
- redistribution rights;
- vertical reference;
- resolution;
- acquisition/version date;
- processing chain;
- QA;
- release ID.

Phase 0 local pipeline validation is not enough to establish production spatial truth.

---

# 33. OPEN — TERRAIN VERTICAL DATUM / CONTROL ACCURACY

## O-007

Status:

```text
OPEN
PHASE 1/2 DATA QUALITY DECISION
```

Need explicit treatment of:

- source vertical datum;
- conversion methodology;
- expected accuracy;
- field/control-point validation where needed.

Do not claim survey-grade elevation from processing success alone.

---

# 34. OPEN — PHASE 1 IMAGERY SOURCE / RIGHTS

## O-008

Status:

```text
OPEN
PHASE 1 DATA DECISION
```

Need production-intended imagery choice with:

- source;
- capture/update date;
- public-display/redistribution rights;
- coverage;
- resolution;
- release registration.

Do not use visually attractive imagery without rights/provenance.

---

# 35. OPEN — ROAD SOURCE / OBSERVATION STRATEGY

## O-009

Status:

```text
OPEN
PHASE 1/2 DATA MATURITY DECISION
```

Need ongoing approach for:

- road geometry source;
- road classes;
- update cadence;
- field observations;
- access points;
- surface/width/vehicle observations;
- freshness/expiry.

Mapping a road is not certifying road safety.

---

# 36. OPEN — REAL PLACE DATA CURATION

## O-010

Status:

```text
OPEN
DATA OPERATIONS
```

The product architecture and import workflows exist.

The real operational dataset still requires:

- curated sources;
- import;
- review;
- correct geometry semantics;
- verification;
- public publication.

Do not confuse authored/synthetic test fixtures with verified production Places.

---

# 37. OPEN — PHASE 1 DELIVERY SLICE

## O-011

Status:

```text
OPEN
AFTER PHASE 0.5
```

Series 01 v2 contains many concepts.

Phase 1 implementation plan must decide the first production slice.

Likely highest-priority capabilities:

- real terrain;
- imagery;
- published Places;
- search;
- select/fly-to;
- Place drawer;
- layers;
- source/verification;
- responsive map.

Do not simply implement every Series 01 panel in one PR.

---

# 38. OPEN — DATASET RELEASE OPERATING CADENCE

## O-012

Status:

```text
OPEN
PHASE 1/2 OPERATIONS
```

Need operational decisions such as:

- who can create release candidates;
- who approves QA;
- who publishes;
- release naming;
- retention;
- superseding/retirement;
- rollback;
- monitoring.

Architecture already requires versioned immutable releases.

Operational cadence can be defined later.

---

# 39. OPEN — DOMAIN-SPECIFIC VERIFICATION POLICIES

## O-013

Status:

```text
OPEN
PHASE 2/3
```

The verification architecture is decided.

Exact policies may still need definition by domain.

Examples:

- Place location verification;
- road access verification;
- viewpoint verification;
- Parcel geometry verification.

Policies may specify:

- required evidence;
- blocking issues;
- reviewer role;
- expiry;
- second review.

Do not use one global policy for every spatial fact by default.

---

# 40. OPEN — PUBLIC DISPLAY OF REVIEW-REQUIRED DATA

## O-014

Status:

```text
OPEN
PRODUCT POLICY
```

Architecture allows independent publication and verification.

A product policy still needs to decide which combinations are public.

Example questions:

- Can Published + Declared be public?
- Can Review Required be public with warning?
- Which source authorities are public-safe?
- What accuracy metadata is public?

Do not assume every internal state belongs in public UX.

---

# 41. OPEN — PUBLIC HISTORICAL RELEASE COMPARISON

## O-015

Status:

```text
OPEN
PHASE 2+
```

Series 01/06 suggest comparison.

Need decide whether public users can access historical release comparison or whether that remains Admin-only initially.

---

# 42. DEFERRED — PROPERTY REGISTRY IMPLEMENTATION

## F-001

Status:

```text
DEFERRED TO PHASE 3
```

Visual specification exists.

Do not create Property schema/workflows during Phase 1 just because Series 01/02 contains future navigation.

---

# 43. DEFERRED — PROPERTY INTELLIGENCE METHODOLOGY

## F-002

Status:

```text
DEFERRED TO PHASE 4
```

Need later methodologies for:

- access;
- terrain;
- view;
- tourism context;
- infrastructure;
- comparable evidence;
- confidence.

Do not invent a single Property score now.

---

# 44. DEFERRED — PROPERTY VALUATION

## F-003

Status:

```text
DEFERRED
```

No automatic market valuation methodology is currently authoritative.

Do not add:

- AI valuation;
- investment score;
- guaranteed price.

Asking price remains a separate listing fact.

---

# 45. DEFERRED — LEGAL/CADASTRAL AUTHORITY

## F-004

Status:

```text
DEFERRED UNTIL AUTHORITATIVE DATA/LEGAL REVIEW EXISTS
```

A LAND polygon cannot be presented as official cadastral truth without the required source/authority.

---

# 46. DEFERRED — AI PROVIDER / MODEL SELECTION

## F-005

Status:

```text
DEFERRED TO PHASE 4
```

Architecture is provider-neutral.

Do not choose a permanent model/provider now simply because one is convenient.

Future selection should be based on:

- capability;
- cost;
- latency;
- safety;
- eval performance;
- operational support.

---

# 47. DEFERRED — AI PROMPT / PERSONA DESIGN

## F-006

Status:

```text
DEFERRED TO PHASE 4
```

Series 10 defines product shape.

Actual production prompts/personas should come after:

- tool contracts;
- policy;
- eval suite;
- source/provenance contracts.

---

# 48. DEFERRED — AI WRITE TOOLS

## F-007

Status:

```text
DEFERRED / DEFAULT PROHIBITED
```

Early AI is read-only.

Any future mutation tool would require a separate security architecture review.

Do not design mutation merely as a convenience extension.

---

# 49. DEFERRED — BROKERAGE

## F-008

Status:

```text
DEFERRED TO PHASE 5
```

Requires separate:

- product architecture;
- legal/compliance review;
- privacy review;
- visual specification.

There is no canonical Series 11 yet.

---

# 50. DEFERRED — SERIES 11 VISUAL BOARD

## F-009

Status:

```text
DEFERRED
```

Possible future title:

```text
Series 11 — Brokerage, CRM & Transaction Workflows
```

Create only when Phase 3/4 are mature.

---

# 51. DEFERRED — WORDPRESS / EDITORIAL SIDECAR

## F-010

Status:

```text
DEFERRED / OPTIONAL
```

If editorial CMS is introduced later:

it may own:

- blog;
- guide;
- SEO editorial;
- marketing content.

It must not become authority for:

- Place geometry;
- verification;
- road geometry;
- Dataset releases;
- Parcel;
- Property facts.

Do not introduce a CMS without a concrete editorial requirement.

---

# 52. DEFERRED — FULL REALTIME DATA

## F-011

Status:

```text
DEFERRED
```

Do not label information live unless there is an actual realtime/near-realtime provider.

Future realtime candidates may include:

- weather;
- temporary road conditions;
- mobility.

Terrain/Parcel/standard Place geometry are not realtime data.

---

# 53. KNOWN LIMITATION — LOCAL WINDOWS R2 TLS

## K-001

Status:

```text
KNOWN LIMITATION
```

Current Windows workstation cannot complete TLS handshake to the Cloudflare R2 S3 endpoint.

Observed from both Node and Windows curl/Schannel.

TCP 443 succeeds.

Do not treat this as provider failure until independent cloud evidence is considered.

Do not disable TLS.

---

# 54. KNOWN LIMITATION — r2.dev IS TEMPORARY DELIVERY

## K-002

Status:

```text
KNOWN LIMITATION
```

The current R2 development public URL is useful for staging.

It is not the final branded production CDN hostname.

---

# 55. KNOWN LIMITATION — PHASE 0 TEST DATA != FIELD-VERIFIED TRUTH

## K-003

Status:

```text
KNOWN LIMITATION
```

Repository/local tests prove architecture and processing behavior.

They do not automatically prove:

- field accuracy;
- road safety;
- legal Parcel boundaries;
- real Place verification;
- source redistribution rights.

---

# 56. KNOWN LIMITATION — GENERATED VISUAL TEXT

## K-004

Status:

```text
KNOWN LIMITATION
```

Visual boards were AI-generated.

They may contain:

- typos;
- mixed language;
- sample numbers;
- inconsistent dates;
- non-canonical labels.

Use them as visual/workflow specs, not literal database truth.

---

# 57. KNOWN LIMITATION — SERIES 03 SIDEBAR

## K-005

Status:

```text
KNOWN LIMITATION / RESOLVED BY AUTHORITY RULE
```

Series 03 v2 has workspace-specific navigation that differs from Series 02 global Admin IA.

Resolution:

```text
GLOBAL ADMIN SIDEBAR -> Series 02 v2
VERIFICATION WORKSPACE -> Series 03 v2
```

No need to regenerate Series 03 solely for this conflict unless a future design review chooses to.

---

# 58. KNOWN LIMITATION — VISUAL LIBRARY IS AHEAD OF CODE

## K-006

Status:

```text
KNOWN LIMITATION / INTENTIONAL
```

The 00–10 visual library depicts future phases.

The current repository does not implement all pictured features.

Do not infer implementation completeness from visual completeness.

---

# 59. RISK REGISTER

The following risks should remain visible throughout development.

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-001 | Architecture drift caused by coding directly from images | High | Architecture/repo contracts override visuals |
| R-002 | Published conflated with Verified | High | Separate status families in schema/UI/tests |
| R-003 | Declared/Observed/Verified collapsed | High | Series 03 + semantic tests |
| R-004 | Unknown converted to zero/default | High | Explicit UNKNOWN/NOT_AVAILABLE states |
| R-005 | Excel import mutates/publishes too early | High | Staging + explicit commit + publication gate |
| R-006 | Web runtime gains owner/operator credentials | Critical | Least privilege + deployed separation checks |
| R-007 | Published release mutated in place | High | Immutable release paths + successor workflow |
| R-008 | Source rights ignored because data is technically available | Critical | Source registry + publication gate |
| R-009 | Incorrect CRS/vertical datum | High | Explicit CRS/vertical metadata + QA |
| R-010 | External map becomes de facto authority | High | Reference-only semantics |
| R-011 | AI invents spatial/legal/property facts | Critical | Explicit tools + UNKNOWN + evals |
| R-012 | AI gains generic DB/HTTP/browser access | Critical | Tool allow-list + security boundary |
| R-013 | Series 01 future Property/AI implemented prematurely | Medium/High | Phase execution matrix |
| R-014 | Series 02/03 navigation fork | Medium | Series 02 global IA authority |
| R-015 | Cesium UI becomes source of truth | High | PostGIS/domain service authority |
| R-016 | Whole-region heavy 3D causes poor mobile performance | High | Progressive LOD + hotspot strategy |
| R-017 | Beautiful 3D exceeds source accuracy | High | Source-backed geometry + uncertainty |
| R-018 | Road data interpreted as safety advice | High | Observation labels + no safety certification |
| R-019 | Seller Property claim shown as verified truth | Critical | Source + verification separation |
| R-020 | Parcel digitization shown as legal cadastral boundary | Critical | Legal UNKNOWN + explicit disclaimer |
| R-021 | Asking price shown as valuation | High | Separate price semantics |
| R-022 | Stale derived results not recomputed after input version change | High | Lineage + dependency invalidation |
| R-023 | Local client/network failure misdiagnosed as provider outage | Medium | Independent diagnostics |
| R-024 | Handoff snapshot becomes stale | Medium | Re-check Git/remote before coding |
| R-025 | Secrets copied into handoff/chat/screenshots | Critical | Sanitized docs; owner injects secrets securely |
| R-026 | Public API leaks private evidence/PII | Critical | Public-safe DTOs + tests |
| R-027 | Property/AI added before spatial moat is mature | High | Phase gates |
| R-028 | Dataset/release lifecycle bypassed by manual bucket upload | High | Registry/release operator workflow |
| R-029 | Duplicate detection auto-merges legitimate entities | Medium | Review, not automatic merge |
| R-030 | Spatial anomaly auto-corrects geometry | High | Flag/review only |
| R-031 | Realtime language used for stale/static data | Medium | Timestamp/freshness semantics |
| R-032 | Admin becomes generic CMS instead of spatial command center | Medium | Series 02 v2 authority |
| R-033 | UI matches screenshot but violates domain rules | High | Functional/domain acceptance required |
| R-034 | Provider-specific code leaks across domain | Medium | Adapter/provider boundaries |
| R-035 | Phase 0.5 closed without complete provider evidence | High | `05_PHASE_0_5_CLOSEOUT.md` |

---

# 60. HIGH-PRIORITY RISK TESTS

Before significant releases, test specifically for:

## Spatial truth

- Declared remains distinguishable from Verified.
- Observed does not auto-verify.
- Candidate does not silently replace current authoritative geometry.
- Unknown does not become zero.

## Publication

- Import commit does not publish.
- Release candidate does not publish.
- Published release cannot be edited in place through normal workflow.

## Security

- public client has no secrets;
- web runtime has no DB owner credential;
- web runtime has no published operator credential;
- private evidence is absent from public DTO;
- revoked Admin sessions fail.

## AI future

- no direct SQL;
- no arbitrary HTTP;
- no mutation tool;
- prompt injection cannot expand permissions;
- unknown answers remain unknown.

---

# 61. DECISION LOG PRACTICE

When an OPEN item is decided:

do not delete it.

Change:

```text
OPEN
```

to:

```text
DECIDED — YYYY-MM-DD
```

and record:

- decision;
- rationale;
- affected ADR;
- affected phase;
- migration if any.

This file should evolve as a compact product/architecture memory.

---

# 62. WHAT THE NEXT SESSION MAY DECIDE NOW

During current Phase 0.5, the next session may close:

- O-001 Cloud R2 acceptance;
- O-002 credential separation evidence;
- O-003 final provider report;
- O-004 PR closeout/merge.

It should generally NOT decide or implement:

- Property architecture changes;
- AI model selection;
- brokerage workflows;
- valuation methodology.

Those remain future-phase questions.

---

# 63. CURRENT DECISION SUMMARY

At handoff:

```text
ARCHITECTURE:
FROZEN

CURRENT PHASE:
0.5

CURRENT BLOCKERS:
provider acceptance evidence
credential separation evidence
final report
PR closeout

NEXT PRODUCT PHASE:
Phase 1 — only after 0.5 closes

VISUAL AUTHORITY:
00 Design System
01 Public Map v2
02 Admin IA v2
03 Spatial Verification v2
04–10 domain/future boards

PROPERTY:
DEFERRED TO PHASE 3

AI:
DEFERRED TO PHASE 4

BROKERAGE:
DEFERRED TO PHASE 5
```

End of Open Decisions, Risks & Deferred Items.
