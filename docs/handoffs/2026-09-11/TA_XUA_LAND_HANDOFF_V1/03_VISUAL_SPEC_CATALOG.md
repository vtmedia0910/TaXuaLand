# TÀ XÙA LAND — VISUAL SPECIFICATION CATALOG

Handoff version: 1.0
Snapshot: 2026-09-11
Library name: **TÀ XÙA LAND Visual Specification Library v1**
Scope: Series 00–10

---

## 0. PURPOSE

This file defines how the eleven TÀ XÙA LAND visual boards must be interpreted by future ChatGPT conversations, Codex sessions, developers, designers and coding agents.

The images are not decoration and they are not database truth.

They are **visual specifications** for:

- information architecture;
- interaction patterns;
- screen hierarchy;
- map-first composition;
- status presentation;
- workflow shape;
- responsive transformation;
- domain-specific UI intent.

They must always be read together with:

- `00_READ_ME_FIRST.md`;
- `01_CURRENT_REPO_STATE.md`;
- `02_ARCHITECTURE_AND_SEMANTIC_RULES.md`;
- repository architecture/ADRs/contracts;
- `04_PHASE_CODE_EXECUTION_MATRIX.md`.

---

# 1. AUTHORITY ORDER

When implementation sources conflict, use this order:

1. Product/domain architecture and frozen semantic rules.
2. Current repository contracts, migrations, ADRs and tests.
3. Series 00 Design System for visual/component language.
4. Series 02 v2 for global Admin information architecture.
5. The domain-specific visual board relevant to the task.
6. Other supporting visual boards.
7. Example text, counts, dates and coordinates inside generated images.

Therefore:

- architecture may override an image;
- repository contracts may override a visual field name;
- Series 02 overrides other boards for global Admin navigation;
- sample values inside an image are illustrative unless confirmed by data.

---

# 2. VERSIONING RULE

Canonical visual filenames should be stable and explicit.

Recommended names:

```text
00-design-system-v1.png
01-public-map-3d-experience-v2.png
02-admin-system-overview-v2.png
03-spatial-truth-verification-v2.png
04-place-poi-management-v1.png
05-excel-import-data-qa-v1.png
06-spatial-dataset-release-management-v1.png
07-operations-diagnostics-security-v1.png
08-mobile-responsive-experience-v1.png
09-property-registry-intelligence-v1.png
10-ai-advisor-control-center-v1.png
```

Series 01, 02 and 03 were regenerated and the v2 boards replace their older versions.

Do not keep an old board active under the same canonical name.

Future revisions should become:

```text
03-spatial-truth-verification-v3.png
```

not silently overwrite the meaning of v2 inside the handoff archive.

---

# 3. GENERATED IMAGE SAFETY

AI-generated boards may contain:

- typographical errors;
- inconsistent sample counts;
- example dates;
- illustrative coordinates;
- placeholder names;
- UI labels not identical to current code;
- visualized future features not yet implemented.

Coding agents must not convert those accidental details into domain contracts.

Images are strongest for:

- layout;
- hierarchy;
- interaction intent;
- component relationships;
- workflow;
- state distinction;
- responsive design.

They are weaker authority for:

- exact database schema;
- exact enum spelling;
- real-world facts;
- legal conclusions;
- exact CSS token numbers;
- current implementation status.

---

# 4. SERIES 00 — DESIGN SYSTEM

**Canonical file:** `00-design-system-v1.png`
**Role:** Cross-product visual authority
**Phase relevance:** All phases
**Authority level:** Highest visual authority

## Purpose

Series 00 defines the visual language shared across public, Admin, spatial workflows, Property and AI.

It should guide:

- colors;
- typography;
- spacing;
- radius;
- shadows;
- layout grids;
- sidebar patterns;
- buttons;
- inputs;
- chips/tags;
- verification badges;
- source-authority badges;
- publication badges;
- tables;
- cards;
- drawers;
- modals;
- toasts;
- tabs;
- steppers;
- search/filter systems;
- loading/empty/error/review states;
- map controls;
- map layer panels;
- marker/cluster/geometry states;
- responsive transformation.

## Key visual semantics

The board contains independent status families such as:

Verification:
- Verified;
- Declared;
- Unknown;
- Expired;
- Review / needs review.

Source authority:
- Official;
- LAND Observed;
- Seller;
- Third Party;
- Unknown.

Publication:
- Draft;
- Pending/ready for review;
- Published;
- Archived/retired.

