# TÀ XÙA LAND — PHASE 0.5 CLOSEOUT

Handoff version: 1.0
Snapshot: 2026-09-11
Current phase: Phase 0.5 — Production Deployment Hardening
Status at handoff: **NOT CLOSED**

---

# 0. PURPOSE

This file is the immediate next-task authority for the new working session.

Do not start Phase 1 until this document's critical closeout gates are completed or fresh repository evidence proves they have already been completed.

The purpose of Phase 0.5 is not to redesign Phase 0.

It is to prove that the frozen Phase 0 architecture works correctly with dedicated external providers, correct privileges, deployable configuration and reproducible operational evidence.

---

# 1. CURRENT GIT SNAPSHOT

Repository:

```text
vtmedia0910/TaXuaLand
```

Current PR:

```text
#2 — Phase 0.5: production deployment hardening
```

Snapshot state:

```text
state: open
draft: true
merged: false
mergeable: true
base: main
base SHA: f7080f8a1943d9d86e3c747882b615294a60bd21
head: feat/phase-0-5-production-deployment
head SHA: fb81e012c59d880a2b4b2e48e035c6cf6332f053
commits: 7
changed files: 64
```

PR's own scope statement:

```text
Phase 0 architecture remains frozen.
Phase 1 has not started.
```

The next session must re-check this state before acting.

If the branch moved after this handoff, use the newer remote state.

---

# 2. PHASE 0 FOUNDATION IS NOT THE BLOCKER

Repository documentation reports Phase 0 repository/local release-candidate acceptance complete.

The implementation ledger already covers:

- repository foundation;
- domain contracts;
- PostGIS;
- Admin auth;
- Place CRUD;
- source/dataset registries;
- Cesium shell;
- public Place;
- Admin spatial editor;
- Excel staging/review/commit;
- terrain/road pipeline;
- observability;
- performance;
- security/E2E;
- operations/release-candidate rehearsal.

Do not restart Phase 0.

Phase 0.5 is about provider/deployment evidence.

---

# 3. EXTERNAL RESOURCES ALREADY CREATED

The prior session/owner has already created dedicated LAND resources.

Do not repeat resource creation unless fresh inspection proves something has been removed.

## Vercel

Known project:

```text
ta-xua-land-web
```

Application root:

```text
apps/web
```

Known staging/deployed origin:

```text
https://ta-xua-land-web.vercel.app
```

Known operational observations:

- deployment reached Ready;
- `/` loaded;
- `/map` rendered;
- Admin login was successfully exercised.

## Supabase / PostGIS

Dedicated project:

```text
taxua-land-staging
```

Project ref:

```text
yobqpdhgjbtzvpvhddxg
```

Region:

```text
AWS ap-southeast-1 — Singapore
```

LAND migrations were applied.

Separate runtime role:

```text
land_app
```

Runtime DB connectivity was tested successfully.

Transaction pooler mode was selected for Vercel runtime.

## Cloudflare R2

Private bucket:

```text
taxua-land-staging-private
```

Published bucket:

```text
taxua-land-staging-published
```

Current temporary public staging delivery base:

```text
https://pub-d97ba289a3144692aa2d771011b6ae74.r2.dev
```

Separate credential roles were created for:

- private web runtime;
- published release operator.

No secret values belong in this document.

---

# 4. IMPORTANT HISTORICAL DOCUMENT CAVEAT

The repository currently contains:

```text
docs/operations/phase-0-5-h-prerequisites.md
```

That file was written before the owner completed the external provider setup.

It contains historical language indicating external staging access was blocked/missing.

That conclusion is stale as a statement about today's resource existence.

Since it was written, the owner completed substantial setup:

- Vercel project/deployment;
- Supabase project;
- migrations;
- runtime role;
- Admin bootstrap/login;
- R2 private/published buckets;
- R2 CORS/lifecycle;
- R2 scoped credentials;
- temporary public R2 delivery.

Therefore:

Use the prerequisites file as a historical checklist and architecture/safety reference.

Do not reuse its old "no provider access" conclusion without re-evaluation.

---

# 5. DATABASE ACCEPTANCE ALREADY ESTABLISHED

Known provider acceptance results include:

Supabase session pooler:

```text
PASS
```

Supabase transaction pooler:

