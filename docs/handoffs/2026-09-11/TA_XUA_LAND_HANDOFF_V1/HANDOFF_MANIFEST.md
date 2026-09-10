# TÀ XÙA LAND — HANDOFF MANIFEST

Package: **TA_XUA_LAND_HANDOFF_V1**
Snapshot date: **2026-09-11**
Purpose: complete context-transfer package for a new ChatGPT/Codex/development conversation.

---

# 1. TRANSFER STATUS

```text
PROJECT:
TÀ XÙA LAND

HANDOFF VERSION:
1.0

CURRENT PHASE AT SNAPSHOT:
Phase 0.5 — Production Deployment Hardening

PHASE 1:
NOT STARTED

CURRENT SNAPSHOT PR:
#2 — Phase 0.5: production deployment hardening

SNAPSHOT BRANCH:
feat/phase-0-5-production-deployment

SNAPSHOT HEAD:
fb81e012c59d880a2b4b2e48e035c6cf6332f053

SNAPSHOT PR STATE:
OPEN + DRAFT + NOT MERGED

ARCHITECTURE:
FROZEN unless explicitly reopened

VISUAL LIBRARY:
00–10 COMPLETE

TRANSFER PACKAGE STATUS:
READY FOR NEW CONVERSATION
```

Important:

The repository may advance after this snapshot.

The new session must verify current Git/PR state before implementing anything.

---

# 2. PACKAGE CONTENTS

The canonical handoff contains:

```text
9 Markdown handoff/control files
11 canonical visual specification boards
1 long-form architecture/source document
```

Recommended directory:

```text
TA_XUA_LAND_HANDOFF_V1/
│
├── HANDOFF_MANIFEST.md
├── 00_READ_ME_FIRST.md
├── 01_CURRENT_REPO_STATE.md
├── 02_ARCHITECTURE_AND_SEMANTIC_RULES.md
├── 03_VISUAL_SPEC_CATALOG.md
├── 04_PHASE_CODE_EXECUTION_MATRIX.md
├── 05_PHASE_0_5_CLOSEOUT.md
├── 06_OPEN_DECISIONS_AND_RISKS.md
├── 07_NEXT_SESSION_BOOTSTRAP_PROMPT.md
│
├── source/
│   └── TA_XUA_LAND_ARCHITECTURE_SOURCE_NOTES_2026-09-11.docx
│
└── visual-specs/
    ├── 00-design-system-v1.png
    ├── 01-public-map-3d-experience-v2.png
    ├── 02-admin-system-overview-v2.png
    ├── 03-spatial-truth-verification-v2.png
    ├── 04-place-poi-management-v1.png
    ├── 05-excel-import-data-qa-v1.png
    ├── 06-spatial-dataset-release-management-v1.png
    ├── 07-operations-diagnostics-security-v1.png
    ├── 08-mobile-responsive-experience-v1.png
    ├── 09-property-registry-intelligence-v1.png
    └── 10-ai-advisor-control-center-v1.png
```

If the original long-form source document has a different current filename, keep the bytes unchanged and rename only when creating the transfer archive.

---

# 3. REQUIRED READ ORDER

A new session must read:

```text
1. HANDOFF_MANIFEST.md
2. 00_READ_ME_FIRST.md
3. 01_CURRENT_REPO_STATE.md
4. 02_ARCHITECTURE_AND_SEMANTIC_RULES.md
5. 03_VISUAL_SPEC_CATALOG.md
6. 04_PHASE_CODE_EXECUTION_MATRIX.md
7. 05_PHASE_0_5_CLOSEOUT.md
8. 06_OPEN_DECISIONS_AND_RISKS.md
9. 07_NEXT_SESSION_BOOTSTRAP_PROMPT.md
```

Then inspect the repository.

The long-form source document is deeper reference and should not replace the condensed handoff order.

---

# 4. FILE PURPOSE MATRIX

| File | Role | Change frequency | Authority |
|---|---|---:|---|
| `HANDOFF_MANIFEST.md` | Package index + transfer instructions | Low | Handoff navigation |
| `00_READ_ME_FIRST.md` | Project orientation + rules of engagement | Low | Continuity rules |
| `01_CURRENT_REPO_STATE.md` | Snapshot of repo/deployment/provider state | High | Snapshot only |
| `02_ARCHITECTURE_AND_SEMANTIC_RULES.md` | Condensed architecture constitution | Low | High semantic authority |
| `03_VISUAL_SPEC_CATALOG.md` | Canonical interpretation of images 00–10 | Medium | Visual authority map |
| `04_PHASE_CODE_EXECUTION_MATRIX.md` | Phase -> code scope -> gates | Medium | Scope authority |
| `05_PHASE_0_5_CLOSEOUT.md` | Immediate current task/gates | High until closed | Current execution authority |
| `06_OPEN_DECISIONS_AND_RISKS.md` | Decided/open/deferred/risk registry | Medium | Decision continuity |
| `07_NEXT_SESSION_BOOTSTRAP_PROMPT.md` | Prompt for new conversation | Low | Transfer protocol |

