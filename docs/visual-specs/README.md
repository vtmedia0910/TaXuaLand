# TÀ XÙA LAND — VISUAL SPECIFICATION LIBRARY

Status: Visual specification index
Library: TÀ XÙA LAND Visual Specification Library v1
Purpose: Provide a lightweight canonical entry point for the Series 00–10 visual boards without treating generated images as product/database truth

> The visual library defines visual hierarchy, interaction patterns, workflow expectations, responsive behavior, and presentation semantics.
>
> It does **not** override product/domain architecture, repository contracts, ADRs, migrations, tests, source authority, verification state, or real spatial data.

---

## 1. Canonical library files

The canonical visual boards are:

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

Series 01, 02, and 03 use the accepted **v2** boards.

Older Series 01–03 boards must not be treated as co-equal canonical references.

If future revisions are approved, version the new file explicitly rather than silently replacing meaning under the same filename.

---

## 2. Authority order

When two sources appear to conflict, use this order:

```text
1. Explicit owner instruction

2. Product/domain architecture and frozen semantic rules

3. Current repository contracts, ADRs, migrations, and tests

4. Approved current specification for the feature/phase

5. Series 00 Design System

6. Series 02 v2 for global Admin information architecture

7. Relevant domain-specific visual board

8. Supporting visual boards

9. Sample text, numbers, dates, coordinates, names, and generated content
   shown inside visual boards
```

A visual board is not allowed to silently reopen an architecture decision.

---

## 3. Generated-image rule

The boards are AI-generated visual specifications.

They may contain:

- illustrative Place names;
- sample user names;
- sample dataset names;
- example counts;
- example coordinates;
- example elevations;
- example distances;
- example dates;
- sample statuses;
- mixed-language labels;
- typos;
- visual placeholders.

These are not production facts.

Do not:

```text
hard-code sample values
seed database records from screenshots
treat illustrated coordinates as verified locations
treat illustrated Property boundaries as legal facts
treat generated AI responses as approved product output
treat a visual status badge as proof of backend state
```

Actual facts must come from authoritative LAND data/contracts.

---

## 4. Core semantic rules that visuals must preserve

The following distinctions are non-negotiable:

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

A cleaner-looking UI is not justification for collapsing these concepts.

---

# 5. Series 00 — Design System

Canonical file:

```text
00-design-system-v1.png
```

Role:

```text
Cross-product visual authority
```

Phase relevance:

```text
All phases
```

Authority:

```text
Highest visual/component authority
```

Use Series 00 for:

- color language;
- typography;
- spacing;
- radius;
- shadows;
- layout rhythm;
- button treatment;
- inputs;
- cards;
- tables;
- drawers;
- modals;
- tabs;
- steppers;
- chips/tags;
- loading states;
- empty states;
- error states;
- review states;
- map controls;
- map layers;
- marker states;
- cluster states;
- geometry presentation;
- status-badge families;
- responsive component language.

### Important implementation rule

If current approved code/design tokens already define exact numeric values, those code tokens are the numeric authority.

Series 00 governs the visual language, not necessarily every generated pixel value.

### Independent status families

Keep visually and semantically separate:

Verification:

```text
Verified
Declared
Observed where applicable
Unknown
Expired
Needs Review
```

Source authority:

```text
Official
LAND Observed
Partner / Third Party
Seller
Unknown
```

Publication:

```text
Draft
Review / Ready
Published
Archived / Retired
```

Do not turn these into one generic status system.

---

# 6. Series 01 v2 — Public Map & 3D Experience

Canonical file:

```text
01-public-map-3d-experience-v2.png
```

Role:

```text
Public spatial experience authority
```

Primary phases:

```text
Phase 1
expanded in Phase 2
```

Supporting relevance:

```text
Phase 0B
Phase 3
Phase 4
```

### Product principle

```text
PUBLIC MAP = MAP FIRST
```

The public user should understand Tà Xùa as a spatial environment, not as a collection of detached tourism cards.

The experience should help communicate:

- position;
- terrain;
- spatial context;
- roads/access context where authoritative;
- nearby Places;
- source;
- freshness;
- verification;
- selected-object context.

### Major concepts

Series 01 includes concepts for:

- main Tà Xùa 3D map;
- regional 3D overview;
- Place markers;
- marker clustering;
- global Place search;
- Explore list + map;
- selected Place card;
- Place detail drawer;
- layer management;
- imagery/data comparison;
- access/route context;
- elevation profile;
- terrain inspector;
- slope layer;
- source/verification explanation;
- nearby Places;
- Place comparison;
- future Property continuity;
- future LAND Advisor continuity;
- desktop/tablet/mobile/loading/error/degraded states.

### Phase warning

Property and AI visible in Series 01 are future product continuity only.

Do not implement them in Phase 1 merely because they are visible in the board.

### Route/access warning

A road shown on the map does not imply:

```text
road safety
current passability
legal access
motorbike suitability
```

unless authoritative data supports those claims.

---

# 7. Series 02 v2 — Admin System Overview

Canonical file:

```text
02-admin-system-overview-v2.png
```

Role:

```text
Canonical global Admin information architecture
```

Primary relevance:

```text
Phase 0B
Phase 0C
Phase 0.5
all later Admin work
```

Authority:

```text
GLOBAL ADMIN IA AUTHORITY
```

Series 02 defines LAND Admin as a:

```text
Spatial Data Command Center
```

Canonical conceptual Admin areas include:

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

Future navigation may include Property and AI Control Center only when those phases are authorized.

### Conflict rule

If another board shows a conflicting global Admin sidebar:

```text
Series 02 v2 wins.
```

---

# 8. Series 03 v2 — Spatial Truth Verification

Canonical file:

```text
03-spatial-truth-verification-v2.png
```

Role:

```text
Canonical Spatial Verification workflow authority
```

Primary relevance:

```text
Phase 0B foundation
major Phase 2 expansion
reused in Phase 3+
```

Core semantics:

```text
Declared != Observed != Verified

Candidate != Authoritative

AI != Verifier
```

Series 03 governs the verification workspace and spatial-review workflow.

It does not override Series 02 for global Admin navigation.

Use:

```text
GLOBAL ADMIN SIDEBAR
→ Series 02 v2

SPATIAL VERIFICATION WORKSPACE
→ Series 03 v2
```

Do not automatically promote:

- seller claims;
- imported coordinates;
- external-map coordinates;
- AI suggestions;
- spatial anomaly corrections;

into Verified authoritative state.

---

# 9. Series 04 — Place / POI Management

Canonical file:

```text
04-place-poi-management-v1.png
```

Role:

```text
Place administration and Place UX/workflow authority
```

Primary phases:

```text
Phase 0B
expanded in Phase 1–2
```

Use this board for:

- Place list/detail;
- Place editing;
- spatial context;
- coordinate/map interaction;
- source presentation;
- verification presentation;
- publication presentation;
- public/admin Place consistency.

A Place must remain a spatial/domain object rather than becoming a generic CMS article.

Place presentation must preserve the independent concepts of:

```text
source
verification
publication
geometry
history
```

---

# 10. Series 05 — Excel Import & Data QA

Canonical file:

```text
05-excel-import-data-qa-v1.png
```

Role:

```text
Bulk ingestion workflow authority
```

Primary phase:

```text
Phase 0C
```

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

Critical rule:

```text
Commit != Publish
```

The visual workflow must not imply that importing data automatically:

- verifies it;
- publishes it;
- overwrites authoritative geometry;
- creates a published dataset release.

Excel is an ingestion interface, not the database schema.

---

# 11. Series 06 — Spatial Dataset & Release Management

Canonical file:

```text
06-spatial-dataset-release-management-v1.png
```

Role:

```text
Dataset/release lifecycle authority
```

Primary relevance:

```text
Phase 0A
Phase 1
Phase 2
```

Canonical lifecycle:

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

Critical rules:

```text
Dataset != Release

Release Candidate != Published Release

Published Release = immutable
```

Do not bypass release authority through manual object-storage uploads.

Object storage contains artifacts; repository/domain release state determines what those artifacts mean.

---

# 12. Series 07 — Operations, Diagnostics & Security

Canonical file:

```text
07-operations-diagnostics-security-v1.png
```

Role:

```text
Operations and security visual authority
```

Primary phase:

```text
Phase 0.5
```

Supporting relevance:

```text
All future phases
```

