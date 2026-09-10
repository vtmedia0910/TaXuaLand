# TÀ XÙA LAND — NEXT SESSION BOOTSTRAP PROMPT

Handoff version: 1.0
Purpose: copy/paste this prompt into a new ChatGPT/Codex working conversation together with the handoff package and canonical visual boards.

---

# 1. SHORT COPY/PASTE PROMPT

Use this version when all handoff files and images have already been attached to the new conversation.

```text
You are taking over an existing TÀ XÙA LAND architecture/code session.

Do not code immediately.

TÀ XÙA LAND is an independent geospatial/spatial-intelligence platform whose long-term progression is:
Digital Twin -> Spatial Intelligence -> Property Registry -> Property Intelligence -> Brokerage.

LAND is the spatial authority.
BIKER owns mobility/live-local use cases.
TRIP owns travel-commerce/itinerary use cases.
Do not merge their databases or credentials.

First read the attached handoff files in this exact order:

1. HANDOFF_MANIFEST.md
2. 00_READ_ME_FIRST.md
3. 01_CURRENT_REPO_STATE.md
4. 02_ARCHITECTURE_AND_SEMANTIC_RULES.md
5. 03_VISUAL_SPEC_CATALOG.md
6. 04_PHASE_CODE_EXECUTION_MATRIX.md
7. 05_PHASE_0_5_CLOSEOUT.md
8. 06_OPEN_DECISIONS_AND_RISKS.md

Then inspect the current repository:

vtmedia0910/TaXuaLand

Snapshot branch from the handoff:
feat/phase-0-5-production-deployment

Snapshot SHA:
fb81e012c59d880a2b4b2e48e035c6cf6332f053

Snapshot PR:
#2 — Phase 0.5: production deployment hardening

IMPORTANT:
The snapshot may be stale. Re-check the actual remote branch/PR before acting.
Repository reality wins for current implementation state.

Architecture/domain semantics are frozen unless explicitly reopened by the user.

Authority order:

1. Architecture/domain semantics
2. Current repository contracts/ADRs/migrations/tests
3. Series 00 Design System
4. Series 02 v2 for global Admin IA
5. Domain-specific visual board
6. Other visual references
7. Sample text/counts/dates in generated images

Visual rules:

- Series 01 v2 = Public Map & 3D Experience authority
- Series 02 v2 = global Admin Information Architecture authority
- Series 03 v2 = Spatial Verification workflow authority
- If Series 03 sidebar conflicts with Series 02, Series 02 wins globally
- Series 04 = Place/POI
- Series 05 = Excel Import/Data QA
- Series 06 = Dataset/Release
- Series 07 = Operations/Diagnostics/Security
- Series 08 = Responsive
- Series 09 = future Property
- Series 10 = future AI

Generated visual sample values are illustrative only.
Do not hard-code them as real data.

Non-negotiable semantic rules:

Declared != Observed != Verified
Source Authority != Verification
Published != Verified
Import Commit != Publish
Dataset != Release
Release Candidate != Published Release
Published Release = immutable
Property != Parcel != Listing
Seller Claim != Verified Fact
Asking Price != Market Value
Straight Distance != Network Distance
Road Mapping != Road Safety
Aspect != View
Viewshed != Guaranteed Real-World View
Unknown != Zero
AI != Spatial Authority
AI must not verify, publish, move authoritative geometry, read secrets, run arbitrary SQL/RPC/HTTP/browser/shell, or invent legal/valuation facts.

Current handoff state:
Phase 0.5 is not closed.
Phase 1 has not started.
PR #2 was open + draft + unmerged at the snapshot.

The known local Windows machine cannot complete TLS handshake to the Cloudflare R2 S3 endpoint.
Do NOT classify this automatically as Cloudflare R2 provider failure.
Independent cloud R2 acceptance is the intended evidence.

The immediate task is to close Phase 0.5 cleanly before Phase 1.

After reading the handoff and inspecting the repository, respond with ONLY these sections before modifying anything:

A. PROJECT UNDERSTANDING
- Explain LAND in 8–15 bullets.
- Explain LAND/BIKER/TRIP boundary.

B. CURRENT REPOSITORY STATE
- current branch
- current HEAD
- PR state
- whether snapshot changed
- important implementation modules
- current deployment/provider state

C. ARCHITECTURE CONSTRAINTS
- list the 15–25 constraints most relevant to the immediate task

D. CURRENT BLOCKERS
- distinguish PASS / PARTIAL / OPEN / UNKNOWN
- especially Phase 0.5 provider/R2/credential evidence

E. VISUAL AUTHORITY
- identify which visual boards are relevant now
- explicitly state which future boards are out of scope

F. NEXT ACTION PLAN
- propose the smallest safe sequence to close Phase 0.5
- no Phase 1 work

G. QUESTIONS / REQUIRED OWNER ACTION
- only if genuinely necessary

Do not modify code, provider configuration, Git branches, reports or deployment until I explicitly confirm the next action.
```