---

# 5. VISUAL SPECIFICATION LIBRARY

Canonical visual library name:

```text
TÀ XÙA LAND Visual Specification Library v1
```

## Series 00

```text
00-design-system-v1.png
```

Role:

Design system / visual language / components / status semantics.

Authority:

Highest visual authority.

Used by:

all phases.

---

## Series 01 v2

```text
01-public-map-3d-experience-v2.png
```

Role:

Public Map & 3D Experience.

Primary phase:

Phase 1.

Expanded:

Phase 2.

Future previews:

Property / AI.

Important:

Future previews do not move Property/AI into Phase 1.

---

## Series 02 v2

```text
02-admin-system-overview-v2.png
```

Role:

Admin System Overview.

Authority:

**GLOBAL ADMIN INFORMATION ARCHITECTURE AUTHORITY**

If another board conflicts on the global sidebar:

Series 02 wins.

---

## Series 03 v2

```text
03-spatial-truth-verification-v2.png
```

Role:

Spatial Truth Verification Workspace.

Authority:

Spatial Verification workflow.

Critical semantics:

```text
Declared != Observed != Verified
Candidate != Authoritative
AI != Verifier
```

Global navigation caveat:

Series 02 wins.

---

## Series 04

```text
04-place-poi-management-v1.png
```

Role:

Place / POI management.

Primary phase:

Phase 0B, expanded in Phase 1–2.

---

## Series 05

```text
05-excel-import-data-qa-v1.png
```

Role:

Excel Import & Data QA.

Primary phase:

Phase 0C.

Canonical flow:

```text
Upload -> Inspect -> Map -> Validate -> Stage -> Review -> Commit
```

Commit != Publish.

---

## Series 06

```text
06-spatial-dataset-release-management-v1.png
```

Role:

Dataset/release lifecycle.

Primary relevance:

Phase 0A, Phase 1, Phase 2.

Canonical flow:

```text
Source -> Raw -> Normalized -> Derived -> QA -> Release Candidate -> Published Release -> Public Delivery
```

Published Release = immutable.

---

## Series 07

```text
07-operations-diagnostics-security-v1.png
```

Role:

Operations, diagnostics and security.

Primary current phase:

Phase 0.5.

Critical:

Configured != Healthy.

Runtime credential != release operator credential.

---

## Series 08

```text
08-mobile-responsive-experience-v1.png
```

Role:

Responsive authority.

Critical:

layout may change;
facts do not.

---

## Series 09

```text
09-property-registry-intelligence-v1.png
```

Role:

Future Property Registry + Property Intelligence.

Primary phases:

Phase 3 / Phase 4.

Critical:

```text
Property != Parcel != Listing
Asking Price != Market Value
```

---

## Series 10

```text
10-ai-advisor-control-center-v1.png
```

Role:

Future grounded AI / AI governance.

Primary phase:

Phase 4.

Critical:

AI is read-only against explicit authoritative tools.

No direct SQL / arbitrary HTTP / verification / publication.

---

# 6. VISUAL VERSION STATUS

```text
00 v1 — canonical
01 v2 — canonical, replaces old 01
02 v2 — canonical, replaces old 02
03 v2 — canonical, replaces old 03
04 v1 — canonical
05 v1 — canonical
06 v1 — canonical
07 v1 — canonical
08 v1 — canonical
09 v1 — canonical future spec
10 v1 — canonical future spec
```

Do not attach old 01/02/03 to the new working conversation unless clearly labeled ARCHIVED.

---

# 7. ARCHIVED VISUAL RULE

If older boards must be preserved for history:

store separately:

```text
visual-specs/archive/
```

Example:

```text
archive/01-public-map-original.png
archive/02-admin-original.png
archive/03-verification-original.png
```

Do not mix them with canonical visual filenames.

---

# 8. SOURCE DOCUMENT

The long-form architecture/source notes should be included as historical/deep context.

Recommended transfer name:

```text
source/TA_XUA_LAND_ARCHITECTURE_SOURCE_NOTES_2026-09-11.docx
```

Role:

- deeper architecture reasoning;
- historical decisions;
- original phase evolution;
- reference for details omitted from condensed handoff.

It is not the first file to read.

`02_ARCHITECTURE_AND_SEMANTIC_RULES.md` is the condensed implementation-oriented architecture authority.

---

# 9. REPOSITORY REFERENCE

Repository:

```text
vtmedia0910/TaXuaLand
```

Snapshot branch:

```text
feat/phase-0-5-production-deployment
```

Snapshot head:

```text
fb81e012c59d880a2b4b2e48e035c6cf6332f053
```

Snapshot PR:

```text
#2 — Phase 0.5: production deployment hardening
```

Before doing work:

re-check remote state.

Do not assume the handoff SHA is still current.

---

# 10. REPOSITORY DOCUMENTS TO READ

After the handoff files, inspect current versions of at least:

```text
README.md
ARCHITECTURE.md
AGENTS.md
SECURITY.md
docs/PHASE_0_SPATIAL_FOUNDATION.md
docs/operations/implementation-status.md
docs/operations/acceptance.md
docs/operations/known-limitations.md
docs/operations/phase-0-architecture-freeze.md
docs/operations/deployment.md
docs/operations/managed-postgis.md
docs/operations/object-storage.md
docs/operations/observability.md
docs/operations/phase-0-5-h-prerequisites.md
any newer phase-0-5 provider acceptance report
current PR diff
relevant ADRs
relevant migrations/contracts
```

Repository contracts win for current implementation details.

---

# 11. CURRENT PROVIDER SNAPSHOT

Known staging architecture:

```text
Application Hosting:
Vercel

Managed PostgreSQL/PostGIS:
Supabase

Object Storage:
Cloudflare R2

Private Bucket:
taxua-land-staging-private

Published Bucket:
taxua-land-staging-published

Application DB runtime role:
land_app
```

Current provider acceptance:

```text
Vercel: PASS
Admin authentication: PASS
Database/PostGIS: PASS
R2 complete provider lifecycle: requires final independent evidence
Overall Phase 0.5: NOT CLOSED
```

Do not include credentials in the transfer package.

---

# 12. SECRET EXCLUSION LIST

The handoff package must NOT contain:

- database passwords;
- password-bearing DATABASE_URL;
- Admin password;
- R2 secret access keys;
- R2 access key IDs if considered sensitive in the operating process;
- Vercel token;
- Supabase owner credentials;
- provider master tokens;
- signed private URLs;
- private legal documents;
- seller/buyer PII.

Secrets should be injected securely only when needed.

---

# 13. AUTHORITY ORDER SUMMARY

```text
1. Product/domain architecture
2. Current repository contracts / ADRs / migrations / tests
3. Series 00 Design System
4. Series 02 v2 Global Admin IA
5. Relevant domain visual
6. Supporting visuals
7. Sample values inside generated images
```

---

# 14. NON-NEGOTIABLE SEMANTIC SUMMARY

```text
LAND = Spatial Authority

Declared != Observed != Verified
Source Authority != Verification
Published != Verified
Candidate != Authoritative
Unknown != Zero

Import Commit != Publish

Dataset != Release
Release Candidate != Published
Published Release = Immutable

Place Point != Access Point
Straight Distance != Network Distance
Road Mapping != Road Safety
Aspect != View
Viewshed != Guaranteed View

Property != Parcel != Listing
Seller Claim != Verified Fact
Asking Price != Market Value

AI != Spatial Authority
AI != Verifier
AI != Publisher
AI != Legal Authority
AI must not have arbitrary SQL/RPC/HTTP/browser/shell/secrets
```

---

# 15. PHASE SUMMARY

```text
Phase 0A — Spatial Infrastructure
Phase 0B — Spatial Content
Phase 0C — Bulk Ingestion
Phase 0.5 — Deployment Hardening [CURRENT]
Phase 1 — Tà Xùa 3D [NEXT, GATED]
Phase 2 — Digital Twin / Spatial Intelligence
Phase 3 — Property Registry
Phase 4 — Property Intelligence + AI
Phase 5 — Brokerage
```

No Phase 5 visual board yet.

---

# 16. CURRENT HANDOFF GATE

Before Phase 1:

```text
[ ] close R2/provider acceptance
[ ] verify published operator separation
[ ] finalize sanitized report
[ ] run repo QA
[ ] PR #2 ready/reviewed
[ ] merge PR #2
[ ] clean Phase 1 baseline
```

See:

```text
05_PHASE_0_5_CLOSEOUT.md
```

---

# 17. TRANSFER PROCEDURE

Recommended procedure for the owner:

1. Create one folder named:

```text
TA_XUA_LAND_HANDOFF_V1
```

2. Place all 9 Markdown files at root.

3. Place source architecture document in:

```text
source/
```

4. Place canonical images 00–10 in:

```text
visual-specs/
```

5. Do not include archived 01/02/03 unless necessary.

6. Open the new conversation.

7. Attach:
   - all Markdown files;
   - the source DOCX;
   - all 11 canonical images.