```text
PASS
```

Runtime user:

```text
land_app
```

Application DB identity/readiness:

```text
PASS
```

Current intended Vercel mode:

```text
DATABASE_ENDPOINT_MODE=transaction
DATABASE_POOL_MAX=2
LAND_ENVIRONMENT=STAGING
```

TLS verification is enabled.

Do not disable certificate verification.

Do not replace least-privilege `land_app` with an owner role to simplify deployment.

---

# 6. ADMIN ACCEPTANCE ALREADY ESTABLISHED

LAND Admin account bootstrap completed.

Deployed Admin login was successfully tested.

The password is intentionally not documented here.

Do not recreate default Admin credentials or expose the existing credential in logs/reports.

---

# 7. R2 CONFIGURATION ALREADY ESTABLISHED

## Private bucket

Purpose:

- private import uploads;
- inspection/staging artifacts.

Known lifecycle intent:

```text
imports/raw/        delete after 7 days
imports/inspection/ delete after 7 days
multipart cleanup  after 7 days
```

Known browser CORS intent:

```text
origin: deployed LAND staging origin
method: PUT
signed headers: restricted
```

## Published bucket

Purpose:

- published immutable assets;
- diagnostic publication testing only when scoped.

Known browser/public delivery intent:

```text
GET
HEAD
Range
```

Temporary public staging delivery:

```text
r2.dev development URL
```

A future branded custom asset domain remains a later operational decision after an owner-controlled domain is available.

---

# 8. CREDENTIAL SEPARATION IS A HARD CLOSEOUT GATE

Two different R2 authority classes exist.

## A. PRIVATE RUNTIME

Used by normal web/server runtime.

Expected scope:

- private bucket operations required for imports.

## B. PUBLISHED OPERATOR

Used by explicit release/operator process.

Expected scope:

- published bucket write/read/diagnostic cleanup.

Hard requirement:

```text
WEB RUNTIME MUST NOT HAVE PUBLISHED OPERATOR CREDENTIALS
```

Also not in web runtime:

- DB owner credential;
- provider master credential.

Before closing Phase 0.5, collect evidence that deployed Vercel runtime configuration respects this boundary.

Evidence should show variable names/presence/scope, not secret values.

---

# 9. LOCAL WINDOWS R2 TLS ISSUE

This is an important known diagnostic result.

From the current Windows workstation:

- DNS resolves the R2 endpoint;
- TCP port 443 connectivity succeeds;
- Node TLS to the R2 S3 endpoint fails during handshake;
- Windows curl/Schannel also fails during handshake.

Observed error categories included:

```text
EPROTO
SSL/TLS alert handshake failure
alert 40
SEC_E_ILLEGAL_MESSAGE
```

The problem persisted across different local Wi-Fi/network attempts.

This is evidence of a local/client/network TLS path problem.

It is NOT sufficient evidence that Cloudflare R2 is down or misconfigured globally.

Correct classification:

```text
LOCAL R2 S3 TLS PATH: FAIL
R2 PROVIDER: NOT PROVEN FAILED
```

---

# 10. WHY THE ADMIN EXCEL UPLOAD APPEARED TO HANG

The browser import flow is:

```text
Admin
-> POST upload-session
-> browser receives temporary signed PUT
-> browser PUT directly to private R2
-> finalize
-> LAND server verifies object
-> workbook inspection/staging
```

Because the local Windows path could not complete the R2 TLS handshake, the browser-direct PUT could appear stuck/loading.

Do not "fix" this by:

- making R2 public;
- embedding permanent credentials;
- disabling TLS;
- proxying everything through an over-privileged web runtime;
- redesigning the import architecture without evidence.

First prove provider behavior from an independent cloud path.

---

# 11. LOCAL PROVIDER-ACCEPTANCE RESULT

A local Codex CLI acceptance run produced:

```text
Vercel: PASS
Admin authentication: PASS
LAND database diagnostics: PASS
R2 private lifecycle: UNCONFIRMED because local TLS failed
R2 published lifecycle/public delivery: UNCONFIRMED in that run
Credential separation: not yet formally evidenced in final report
```

Overall local conclusion:

```text
PARTIAL PASS
```

This was correct.

Do not rewrite historical evidence as full PASS.