---

# 2. FULL CONTINUATION PROMPT

Use the full version below when you want the new session to be extremely strict and behave like a continuation agent rather than a fresh consultant.

```text
CONTEXT TRANSFER — TÀ XÙA LAND

You are continuing a mature architecture and implementation session.
Your job is continuity, not reinvention.

PROJECT
TÀ XÙA LAND

REPOSITORY
vtmedia0910/TaXuaLand

HANDOFF SNAPSHOT DATE
2026-09-11

SNAPSHOT BRANCH
feat/phase-0-5-production-deployment

SNAPSHOT HEAD
fb81e012c59d880a2b4b2e48e035c6cf6332f053

SNAPSHOT PR
#2 — Phase 0.5: production deployment hardening

SNAPSHOT PR STATE
OPEN
DRAFT
NOT MERGED

CURRENT PRODUCT PHASE AT HANDOFF
Phase 0.5

PHASE 1
NOT STARTED

==================================================
STEP 1 — READ THE HANDOFF
==================================================

Read attached files in this exact order:

1. HANDOFF_MANIFEST.md
2. 00_READ_ME_FIRST.md
3. 01_CURRENT_REPO_STATE.md
4. 02_ARCHITECTURE_AND_SEMANTIC_RULES.md
5. 03_VISUAL_SPEC_CATALOG.md
6. 04_PHASE_CODE_EXECUTION_MATRIX.md
7. 05_PHASE_0_5_CLOSEOUT.md
8. 06_OPEN_DECISIONS_AND_RISKS.md

If the long-form source architecture document is attached, use it for deeper reference after the condensed handoff files.

Do not silently override the handoff with generic best practices.

==================================================
STEP 2 — INSPECT CURRENT REPOSITORY
==================================================

Inspect current remote state before using snapshot values as fact.

Check at minimum:

- PR #2
- current head branch and SHA
- main/base SHA
- README.md
- ARCHITECTURE.md
- AGENTS.md
- SECURITY.md
- docs/PHASE_0_SPATIAL_FOUNDATION.md
- docs/operations/implementation-status.md
- docs/operations/acceptance.md
- docs/operations/known-limitations.md
- docs/operations/phase-0-architecture-freeze.md
- docs/operations/deployment.md
- docs/operations/managed-postgis.md
- docs/operations/object-storage.md
- docs/operations/observability.md
- docs/operations/phase-0-5-h-prerequisites.md
- any newer Phase 0.5 provider-acceptance report
- current PR diff
- relevant current package/domain/storage contracts

If you cannot access the repository, say exactly what is missing.
Do not invent current repo state.

If remote state has changed since the handoff:
use current repository state for implementation facts,
but preserve frozen architecture semantics unless an approved ADR changed them.

==================================================
STEP 3 — UNDERSTAND PRODUCT IDENTITY
==================================================

TÀ XÙA LAND is:

- a geospatial platform;
- a spatial authority;
- a Tà Xùa Digital Twin foundation;
- a spatial verification system;
- a dataset/release platform;
- later a Property Registry;
- later a Property Intelligence system;
- later a grounded AI explanation layer.

It is not initially:

- a generic tourism CMS;
- a hotel booking product;
- a Google Maps clone;
- a generic property portal;
- an AI-first database;
- a brokerage CRM.

Ecosystem:

LAND = spatial authority
BIKER = mobility/live local
TRIP = travel commerce/itinerary

No shared database/service-role credentials between products.

==================================================
STEP 4 — PRESERVE AUTHORITY ORDER
==================================================

When information conflicts:

1. Product/domain architecture
2. Current repository contracts/ADRs/tests
3. Series 00 visual system
4. Series 02 v2 global Admin IA
5. Relevant domain visual
6. Supporting visual
7. AI-generated sample data

Never infer domain schema solely from an image.

==================================================
STEP 5 — VISUAL SPECIFICATION LIBRARY
==================================================

Canonical boards:

00 — Design System v1
01 — Public Map & 3D Experience v2
02 — Admin System Overview v2
03 — Spatial Truth Verification v2
04 — Place / POI Management v1
05 — Excel Import & Data QA v1
06 — Spatial Dataset & Release Management v1
07 — Operations, Diagnostics & Security v1
08 — Mobile & Responsive Experience v1
09 — Property Registry & Property Intelligence v1
10 — AI Advisor & AI Control Center v1

Rules:

Series 00:
visual/component authority.

Series 02:
global Admin IA authority.

Series 03:
Spatial Verification workflow authority.
Its sidebar does not override Series 02 global navigation.

Series 08:
responsive authority.

Series 09:
future Phase 3/4 Property authority.

Series 10:
future Phase 4 AI authority.

The images contain illustrative numbers and text.
Do not seed or hard-code those values without authoritative data.

==================================================
STEP 6 — PRESERVE SPATIAL TRUTH
==================================================

Non-negotiable:

DECLARED != OBSERVED != VERIFIED

Declared:
source claim.

Observed:
evidence/observation.

Verified:
authorized human verification outcome.

SOURCE AUTHORITY != VERIFICATION

PUBLISHED != VERIFIED

CANDIDATE != AUTHORITATIVE

DEVICE GPS != VERIFIED

EXTERNAL MAP != LAND AUTHORITY

AUTOMATED ANOMALY != DECISION

AI != VERIFIER

Do not silently move coordinates.

Do not auto-correct spatial truth.

==================================================
STEP 7 — PRESERVE GEOMETRY SEMANTICS
==================================================

Support semantic geometry:

POINT
LINESTRING
POLYGON
VIEWPOINT
ACCESS POINT
ROAD SEGMENT
PARCEL

Place point != access point.

Property reference point != Parcel polygon.

Aspect != view direction.

Viewshed != field-verified view.

Straight distance != network distance.

Road mapping != road safety.

==================================================
STEP 8 — PRESERVE INGESTION / RELEASE SEMANTICS
==================================================

Excel:

UPLOAD
-> INSPECT
-> MAP
-> VALIDATE
-> STAGE
-> REVIEW
-> COMMIT

Commit != Verify.
Commit != Publish.

Dataset lifecycle:

SOURCE
-> RAW
-> NORMALIZED
-> DERIVED
-> QA
-> RELEASE CANDIDATE
-> PUBLISHED RELEASE
-> PUBLIC DELIVERY

Dataset != Release.
Release Candidate != Published.
Published Release = immutable.

==================================================
STEP 9 — SECURITY
==================================================

Never expose or request secrets in normal chat.

Web runtime:
least privilege only.

Do not put in web runtime:

- DB owner/bootstrap credential;
- published release operator credential;
- provider master credential.

Private runtime storage credential != published operator credential.

Do not disable TLS as a workaround.

Do not create public write access.

==================================================
STEP 10 — AI BOUNDARY
==================================================

AI is future Phase 4.

Early AI tools are explicit and read-only.

Allowed conceptually:

search
retrieve
compare
explain
summarize
map fly-to
highlight
show approved layer

Forbidden:

arbitrary SQL
generic RPC
arbitrary HTTP
browser
shell
filesystem
secret access
verify
publish
authoritative geometry mutation
legal assertion
automatic valuation

AI must preserve UNKNOWN.

==================================================
STEP 11 — CURRENT PHASE 0.5 CONTEXT
==================================================

Known configured external stack at handoff:

Vercel:
ta-xua-land-web

Supabase:
taxua-land-staging

PostGIS:
configured

Application runtime DB role:
land_app

R2 private:
taxua-land-staging-private

R2 published:
taxua-land-staging-published

Temporary public staging base:
R2 development public URL recorded in the handoff

Known acceptance:

Vercel PASS
Admin login PASS
Database/PostGIS PASS

Known local problem:

Windows -> R2 S3 TLS handshake fails.

This is a local/client/network-path failure until independent evidence proves otherwise.

Previous local provider conclusion:

PARTIAL PASS

Do not erase this history.
Do not turn it into provider FAIL without evidence.

==================================================
STEP 12 — IMMEDIATE OBJECTIVE
==================================================

The next objective is:

CLOSE PHASE 0.5 CLEANLY.

Before Phase 1, establish:

- independent R2 private lifecycle PASS;
- published operator lifecycle PASS;
- public delivery PASS;
- exact-byte/integrity PASS;
- diagnostic cleanup PASS;
- deployed credential separation evidence;
- final sanitized provider report;
- repo checks;
- PR review;
- merge;
- clean Phase 1 baseline.

Do not start visual Phase 1 implementation before this.

==================================================
STEP 13 — NO SCOPE CREEP
==================================================

During Phase 0.5 closeout, do NOT:

- rebuild Series 01 UI;
- refactor all Admin UI to Series 02;
- implement Property;
- implement AI;
- add brokerage;
- redesign verification;
- switch providers without evidence;
- introduce new architecture.

Keep the task operationally narrow.

==================================================
STEP 14 — REQUIRED FIRST RESPONSE
==================================================

Before modifying anything, answer with these exact sections:

1. PROJECT UNDERSTANDING

Summarize the product, ecosystem boundary and spatial moat.

2. REPOSITORY REALITY CHECK

State:
- current PR;
- current branch;
- current SHA;
- whether handoff snapshot changed;
- key architecture files read.

3. CURRENT PHASE

State explicitly:
- whether Phase 0.5 is closed;
- whether Phase 1 is allowed to start.

4. PASSED EVIDENCE

List only things actually evidenced.

5. OPEN / UNKNOWN ITEMS

Do not call unknown checks failures.

6. ARCHITECTURE CONSTRAINTS

List the rules that control the immediate task.

7. VISUAL REFERENCES

State which boards matter to Phase 0.5.
State which are future/out of scope.

8. PROPOSED NEXT ACTION

Propose the smallest safe action.

9. OWNER INPUT REQUIRED

Only list truly required owner/provider actions.

DO NOT MODIFY ANYTHING UNTIL THE USER CONFIRMS.

==================================================
STEP 15 — AFTER USER APPROVAL
==================================================

Once the user approves the next action:

- make only the agreed changes;
- preserve architecture;
- do not expose secrets;
- provide exact evidence;
- separate PASS from UNKNOWN;
- keep report sanitized;
- stop if a hard security boundary is violated.

When Phase 0.5 is closed and merged, return to the Phase Code Execution Matrix and propose the Phase 1 implementation plan.

END CONTINUATION PROMPT
```