8. Paste the short prompt from:

```text
07_NEXT_SESSION_BOOTSTRAP_PROMPT.md
```

9. Require the new session to inspect the repository before coding.

10. Do not provide secrets in chat.

---

# 18. MINIMUM TRANSFER PACKAGE

If attachment limits force a smaller package, minimum priority is:

```text
HANDOFF_MANIFEST.md
00_READ_ME_FIRST.md
01_CURRENT_REPO_STATE.md
02_ARCHITECTURE_AND_SEMANTIC_RULES.md
03_VISUAL_SPEC_CATALOG.md
04_PHASE_CODE_EXECUTION_MATRIX.md
05_PHASE_0_5_CLOSEOUT.md
06_OPEN_DECISIONS_AND_RISKS.md
07_NEXT_SESSION_BOOTSTRAP_PROMPT.md

Visuals:
00
01 v2
02 v2
03 v2
07

Then add 04/05/06/08/09/10 as needed.
```

For immediate Phase 0.5 work, Series 07 is most important.

For Phase 1 planning after closeout, attach Series 01 v2 + 00 + 04 + 06 + 08.

---

# 19. PHASE-SPECIFIC VISUAL ATTACHMENT SETS

## Phase 0.5

Attach:

```text
00
02
06
07
```

Primary:
07.

## Phase 1

Attach:

```text
00
01 v2
04
06
08
```

Optional:
03 for trust-state presentation.

## Phase 2

Attach:

```text
00
01 v2
03 v2
06
07
08
```

## Phase 3

Attach:

```text
00
02 v2
03 v2
06
08
09
```

## Phase 4

Attach:

```text
00
01 v2
02 v2
03 v2
06
07
08
09
10
```

This reduces context load while keeping relevant authority.

---

# 20. FILE UPDATE POLICY AFTER TRANSFER

The handoff package is a snapshot.

After significant milestones:

update:

```text
01_CURRENT_REPO_STATE.md
05_PHASE_0_5_CLOSEOUT.md or current phase closeout
06_OPEN_DECISIONS_AND_RISKS.md
HANDOFF_MANIFEST.md
```

Architecture file should change only after approved architecture decision/ADR.

Visual Catalog should change only when a visual board is revised/accepted.

Phase Matrix should change only when roadmap/scope is explicitly changed.

---

# 21. SUGGESTED FUTURE HANDOFF VERSIONING

After Phase 0.5 merge:

```text
TA_XUA_LAND_HANDOFF_V1_1
```

or create:

```text
TA_XUA_LAND_HANDOFF_PHASE1_BASELINE
```

After major architecture/product phase change:

```text
TA_XUA_LAND_HANDOFF_V2
```

Do not rewrite old snapshots without versioning.

---

# 22. TRANSFER ACCEPTANCE CHECK

A new session has successfully received the project only if it can answer correctly:

```text
What is TÀ XÙA LAND?

Why is LAND the spatial authority?

What is the current phase?

Why can Phase 1 not start yet?

Which PR/branch/SHA was the handoff snapshot?

What does the local R2 TLS failure mean?

What is the credential separation rule?

What is Declared vs Observed vs Verified?

Why is Published different from Verified?

Why is Import Commit not Publish?

Why is Dataset different from Release?

Why are published releases immutable?

Which board owns global Admin IA?

Which board owns Spatial Verification?

Why are Property and AI out of current scope?

What is the next safe action?
```

If the session cannot answer those questions:

do not let it begin implementation.

---

# 23. FINAL TRANSFER CARD

```text
TÀ XÙA LAND
HANDOFF V1

TEXT FILES:
9

VISUAL SPECS:
11

SOURCE DOC:
1

CURRENT PHASE:
0.5

NEXT PHASE:
1 — gated

ARCHITECTURE:
frozen

GLOBAL ADMIN VISUAL:
Series 02 v2

PUBLIC MAP VISUAL:
Series 01 v2

SPATIAL TRUTH VISUAL:
Series 03 v2

OPERATIONS VISUAL:
Series 07

PROPERTY:
future Phase 3/4

AI:
future Phase 4

BROKERAGE:
future Phase 5

IMMEDIATE ACTION:
Close Phase 0.5 -> merge PR #2 -> establish Phase 1 baseline
```

---

# 24. FINAL STATEMENT

The purpose of this package is to make a new conversation behave like a continuation of the same project.

It should preserve:

- product intent;
- spatial semantics;
- security boundaries;
- repository reality;
- visual consistency;
- phase discipline;
- unresolved risks.

The package does not replace the repository.

The repository does not replace the architecture.

The visuals do not replace the data model.

AI does not replace spatial truth.

**TÀ XÙA LAND is built from trusted spatial data upward.**