Series 07 should guide:

- provider/configuration state;
- diagnostics;
- health presentation;
- security boundaries;
- deployment status;
- storage/database/provider state;
- operational warnings;
- evidence status.

Preserve:

```text
Configured != Healthy

System Health != Data Quality

Deployed != Functionally Verified
```

Admin diagnostics must not become an unrestricted SQL, shell, provider, or secret console.

---

# 13. Series 08 — Mobile & Responsive Experience

Canonical file:

```text
08-mobile-responsive-experience-v1.png
```

Role:

```text
Responsive transformation authority
```

Phase relevance:

```text
All user-facing phases
```

Typical transformations include:

```text
Desktop Drawer
→ Tablet Side Panel
→ Mobile Bottom Sheet

Desktop Table
→ Mobile Cards
```

Mobile may use a lower-cost 3D quality profile, but must preserve the same semantic truth.

Responsive simplification must not remove:

- verification meaning;
- source meaning;
- publication state;
- UNKNOWN;
- critical warnings;
- accessible controls.

---

# 14. Series 09 — Property Registry & Property Intelligence

Canonical file:

```text
09-property-registry-intelligence-v1.png
```

Role:

```text
Future Property product authority
```

Primary phases:

```text
Phase 3
Phase 4
```

This board is future-phase guidance.

Do not implement Property functionality during Phase 0.5 or Phase 1 merely because this visual exists.

Future Property implementations must preserve:

```text
Property != Parcel

Property != Listing

Seller Claim != Verified Fact

Asking Price != Market Value
```

Digitized or seller-supplied parcel geometry must not be presented as an authoritative legal cadastral boundary unless the evidence supports that claim.

---

# 15. Series 10 — AI Advisor & AI Control Center

Canonical file:

```text
10-ai-advisor-control-center-v1.png
```

Role:

```text
Future grounded-AI UX and governance authority
```

Primary phase:

```text
Phase 4
```

This visual is subordinate to the AI security architecture.

Future AI may:

- retrieve;
- explain;
- compare;
- summarize;
- orchestrate explicit typed tools.

Future AI must not automatically:

- verify;
- publish;
- mutate authoritative geometry;
- invent legal facts;
- invent valuation facts;
- read secrets;
- receive generic database authority;
- receive arbitrary SQL/RPC/HTTP/browser/shell authority.

The presence of an AI screen in the visual library does not authorize AI implementation.

---

## 16. Phase-to-visual map

Use this as the quick routing table:

| Phase | Primary visual authorities |
|---|---|
| Phase 0A — Spatial infrastructure | Series 00, 06, 07 |
| Phase 0B — Place / spatial content | Series 00, 02, 03, 04 |
| Phase 0C — Excel ingestion / QA | Series 00, 02, 05 |
| Phase 0.5 — Deployment/provider hardening | Series 00, 02, 07, 08 when UI is affected |
| Phase 1 — Tà Xùa 3D | Series 00, 01 v2, 04, 06, 08; limited Series 03 presentation |
| Phase 2 — Digital Twin / Spatial Intelligence | Series 00, 01 v2, 03 v2, 06, 08 |
| Phase 3 — Property Registry | Series 00, 02 v2, 03 v2, 09 |
| Phase 4 — Property Intelligence + AI | Series 00, 01 v2, 02 v2, 09, 10 |
| Phase 5 — Brokerage | Future specification required |

Visual relevance does not override phase authorization.

---

## 17. Skill/plugin routing for visual work

Visual boards define desired product presentation.

Skills/plugins help implement or evaluate that presentation.

Recommended responsibilities:

```text
Superpowers
→ primary implementation/TDD/debugging workflow

Ponytail
→ minimalism constraint

Build Web Apps
→ frontend engineering

frontend-design-pro
→ responsive/forms/touch/accessibility

Designer Skill
→ visual polish

3dviz-pro-max
→ 3D reasoning/camera/material/lighting/LOD/observed scene quality

Playwright
→ browser verification

Matt code-review
→ final substantial review
```

The boards do not transfer authority to any Skill.

For 3D work, read:

```text
docs/agents/SPATIAL_3D_WORKFLOW.md
```

For general Skill routing, read:

```text
docs/agents/SKILL_ROUTING.md
```