These status families must not be merged into one generic status.

## Spatial controls

Series 00 also establishes the concept of:

- map layer panel;
- marker state;
- cluster state;
- geometry representation;
- declared vs verified markers;
- map + drawer layout;
- form + map layout;
- administrative spatial tables.

## Implementation rule

Use Series 00 for visual consistency, but do not treat every pictured pixel value as an immutable CSS token unless the repository/design-token implementation adopts it.

If current code already contains approved design tokens, code is the exact numeric authority.

---

# 5. SERIES 01 v2 — PUBLIC MAP & 3D EXPERIENCE

**Canonical file:** `01-public-map-3d-experience-v2.png`
**Role:** Public spatial experience authority
**Primary phases:** Phase 1, then expanded in Phase 2
**Supporting phases:** Phase 0B, Phase 3, Phase 4
**Authority level:** Public-map UX authority

## Purpose

Series 01 defines how the public user explores Tà Xùa as a spatial environment rather than as a list of tourism cards.

The v2 board should be considered the replacement for the earlier Series 01.

## Major screen concepts

The board includes:

1. Main Tà Xùa 3D map.
2. Regional 3D overview.
3. Place marker system.
4. Clustered markers.
5. Global search.
6. Explore list + map.
7. Selected Place map card.
8. Place detail drawer.
9. Layer management.
10. Imagery/data comparison.
11. Access and route context.
12. Elevation profile.
13. Terrain inspector.
14. Slope layer.
15. Source and verification explanation.
16. Nearby Places.
17. Place comparison.
18. Future Property layer.
19. Future LAND Advisor.
20. Web/tablet/mobile/loading/error/degraded states.

## Canonical public-map principles

PUBLIC MAP = map first.

The user should understand:

- position;
- terrain;
- access;
- source;
- verification;
- nearby spatial context.

Place detail should not behave like an isolated tourism article detached from the map.

## Future-feature warning

The board visibly includes future:

- Property;
- LAND Advisor / AI.

Their presence is **navigation/product continuity only**.

Do not implement Property or AI during Phase 1 simply because the board shows them.

## Verification presentation

Public UI may show:

- Published + Verified;
- Published + Declared;
- Unknown;
- Review/limited-confidence states where safe.

Published must not be rendered as synonymous with Verified.

## Route/access warning

The board shows access and route context.

This does not authorize implementing unsupported travel routing, road-safety certification or TRIP commerce.

Road facts must come from LAND spatial data.

## Data warning

Sample elevations, distances and dates in the image are illustrative until backed by authoritative LAND data.

---

# 6. SERIES 02 v2 — ADMIN SYSTEM OVERVIEW

**Canonical file:** `02-admin-system-overview-v2.png`
**Role:** Canonical global Admin information architecture
**Primary phases:** Phase 0B, 0C, 0.5 and all later Admin work
**Authority level:** **Global Admin IA authority**

## Purpose

Series 02 v2 replaces the older generic/tourism-style Admin concept.

It defines LAND Admin as a **Spatial Data Command Center**.

## Canonical global Admin sections

Use this as the conceptual global navigation authority:

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

Future sections may include:

- Property;
- AI Control Center.

## Major screen concepts

1. Admin Command Center.
2. Admin spatial map.
3. Unified Review Center.
4. Place / POI overview.
5. Spatial Verification overview.
6. Excel Import.
7. Source Registry.
8. Dataset & Release.
9. Media.
10. System Health.
11. Provider & Security Readiness.
12. Users.
13. Role/User matrix.
14. RBAC matrix.
15. Audit Log.
16. Notifications.
17. Global LAND search.
18. Settings.
19. Responsive/future extensions.

## Dashboard principle

The Admin home should combine:

- spatial map;
- attention/review queue;
- data quality;
- system health;
- recent activity.

Do not rebuild it as a generic marketing analytics dashboard.

## Global-navigation conflict rule

If Series 03, 04, 05, 06, 07 or another board shows a different global Admin sidebar:

**Series 02 wins.**

Those boards may introduce module-local navigation, tabs or workspace sections, but not redefine the global Admin IA.

## Example counts

Values such as 482, 356, 74, etc. are sample UI data only.

Never seed or hard-code them because they appear here.

---

# 7. SERIES 03 v2 — SPATIAL TRUTH VERIFICATION WORKSPACE