Do not rewrite it as provider FAIL.

---

# 12. PROVIDER ACCEPTANCE REPORT

During the prior session, a sanitized report was created/updated locally at:

```text
docs/operations/phase-0-5-h-provider-acceptance.md
```

At the last confirmed point, it was local/untracked and not yet present on the remote feature branch.

The new session must verify whether this is still true.

Possible states:

A. file still local only;
B. file has since been committed;
C. a newer report exists;
D. cloud test already updated it.

Do not assume.

Inspect before writing.

---

# 13. REQUIRED CLOUD R2 ACCEPTANCE

If newer evidence does not already exist, run a diagnostic-only R2 lifecycle test from an independent cloud execution environment.

The test must use scoped secrets securely.

Never print secrets.

Use random keys under:

```text
diagnostics/<uuid>.json
```

No production/domain data.

## Private test

Required:

```text
PUT
HEAD
GET
verify exact bytes
verify SHA-256
verify content type/size/metadata as supported
DELETE
HEAD confirms absent
```

## Published operator test

Required:

```text
operator PUT
HEAD
GET
verify exact bytes/hash
```

## Public delivery test

Required:

```text
anonymous HTTPS GET via PUBLIC_ASSET_BASE_URL
HTTP 200
exact bytes match
```

If relevant to published asset behavior, also verify:

- HEAD;
- Range;
- content type;
- cache behavior.

Do not overstate tests not actually run.

## Cleanup

Delete the diagnostic object after acceptance.

Confirm cleanup.

Published release immutability policy does not forbid deleting temporary `diagnostics/` test objects if the adapter/policy explicitly permits that scope.

---

# 14. CLOUD TEST EXECUTION PRINCIPLE

Because cloud-agent secret availability may differ between setup and agent runtime:

Prefer:

1. secrets supplied to setup environment;
2. setup script runs provider checks;
3. script writes a **sanitized result JSON** to a temporary path;
4. no secret values are written;
5. agent reads sanitized results;
6. agent updates report only.

Expected result document fields may include:

```text
private.put
private.head
private.get
private.integrity
private.cleanup

published.put
published.head
published.get
published.integrity
published.publicRead
published.cleanup

conclusion
```

No credential values.

---

# 15. EXPECTED INTERPRETATION OF CLOUD RESULTS

## Case A — Cloud R2 PASS

If cloud runner proves:

- private lifecycle PASS;
- published lifecycle PASS;
- public delivery PASS;
- cleanup PASS;

then conclude:

```text
R2 provider path works from independent cloud environment.
Local Windows TLS failure is client/network-path-specific.
```

Do not delete the local failure history.

Document both.

## Case B — Cloud R2 FAIL

Then investigate:

- endpoint;
- bucket;
- credentials;
- permission;
- S3 compatibility;
- provider configuration;
- public delivery.

Classify the exact failing operation.

Do not immediately redesign application architecture.

## Case C — Cloud test cannot run

Status remains:

```text
UNKNOWN / NOT RUN
```

not PASS and not provider FAIL.

---

# 16. DEPLOYED CREDENTIAL-SEPARATION CHECK

Before final H/Phase 0.5 PASS, confirm Vercel web runtime does NOT contain:

```text
R2_PUBLISHED_ACCESS_KEY_ID
R2_PUBLISHED_SECRET_ACCESS_KEY
published operator token equivalents
DB owner/bootstrap password
provider master credentials
```

Normal runtime may contain its correctly scoped private object-store credential under application runtime variable names.

Evidence should say:

```text
private runtime credential: configured
published operator credential: absent from web runtime
DB owner credential: absent from web runtime
```

Do not take screenshots that reveal values.

---

# 17. SANITIZED REPORT REQUIREMENTS

Final provider report should include:

- timestamp;
- branch;
- tested commit SHA;
- execution environment;
- provider categories;
- check/result table;
- local Windows TLS history;
- cloud acceptance result;
- credential-separation evidence;
- remaining limitations;
- single overall conclusion.

Allowed overall states:

```text
PASS
PARTIAL PASS
FAIL
NOT RUN
```

Use the narrowest defensible state.

---

# 18. CONDITIONS FOR PHASE 0.5-H PASS

Provider acceptance may be marked PASS only when required external evidence exists.