---

## 18. 3D-specific visual rule

For Series 01 and later spatial-3D work:

```text
POSTGIS / RELEASE
→ authoritative data

CESIUM
→ primary 3D geospatial client

3DVIZ-PRO-MAX
→ specialist presentation reasoning
```

Do not let a 3D recipe silently replace Cesium with a parallel Three.js/Vite architecture.

If a 3D specialist recommends a generic/Three.js technique, translate the useful principle into the accepted Cesium architecture when appropriate.

---

## 19. How Codex should use a board

For a visual implementation task:

```text
1. Read AGENTS.md

2. Read CONTEXT.md

3. Read docs/status/CURRENT.md

4. Confirm current phase

5. Identify the primary visual board

6. Read the relevant textual visual catalog/handoff context

7. Inspect current implementation

8. Separate:
   - authoritative semantics
   - intended interaction
   - visual treatment
   - illustrative sample data

9. Implement through the normal Skill routing

10. Verify the actual browser result
```

Do not code directly from an image without reconciling it with repository reality.

---

## 20. What visual fidelity means

Fidelity does not mean copying every pixel.

A successful implementation should preserve:

```text
semantic separation
information hierarchy
workflow
interaction
responsive behavior
status meaning
spatial context
design-system language
```

Exact spacing, sizing, and component detail may adapt to current approved design tokens and implementation constraints.

Do not sacrifice usability, accessibility, performance, or domain correctness just to imitate a generated board literally.

---

## 21. Visual verification

For substantial user-facing changes, verify actual rendered output.

Depending on the task, inspect relevant:

- desktop layout;
- tablet layout;
- mobile layout;
- selected state;
- empty state;
- loading state;
- error state;
- review state;
- dense data state;
- 3D terrain state;
- map/list interaction;
- drawer/bottom-sheet behavior.

Use focused Playwright verification where appropriate.

Do not claim a visual result was observed if it was not actually rendered and inspected.

---

## 22. Responsive verification

For important public/Admin UI changes, use representative viewports rather than assuming desktop CSS is sufficient.

Check:

- overflow;
- clipped controls;
- touch targets;
- map interaction;
- drawer/bottom-sheet behavior;
- table/card transformation;
- text readability;
- critical status visibility;
- accessible focus.

Mobile may simplify layout.

It must not simplify truth.

---

## 23. Accessibility rule

Visual specifications are not allowed to override accessibility requirements.

Critical meaning should not rely on color alone.

Interactive controls should remain:

- keyboard operable where applicable;
- correctly labelled;
- focus visible;
- touch usable;
- understandable in degraded states.

Important spatial information should have a usable textual/UI representation when practical.

---

## 24. Performance rule

For map/3D work:

```text
visual fidelity
must coexist with
runtime performance
```

Prefer:

- lazy Cesium loading;
- progressive loading;
- clustering;
- LOD;
- bounded AOI;
- high-detail hotspots;
- responsive quality profiles.

Do not load whole-region high-detail assets merely because the visual board looks rich.

---

## 25. Historical handoff relationship

The detailed visual interpretation remains preserved in the archived handoff package, especially:

```text
03_VISUAL_SPEC_CATALOG.md
04_PHASE_CODE_EXECUTION_MATRIX.md
06_OPEN_DECISIONS_AND_RISKS.md
```

This README is a lightweight repository entry point.

It should not erase or rewrite the historical handoff.

If deeper interpretation is needed, consult the archived canonical handoff documents.

---

## 26. Update policy

Update this README only when:

- a visual board is formally replaced;
- a new series is approved;
- authority routing changes;
- a phase/visual relationship is formally changed;
- a durable visual interpretation needs clarification.

Do not update it for temporary branch state, PR state, or current blockers.

Those belong in:

```text
docs/status/CURRENT.md
```

---

## 27. Final visual mantra

```text
ARCHITECTURE
→ defines truth

DATA / RELEASE
→ defines authoritative content

VISUAL SPEC
→ defines intended presentation

SKILLS / PLUGINS
→ help implement it

BROWSER VERIFICATION
→ proves what actually rendered
```

And for LAND:

```text
Spatial truth first.
Visual clarity second.
Visual spectacle never overrides truth.
```