**Canonical file:** `03-spatial-truth-verification-v2.png`
**Role:** Canonical Spatial Verification workflow authority
**Primary phases:** Verification foundation in Phase 0B; major expansion Phase 2; reused Phase 3+
**Authority level:** Domain workflow authority

## Purpose

Series 03 defines the human-in-the-loop spatial truth workflow.

The v2 board replaces the previous Series 03.

Core semantic model:

```text
DECLARED
!=
OBSERVED
!=
VERIFIED
```

## Major screen concepts

1. Verification overview.
2. Verification queue.
3. Verification map.
4. Object detail under review.
5. Declared / Observed / Verified comparison.
6. Map picker / candidate comparison.
7. Evidence and source data.
8. Checklist and decision.
9. Verification history / audit.
10. AI anomaly advisory.
11. Source authority matrix.
12. Dataset/release linkage.
13. Expiry/review queue.
14. Data conflict resolution.
15. Mobile field verification.
16. Tablet verification workspace.
17. Loading/error/unknown/review states.
18. Assignment/bulk review.
19. Verification diagnostics.
20. Spatial trust and safety principles.

## Canonical rules

Declared is a claim.

Observed is evidence/observation.

Verified is an authorized verification outcome.

Observed does not automatically become Verified.

Dragging a marker creates a Candidate, not authoritative truth.

GPS does not automatically verify.

External maps do not automatically verify.

AI does not verify.

Automated anomaly checks do not verify.

## Domain-level verification

One object may simultaneously have:

```text
Location: VERIFIED
Road Access: REVIEW_REQUIRED
Viewpoint: OBSERVED
Safety: UNKNOWN
Publication: PUBLISHED
```

Do not render one broad "Verified object" badge if that would misrepresent other domains.

## Sidebar caveat

The visual board includes workspace-oriented navigation.

For global Admin navigation, always defer to Series 02 v2.

---

# 8. SERIES 04 — PLACE / POI MANAGEMENT

**Canonical file:** `04-place-poi-management-v1.png`
**Role:** Place administration authority
**Primary phases:** Phase 0B; expanded Phase 1–2
**Authority level:** Place UX/workflow authority

## Major concepts

The board covers:

- Place dashboard/overview;
- Place table;
- Place on map;
- Place detail;
- Place edit;
- spatial geometry;
- access information;
- safety/warning content;
- media;
- verification;
- history/versioning;
- Excel import entry point;
- advanced filtering;
- reporting/summary;
- source management linkage;
- publication/share.

## Place model principle

Place is not just:

```text
title + lat + lng + description
```

Place is a spatial entity with:

- identity;
- geometry;
- category;
- content;
- source;
- verification;
- publication;
- access context;
- media;
- history.

## Map editing

A map picker or geometry editor must respect:

- candidate geometry;
- history;
- verification state;
- explicit save/review behavior.

Do not silently overwrite verified geometry.

## Access/safety caveat

UI may display access notes or road observations.

Do not convert these into unsupported safety certification.

## Source/verification rule

The Place screen must show these independently where relevant:

- source authority;
- verification;
- publication;
- freshness.

---

# 9. SERIES 05 — EXCEL IMPORT & DATA QA

**Canonical file:** `05-excel-import-data-qa-v1.png`
**Role:** Bulk ingestion workflow authority
**Primary phase:** Phase 0C
**Supporting phases:** all later bulk-ingest work
**Authority level:** Import workflow authority

## Canonical seven-step workflow

```text
1 Upload
2 Inspect
3 Map
4 Validate
5 Stage
6 Review
7 Commit
```

This sequence is highly important.

## Major screen concepts

- import dashboard;
- workbook upload;
- workbook inspection;
- sheet selection;
- field mapping;
- normalization;
- validation result;
- spatial validation map;
- coordinate review;
- duplicate detection;
- provenance/source;
- map preview;
- staging;
- pre-commit review;
- commit;
- import result/report.

## Security boundary

Workbook input is untrusted.

The architecture already expects protection against:

- oversized files;
- excessive rows;
- macros;
- formulas where blocked;
- hidden/account/credential-like sheets;
- malformed files;
- invalid spatial data.

## Critical semantic rule

```text
UPLOAD != IMPORTED DOMAIN DATA
STAGING != PLACE
COMMIT != VERIFIED
COMMIT != PUBLISHED
```

Commit creates controlled domain mutations/drafts according to policy.

It must not automatically verify or publish imported Places.

## Coordinate rule