---

# 3. OPTIONAL FIRST MESSAGE FROM THE OWNER

The owner can attach the handoff package + visual boards and send:

```text
Tiếp quản dự án TÀ XÙA LAND theo 07_NEXT_SESSION_BOOTSTRAP_PROMPT.md.

Hãy đọc toàn bộ handoff theo thứ tự, kiểm tra repo hiện tại và chỉ trả về báo cáo tiếp quản theo format yêu cầu.

Chưa code, chưa sửa repo, chưa deploy, chưa thay provider, chưa bắt đầu Phase 1 cho đến khi tôi xác nhận.
```

---

# 4. WHAT A GOOD NEW-SESSION RESPONSE LOOKS LIKE

A good continuation response should immediately understand that:

- LAND is spatial authority;
- current phase is 0.5;
- Phase 1 is gated;
- Series 02 controls global Admin navigation;
- Series 03 controls verification workflow;
- R2 Windows TLS failure does not automatically mean provider failure;
- credential separation remains security-critical;
- Property and AI are future phases;
- visuals are specifications, not production facts.

A bad response would:

- start writing Phase 1 code;
- propose a new architecture without reading the repo;
- call R2 broken solely from the local TLS result;
- ask the owner to paste secrets into chat;
- treat visual counts as DB facts;
- merge Published and Verified;
- recommend direct AI SQL access.

---

# 5. FALLBACK IF THE NEW SESSION CANNOT ACCESS GITHUB

If repository access is unavailable:

Do not invent Git state.

Report:

```text
Repository inspection unavailable.
Handoff snapshot is the latest available context, but not independently verified.
```

Then request one of:

- GitHub connection;
- repository archive;
- relevant repo files/PR export.

Do not proceed with code based solely on a potentially stale snapshot.

---

# 6. FALLBACK IF SOME VISUALS ARE MISSING

If not all 00–10 boards were attached:

Do not recreate their contents from memory.

Use `03_VISUAL_SPEC_CATALOG.md` as a textual guide and ask for the missing primary board before visual implementation in that domain.

For Phase 0.5 closeout, Series 07 is the most relevant visual.

For Phase 1 planning, Series 01 v2 must be available.

---

# 7. TRANSFER SUCCESS CRITERIA

The transfer is successful when the new session can accurately state:

```text
Current phase
Current blocker
Repository authority
Visual authority
Spatial truth semantics
Import semantics
Release semantics
Security boundary
Future-phase boundaries
Next safe action
```

Only then should work continue.

End of Next Session Bootstrap Prompt.