Minimum expected:

```text
[ ] Vercel deployed application reachable
[ ] Admin auth works
[ ] DB runtime identity/health works
[ ] PostGIS diagnostics pass
[ ] private object storage lifecycle passes
[ ] published operator lifecycle passes
[ ] public published object delivery passes
[ ] integrity matches
[ ] diagnostic cleanup passes
[ ] runtime/operator credential separation evidenced
[ ] no secret exposed
```

If one required area is unproven:

PARTIAL PASS.

---

# 19. REPOSITORY VALIDATION AFTER REPORT UPDATE

A documentation-only report change should still receive appropriate repository hygiene checks.

At minimum:

- inspect git diff;
- secret scan;
- whitespace/diff check;
- link/path sanity.

If source/config changes are introduced:

run the full repository-required checks from current `AGENTS.md`, package scripts and CI policy.

Likely includes current equivalents of:

```text
pnpm check
production build
tests
relevant E2E
secret scan
```

Do not rely on old green tests after behavior changes.

---

# 20. DO NOT MUTATE PROVIDER CONFIG DURING REPORT-ONLY ACCEPTANCE WITHOUT NEED

If diagnostics prove current provider configuration works:

do not "clean up" unrelated settings during the acceptance task.

Avoid unrelated changes to:

- bucket names;
- CORS;
- lifecycle;
- DB pool mode;
- deployment branch;
- source code;
- release registry.

Close evidence first.

Architecture/provider optimization can be a separate change.

---

# 21. PR #2 CLOSEOUT

When Phase 0.5 evidence is complete:

1. ensure working tree contains only intentional changes;
2. ensure final provider report is included;
3. run required checks;
4. inspect PR diff;
5. confirm no secrets;
6. confirm architecture freeze respected;
7. confirm Phase 1 code not accidentally included;
8. update PR description/checklist if needed;
9. mark PR Ready for Review;
10. complete review;
11. merge through approved method.

Do not merge solely because `mergeable=true`.

Mergeable means GitHub can merge technically, not that acceptance is complete.

---

# 22. AFTER MERGE

Once PR #2 is merged:

Verify:

```text
main contains Phase 0.5 closeout
CI/checks green
staging deploy points to intended branch/commit
provider acceptance report matches merged state
```

Then establish a clean Phase 1 baseline.

Recommended:

```text
main
-> new Phase 1 branch
```

Do not continue Phase 1 development indefinitely on the old Phase 0.5 feature branch.

---

# 23. PHASE 1 START AUTHORIZATION

Only after Phase 0.5 is closed should planning move to:

```text
Phase 1 — Tà Xùa 3D
```

Primary visual:

```text
01-public-map-3d-experience-v2.png
```

Before coding Phase 1, create a scoped implementation plan against the merged repository.

Do not assume Series 01 means "implement all 20 pictured concepts immediately."

Use `04_PHASE_CODE_EXECUTION_MATRIX.md`.

---

# 24. KNOWN ITEMS THAT MAY REMAIN OPEN AFTER PHASE 0.5

These are not necessarily blockers for closing deployment hardening if explicitly documented.

Possible:

- final branded asset domain;
- domain purchase/configuration;
- field/control-point terrain accuracy;
- final production source legal approval;
- real-world Place verification coverage;
- physical-device certification beyond test baseline;
- Phase 1 production terrain source decision if not required for 0.5;
- Property;
- AI.

Do not misclassify future/product data work as provider-hardening failure.

---

# 25. SOURCE LICENSING REMAINS SEPARATE

Successful provider delivery proves:

- bytes can be stored/delivered;
- application can consume them.

It does not prove:

- legal redistribution rights;
- official authority;
- field accuracy.

Source registry/licensing/verification gates still apply before real production publication.

---

# 26. LOCAL QA DATA != PRODUCTION TRUTH

Phase 0 repository has tested:

- terrain;
- roads;
- authored/synthetic Place fixtures.

This proves architecture/code behavior.

It does not automatically verify:

- real Place coordinates;
- road safety;
- cadastral/legal facts;
- terrain control-point accuracy.

Keep these limitations explicit.

---

# 27. DO NOT START THESE DURING CLOSEOUT

Forbidden scope creep:

- redesign Public Map to match Series 01;
- implement Property;
- implement AI;
- add new marketplace schema;
- refactor all Admin screens to Series 02;
- create new terrain analytics;
- change verification semantics;
- add brokerage;
- move to a new provider without evidence.

The closeout task should remain operationally narrow.

---

# 28. CLOSEOUT EVIDENCE PACK

A clean final Phase 0.5 evidence set should include:

```text
Git commit/PR reference
Vercel deployment reference
DB/PostGIS diagnostic summary
private R2 diagnostic summary
published R2 diagnostic summary
public GET/integrity result
credential separation confirmation
secret scan result
final provider acceptance report
known limitations
```

No secrets.

---

# 29. OWNER ACTIONS VS AGENT ACTIONS

## Owner-controlled actions

May include:

- entering provider secrets;
- confirming credential scopes;
- provider account/domain configuration;
- merge authorization;
- deciding production domain.

## Agent/Codex actions

May include:

- read-only inspection;
- diagnostic testing using injected credentials;
- sanitized report generation;
- repository validation;
- PR review support.

Do not ask the owner to paste secrets into chat.

---

# 30. HARD STOP CONDITIONS

Stop and request review before proceeding if:

- web runtime appears to contain DB owner credentials;
- web runtime appears to contain published operator credentials;
- private bucket is publicly readable;
- provider diagnostics require disabling TLS;
- report/log contains secret material;
- diagnostics mutate real published releases;
- PR contains Phase 1 feature scope;
- remote branch changed significantly from snapshot and has not been reviewed.

---

# 31. PHASE 0.5 CLOSEOUT CHECKLIST

## Git

```text
[ ] PR #2 remote state re-checked
[ ] head SHA recorded
[ ] no unexpected commits
```

## Vercel

```text
[ ] deployment reachable
[ ] correct tested SHA identified
[ ] / works
[ ] /map works
[ ] /admin auth works
```

## Database

```text
[ ] runtime uses land_app
[ ] transaction/pooler mode verified
[ ] TLS verified
[ ] PostGIS diagnostics PASS
[ ] owner credentials absent from runtime
```

## R2 private

```text
[ ] scoped runtime credential
[ ] PUT PASS
[ ] HEAD PASS
[ ] GET PASS
[ ] exact bytes/hash PASS
[ ] DELETE/cleanup PASS
[ ] anonymous access denied where expected
```

## R2 published

```text
[ ] separate operator credential
[ ] operator PUT PASS
[ ] HEAD PASS
[ ] GET PASS
[ ] public GET PASS
[ ] exact bytes/hash PASS
[ ] cleanup of diagnostics PASS
```

## Credential boundary

```text
[ ] published operator absent from web runtime
[ ] DB owner absent from web runtime
[ ] no provider master key in web runtime
```

## Evidence

```text
[ ] provider report updated
[ ] local Windows TLS failure retained as historical evidence
[ ] cloud result documented
[ ] no unsupported PASS claims
```

## Repository QA

```text
[ ] diff reviewed
[ ] secret scan PASS
[ ] required tests/checks PASS
```

## PR

```text
[ ] Phase 0.5 scope only
[ ] Ready for Review
[ ] review complete
[ ] merge complete
```

## Transition

```text
[ ] clean main confirmed
[ ] Phase 1 branch/plan may begin
```

---

# 32. FINAL CLOSEOUT STATES

## NOT CLOSED

Use while required evidence is missing.

Current handoff state.

## PARTIAL PASS

Use when several provider checks pass but at least one required category remains unproven.

This matches the previous local acceptance outcome.

## PASS

Use only when required external provider/storage/security evidence is complete.

## FAIL

Use when a required behavior is proven incorrect and blocks safe deployment.

Do not use FAIL for a check that was merely impossible to run.

---

# 33. FINAL INSTRUCTION TO THE NEXT SESSION

The immediate goal is simple:

```text
CLOSE PHASE 0.5 CLEANLY.
```

Do not optimize the future product yet.

Do not repeat provider creation.

Do not discard historical evidence.

Prove the remaining R2/storage/security gates from an independent environment.

Finalize the sanitized report.

Validate the repository.

Merge PR #2.

Then, and only then, begin Phase 1.

End of Phase 0.5 Closeout.