Invalid or suspicious coordinates enter error/review states.

AI must not guess replacement coordinates.

---

# 10. SERIES 06 — SPATIAL DATASET & RELEASE MANAGEMENT

**Canonical file:** `06-spatial-dataset-release-management-v1.png`
**Role:** Spatial dataset lifecycle authority
**Primary phases:** Phase 0A foundation, Phase 1, Phase 2
**Supporting phases:** Phase 3–4
**Authority level:** Dataset/release workflow authority

## Major concepts

- Dataset overview;
- Terrain dataset detail;
- Dataset creation;
- source artifact registration;
- data lineage;
- CRS/metadata;
- coverage;
- processing pipeline;
- terrain workspace;
- imagery workspace;
- road network workspace;
- 3D Tiles dataset;
- release history;
- release candidate;
- release QA;
- visual comparison;
- release publication;
- published-release operations;
- mobile quick views.

## Canonical lifecycle

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

## Immutability

Published releases are immutable.

Update by creating a successor release.

Do not mutate old published bytes in place.

## Dataset != Release

Dataset is the logical governed collection.

Release is a versioned snapshot/artifact set.

This distinction must remain visible in UI and code.

## Metadata

Important fields include:

- source;
- rights/license;
- CRS;
- vertical datum where relevant;
- coverage;
- processing version;
- checksums;
- release ID;
- QA;
- timestamps.

---

# 11. SERIES 07 — OPERATIONS, DIAGNOSTICS & SECURITY

**Canonical file:** `07-operations-diagnostics-security-v1.png`
**Role:** Operations and security visual authority
**Primary phase:** Phase 0.5
**Supporting phases:** all future phases
**Authority level:** Operational UX authority

## Major concepts

- system status;
- service-health matrix;
- web application status;
- map readiness;
- database diagnostics;
- PostGIS diagnostics;
- private object storage;
- published asset storage/public delivery;
- credential boundaries;
- environment and sensitive configuration;
- import diagnostics;
- processing jobs;
- diagnostic run;
- provider acceptance/release readiness;
- incident center;
- incident detail;
- users/RBAC;
- sessions;
- audit;
- object upload/integrity status;
- mobile operational views.

## Critical visual rule

Operations UI must distinguish:

- PASS;
- WARN/DEGRADED;
- FAIL;
- UNKNOWN;
- NOT RUN;
- PARTIAL PASS.

Do not call a service Healthy merely because credentials are Configured.

## Credential boundary

```text
WEB RUNTIME
- application runtime DB role
- private storage runtime credential

NOT IN WEB RUNTIME
- DB owner/bootstrap authority
- published release operator credential
- provider master credential
```

## Diagnostics safety

Do not expose:

- raw secret values;
- arbitrary SQL;
- shell;
- unrestricted HTTP;
- database owner controls.

Diagnostics should be structured, bounded and auditable.

---

# 12. SERIES 08 — MOBILE & RESPONSIVE EXPERIENCE

**Canonical file:** `08-mobile-responsive-experience-v1.png`
**Role:** Responsive authority
**Primary phases:** All user-facing phases
**Authority level:** Responsive transformation authority

## Major concepts

Public mobile:

- default map;
- expanded search;
- search results;
- compact Place card;
- half-screen Place;
- full-screen Place;
- bottom-sheet states;
- layer control;
- filters;
- clusters;
- access/routes;
- elevation profile;
- terrain information.

Admin mobile:

- Place list;
- quick edit;
- Spatial Verification;
- field review;
- verification evidence;
- Excel Import summary;
- Dataset quick view;
- operations health;
- incident/session states.

Tablet:

- map/public landscape;
- Admin Place workspace;
- verification workspace;
- QA/dataset workflows.

## Canonical transformation

```text
Desktop drawer
-> Tablet side panel
-> Mobile bottom sheet

Desktop table
-> Tablet compact table
-> Mobile cards

Desktop filters
-> Mobile filter sheet
```

## Critical principle

Responsive design changes layout, not truth.

The same authoritative fact must remain the same across devices.

Mobile may reduce detail density, not change verification semantics.

---

# 13. SERIES 09 — PROPERTY REGISTRY & PROPERTY INTELLIGENCE

**Canonical file:** `09-property-registry-intelligence-v1.png`
**Role:** Future Property product authority
**Primary phases:** Phase 3 and Phase 4
**Authority level:** Future domain UX authority

## Important phase split

Series 09 contains both:

- Property Registry concepts;
- Property Intelligence concepts.

Do not implement the whole image in Phase 3.

Phase 3:
Registry / facts / Parcel / Listing association / provenance / verification.

Phase 4:
deeper deterministic intelligence and AI explanation.

## Major concepts

- Property Registry;
- Property map;
- create Property;
- Property detail;
- Parcel geometry;
- geometry comparison;
- Property facts;
- provenance;
- access intelligence;
- terrain intelligence;
- slope/aspect;
- viewshed;
- nearby context;
- infrastructure;
- domain confidence;
- legal/planning information;
- Listings;
- Price Evidence / comparables;
- Property Intelligence summary;
- responsive future AI entry point.

## Canonical domain rule

```text
PROPERTY != PARCEL != LISTING
```

## Facts

Conflicting facts may coexist.

Do not silently overwrite one source with another.

## Legal warning

UNKNOWN legal/planning information must remain Unknown.

A LAND-drawn/digitized polygon is not automatically an official cadastral boundary.

## Confidence

Prefer confidence by domain, not a magic overall score.

---

# 14. SERIES 10 — AI ADVISOR & AI CONTROL CENTER

**Canonical file:** `10-ai-advisor-control-center-v1.png`
**Role:** Future grounded-AI authority
**Primary phase:** Phase 4
**Authority level:** AI UX/governance authority, subordinate to AI security architecture

## Major public concepts

- LAND Advisor;
- Place query;
- grounded Place answer;
- nearby Place search;
- terrain/view explanation;
- Property comparison;
- stale/conflicting data explanation;
- legal/price-safe answer.

## Major Admin concepts

- Admin Assistant;
- stale Property review support;
- release QA explanation;
- import explanation;
- provenance/tool activity;
- AI Control Center;
- provider/model registry;
- personas/tool registry;
- policies/prompt versions;
- audit/policy violations;
- security boundaries;
- kill switch;
- usage/cost/diagnostics;
- AI config release;
- mobile/responsive Advisor.

## Core rule

AI is grounded on LAND data.

Allowed:

- search;
- retrieve;
- compare;
- explain;
- summarize;
- map fly-to;
- highlight;
- show approved layer.

Forbidden in early phases:

- direct SQL;
- arbitrary database access;
- arbitrary HTTP/browser;
- secret access;
- verify;
- publish;
- move authoritative geometry;
- approve Property;
- create legal claims;
- invent valuation.

## Read-only semantics

A visible `READ ONLY` treatment in Series 10 is semantically important.

UI-only map actions do not equal data mutation.

---

# 15. CROSS-SERIES CONFLICT MATRIX

| Conflict | Canonical winner |
|---|---|
| Architecture vs image | Architecture |
| Current DB/API contract vs image field name | Repository contract |
| Exact CSS token vs generated image | Approved design token/code |
| Global Admin sidebar 02 vs 03–07 | Series 02 |
| Verification workflow 03 vs generic Admin concept | Series 03 |
| Place workflow 04 vs generic Admin card | Series 04 |
| Import sequence 05 vs shortcut UI | Series 05 |
| Dataset/release lifecycle 06 vs upload shortcut | Series 06 |
| Operations/security 07 vs convenience control | Series 07 / security architecture |
| Responsive behavior 08 vs desktop screenshot | Series 08 |
| Property semantics 09 vs generic listing assumption | Architecture + Series 09 |
| AI visual affordance vs security policy | Security architecture |
| Sample count/date vs live DB | Live authoritative data |
| External map visual vs LAND verified geometry | LAND authority |

---

# 16. VISUALS BY CODE DOMAIN

## Public viewer

Primary:
- 01;
- 00;
- 08.

Supporting:
- 04;
- 06;
- 03.

## Admin shell

Primary:
- 02;
- 00.

Supporting:
- 07;
- 08.

## Place

Primary:
- 04.

Supporting:
- 02;
- 03;
- 05;
- 08.

## Import

Primary:
- 05.

Supporting:
- 02;
- 03;
- 04;
- 07.

## Spatial Verification

Primary:
- 03.

Supporting:
- 00;
- 02;
- 04;
- 06;
- 07;
- 08.

## Dataset / Release

Primary:
- 06.

Supporting:
- 00;
- 02;
- 07;
- 08.

## Operations / Security

Primary:
- 07.

Supporting:
- 02;
- 00;
- 08.

## Property

Primary:
- 09.

Supporting:
- 03;
- 06;
- 08;
- 02.

## AI

Primary:
- 10.

Supporting:
- 03;
- 07;
- 09;
- 01;
- 02.

---

# 17. VISUALS BY PHASE

| Phase | Primary visual authority | Supporting |
|---|---|---|
| 0A Spatial Infrastructure | 06, 07, 00 | 01, 02 |
| 0B Spatial Content | 04, 03, 02 | 00, 08 |
| 0C Bulk Ingestion | 05 | 04, 03, 02, 07 |
| 0.5 Deployment Hardening | 07 | 02, 00, 06 |
| 1 Tà Xùa 3D | 01 | 00, 04, 06, 08 |
| 2 Digital Twin / Spatial Intelligence | 03, 06, 01 | 07, 08 |
| 3 Property Registry | 09 | 03, 06, 02, 08 |
| 4 Property Intelligence + AI | 09, 10 | 03, 06, 07, 08 |
| 5 Brokerage | No dedicated canonical board yet | 09 as foundation only |

---

# 18. PHASE 5 VISUAL GAP

The current 00–10 library intentionally has no dedicated Brokerage visual specification.

A future board may become:

```text
Series 11 — Brokerage, CRM & Transaction Workflows
```

Create it only after:

- Property Registry architecture is mature;
- Property Intelligence is stable;
- legal/compliance review defines allowed workflows.

Do not design/code Phase 5 prematurely.

---

# 19. IMAGE STORAGE IN HANDOFF PACKAGE

Recommended structure:

```text
visual-specs/
  00-design-system-v1.png
  01-public-map-3d-experience-v2.png
  02-admin-system-overview-v2.png
  03-spatial-truth-verification-v2.png
  04-place-poi-management-v1.png
  05-excel-import-data-qa-v1.png
  06-spatial-dataset-release-management-v1.png
  07-operations-diagnostics-security-v1.png
  08-mobile-responsive-experience-v1.png
  09-property-registry-intelligence-v1.png
  10-ai-advisor-control-center-v1.png
```

Do not duplicate images into each phase folder.

Phase documents should reference canonical filenames.

---

# 20. HOW A CODING AGENT SHOULD USE AN IMAGE

Before implementing a screen:

1. Identify the current phase.
2. Identify the domain.
3. Open the relevant primary visual board.
4. Open Series 00.
5. Open Series 02 if Admin navigation is involved.
6. Inspect current repository contracts.
7. List which pictured capabilities are in-scope now.
8. List which pictured capabilities are future.
9. Implement only in-scope capability.
10. Validate semantic states with tests, not screenshot resemblance alone.

---

# 21. VISUAL ACCEPTANCE DOES NOT REPLACE FUNCTIONAL ACCEPTANCE

A screen can visually resemble the board and still be architecturally wrong.

Examples of visual PASS but semantic FAIL:

- Published shown as Verified.
- Imported row automatically published.
- Candidate coordinate overwrites verified geometry.
- Published release edited in place.
- AI allowed to call arbitrary SQL.
- Seller parcel shown as official boundary.
- Private evidence exposed publicly.
- mobile screen shows a different fact than desktop.

Functional/domain acceptance is mandatory.

---

# 22. CURRENT CANONICAL STATUS

Series 00:
ACCEPTED v1

Series 01:
ACCEPTED v2 — replaces old Series 01

Series 02:
ACCEPTED v2 — replaces old Series 02
GLOBAL ADMIN IA AUTHORITY

Series 03:
ACCEPTED v2 — replaces old Series 03
SPATIAL VERIFICATION WORKFLOW AUTHORITY
GLOBAL SIDEBAR DEFERS TO SERIES 02

Series 04:
ACCEPTED v1

Series 05:
ACCEPTED v1

Series 06:
ACCEPTED v1

Series 07:
ACCEPTED v1

Series 08:
ACCEPTED v1

Series 09:
ACCEPTED v1 as future Property visual specification

Series 10:
ACCEPTED v1 as future AI visual specification

---

# 23. FINAL VISUAL RULE

The intended order is:

```text
SPATIAL TRUTH
-> DOMAIN CONTRACT
-> WORKFLOW
-> VISUAL SPECIFICATION
-> IMPLEMENTATION
-> TEST
-> ACCEPTANCE
```

Not:

```text
SCREENSHOT
-> COPY PIXELS
-> INVENT DATA MODEL
```

End of Visual Specification Catalog.
