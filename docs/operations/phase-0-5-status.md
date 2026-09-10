# Phase 0.5 milestone ledger

> **CURRENT STATUS — CLOSED 2026-09-11**
>
> Phase 0.5 provider acceptance is PASS and PR #2 is merged into `main` at `47b3f8fabbba5f784092b13c8c1fa6205fe8ed47`. Phase 1 has not started and still requires its dedicated specification plus explicit owner approval.
>
> The milestone and reconciliation text below is preserved as historical build/closeout evidence. Its earlier OPEN, DRAFT, NOT MERGED, PARTIAL, and NOT CLOSED statements are not current-state authority. Use `docs/status/CURRENT.md` for mutable current state and `docs/operations/phase-0-5-h-provider-acceptance.md` for the final sanitized provider conclusion.

Specification authority: owner-supplied PHASE_0_5_PRODUCTION_DEPLOYMENT.md v1.0. Starting SHA: f7080f8a1943d9d86e3c747882b615294a60bd21.

## A — Owner-confirmed host preflight

The owner confirmed host fetch, ref/branch writes and HEAD/origin-main reconciliation PASS. The explicit owner override assigns every Git write to the owner outside Codex. Codex observed a clean feature branch `feat/phase-0-5-production-deployment` before B edits. Sandbox Git ACL failures are not a Phase 0.5 blocker. No Git write or Git Data API workaround is used by Codex under this override.

## B — ADR and deployment environment contract

ADR-009 records ephemeral hosting, durable S3 storage, private/published separation, retained local adapter, security and rollback. Typed deployment configuration defines LOCAL/PREVIEW/STAGING/PRODUCTION, validates exact origins, bounds signed upload TTL to 30–600 seconds and retention to 1–7 days, and requires separate S3 buckets for staging/production. Configuration errors suppress values. This is the contract milestone; S3 adapters and complete serverless startup integration follow in C/D/G.

Origin validation now uses the mode-aware policy for authenticated mutations and login. LOCAL defaults only to loopback; existing local callers remain supported. An existing remote installation must explicitly set LAND_ENVIRONMENT. PREVIEW must explicitly enable LAND_PREVIEW_ENABLED, match VERCEL_ENV=preview and the exact platform VERCEL_URL, and omit database/storage credentials. Database access is independently blocked before returning/creating a pool when either LAND_ENVIRONMENT=PREVIEW or VERCEL_ENV=preview, including accidental credential injection. Other deployments use exact SERVER_ORIGIN; request Host and forwarded headers never establish trust.

Provider environment values are operator configuration, never workbook/registry fields. Use separate staging and production credentials. Do not configure the future S3 runtime until its adapter milestone is complete. No domain, spatial, verification or schema changes in B.

Validation on 2026-09-08: Node 24.13.0, pnpm 11.19.0, frozen dependency install PASS. Targeted deployment suite: 28 tests PASS, including malformed configuration, wrong-origin/forged-host rejection and preview DB denial. `pnpm check` exited 0: lint, all typechecks, 64 tests, production build, syntax validation of 63 client chunks and secret scan (245 repository files, 207 public artifacts) PASS. Database-dependent tests cannot run without DATABASE_TEST_URL: 17 tests skipped. Actual `pnpm test:e2e:core` stops at the harness precondition requiring that variable; no E2E PASS is claimed. `git diff --check` PASS. No GitHub or staging acceptance is claimed at this owner checkpoint.

Needed for local integration/Core E2E: a dedicated loopback PostgreSQL maintenance connection to database postgres, with PostGIS available and a QA owner able to create disposable databases and roles. Supply DATABASE_TEST_URL through the private process environment or ignored repo-root .env.local. Do not use staging or another product's database, and do not send the credential in a commit. Managed staging credentials are not needed for these local tests.

Owner reported checkpoint B pushed in PR #2, with GitHub check and e2e-core PASS, and authorized C on the existing feature branch. These results apply to B, not unpushed C changes.

## C — Object storage abstraction

Added typed ObjectStore/ObjectStoreSigner contracts, application-generated raw/inspection/spatial/diagnostic keys and strict namespace, MIME, size and SHA-256 validation. Added LocalFilesystemObjectStore with atomic exclusive publication and S3CompatibleObjectStore with configured separate buckets, conditional PUT, bounded download/readback integrity verification, safe errors and bounded signed URLs. Published release objects cannot be overwritten or deleted through these adapters; diagnostic cleanup remains available. SDK dependencies are pinned to @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner 3.1127.0 inside the server infrastructure adapter. No domain/schema, spatial semantics, verification or existing import route changes.

Validation on 2026-09-08: 28 storage contract/security tests PASS with real filesystem I/O and SDK requests to a local HTTP S3 fixture. Full pnpm check exited 0: lint/typecheck, 92 tests, production build, 63 emitted client syntax checks, secret scan of 250 repository files and 207 public artifacts PASS. 17 PostGIS tests skipped because DATABASE_TEST_URL is absent. Actual pnpm test:e2e:core again stopped at the loopback maintenance-connection precondition. GitHub checks for C require the owner's next push. The HTTP fixture is not a real provider/IAM/signature verification service; provider policy, cryptographic rejection, privacy, CORS, lifecycle and deployed persistence remain unverified until staging.

See object-storage.md for adapter contracts, local backing format, retry/conflict handling, checksum trust boundary, operator requirements and deferred acceptance. D will connect authenticated upload sessions/finalize and retention to these adapters, preserving legacy inspection compatibility. E will connect publication and approved public URL resolution. No credentials are required to complete C; staging provider credentials remain an H dependency.

Owner checkpoint: review C and commit/push through host Git, then authorize D. Codex performed no Git writes. D–J and actual staging acceptance remain pending. Phase 1 has not started.

---

# Historical 2026-09-11 pre-closeout reconciliation

The historical A–C ledger above remains useful as evidence of how Phase 0.5 was built incrementally.

It must not be read as a declaration that the repository is still at checkpoint C.

## Remote state verified during reconciliation

```text
PR #2
Phase 0.5: production deployment hardening

state
OPEN

draft
YES

merged
NO

mergeable
YES

base
main

base SHA
f7080f8a1943d9d86e3c747882b615294a60bd21

head branch
feat/phase-0-5-production-deployment

head SHA
fb81e012c59d880a2b4b2e48e035c6cf6332f053
```

The PR description still states:

```text
Phase 0 architecture remains frozen.
Phase 1 has not started.
```

## Later implementation visible in PR #2

The current PR contains work beyond checkpoint C, including areas such as:

```text
durable import upload sessions
serverless-safe workbook upload/finalize flow
runtime database readiness
managed PostGIS deployment support
S3-compatible private/published storage
spatial object publication/delivery
import retention
Next.js output tracing
deployment/provider configuration
Phase 0.5 ADR/operations documentation
provider/runtime regression tests
```

Therefore, do not restart D–G implementation from the old checkpoint plan without first inspecting current source and the PR diff.

## External setup reported by the handoff

The handoff reports these as already established/configured:

```text
Vercel staging deployment
Supabase/PostGIS staging
LAND runtime database role
Admin bootstrap/login
Cloudflare R2 private bucket
Cloudflare R2 published bucket
separate R2 credential roles
R2 lifecycle configuration
R2 CORS configuration
staging public asset endpoint
```

This means the old statement:

```text
external deployment/provider access missing
```

is historical, not current.

It does **not** mean every provider acceptance gate has passed.

## Historical acceptance state at this snapshot

Use:

```text
PHASE 0 LOCAL IMPLEMENTATION
PASS

PHASE 0 LOCAL RELEASE-CANDIDATE ACCEPTANCE
PASS

VERCEL STAGING DEPLOYMENT
PASS according to handoff evidence

SUPABASE / POSTGIS STAGING
PASS according to handoff evidence

LAND RUNTIME ROLE
PASS according to handoff evidence

ADMIN LOGIN
PASS according to handoff evidence

R2 RESOURCE CONFIGURATION
CONFIGURED

LOCAL WINDOWS R2 S3 TLS
FAILS FROM THAT CLIENT PATH

R2 PROVIDER ITSELF
NOT PROVEN FAILED

COMPLETE R2 CLOUD LIFECYCLE ACCEPTANCE
REQUIRES CONFIRMATION / COMPLETION

OVERALL PHASE 0.5 PROVIDER ACCEPTANCE
PARTIAL / NOT CLOSED

PR #2
OPEN + DRAFT + NOT MERGED

PHASE 1
NOT STARTED
```

The narrowest defensible state remains:

```text
PARTIAL
```

until all required provider evidence is complete.

## Remaining closeout evidence

Before Phase 0.5-H/provider acceptance can be called PASS, confirm the applicable external evidence for:

```text
[ ] Vercel deployed application reachable
[ ] Admin authentication works
[ ] runtime DB identity/health works
[ ] PostGIS diagnostics pass
[ ] private object-storage lifecycle passes
[ ] published operator lifecycle passes
[ ] public published-object delivery passes
[ ] exact bytes / SHA-256 integrity matches
[ ] diagnostic cleanup passes
[ ] published operator credential absent from web runtime
[ ] DB owner/bootstrap credential absent from web runtime
[ ] no secret exposed in evidence
```

Where the handoff already has trustworthy evidence, do not rerun it merely for ceremony.

Where evidence is missing or stale, perform the smallest safe bounded verification.

## Approved diagnostic principle

Provider diagnostics may use temporary objects only under a diagnostic namespace such as:

```text
diagnostics/<random-id>
```

Typical lifecycle:

```text
PUT
→ HEAD
→ GET
→ exact-byte/SHA-256 verification
→ DELETE
→ cleanup confirmation
```

Do not mutate:

- Place data;
- Property data;
- verification state;
- real dataset authority;
- published authoritative releases;
- RBAC;
- production business data;

merely to produce acceptance evidence.

## Credential-separation evidence

The normal web runtime may contain its correctly scoped private application storage credential.

It must not contain the published-release operator credential or database owner/bootstrap credential.

Evidence should report presence/absence only, for example:

```text
private runtime credential:
CONFIGURED

published operator credential:
ABSENT FROM WEB RUNTIME

DB owner/bootstrap credential:
ABSENT FROM WEB RUNTIME
```

Never print credential values.

Never capture screenshots that reveal credential values.

## Local Windows R2 TLS history

A failed local Windows TLS handshake to the R2 S3 endpoint is execution-context evidence.

It is not enough to conclude:

```text
R2 PROVIDER FAILED
```

If an independent cloud execution path succeeds, classify the issue according to the evidence, such as a local client/network/TLS path limitation.

Do not disable TLS verification as a workaround.

## Final provider report

The final sanitized provider-acceptance report should include:

```text
timestamp
branch
tested commit SHA
execution environment
provider categories
check/result table
local Windows TLS history
cloud acceptance result
credential-separation evidence
remaining limitations
single overall conclusion
```

Allowed overall conclusions should remain narrow:

```text
PASS
PARTIAL PASS
FAIL
NOT RUN
```

Do not use PASS while a required area remains unproven.

## PR #2 closeout

When required Phase 0.5 evidence is complete:

```text
1. confirm only intentional working-tree changes
2. include/update final sanitized provider report
3. run appropriate repository checks
4. inspect the final PR diff
5. confirm no secrets
6. confirm architecture freeze respected
7. confirm no accidental Phase 1 scope
8. update PR description/checklist if needed
9. mark PR Ready for Review
10. complete final review
11. merge through the normal protected workflow
```

Do not merge solely because GitHub reports `mergeable=true`.

Technical mergeability is not acceptance completion.

## Repository validation

For documentation-only acceptance reconciliation, at minimum inspect:

```text
git status --short
git diff
git diff --check
secret-scan implications
link/path sanity
```

If source/config/runtime behavior changes, run the full current repository-required checks, including the applicable equivalents of:

```text
pnpm check
pnpm test:e2e:core
affected integration/provider/runtime checks
```

Do not claim a check passed if it did not run.

## After merge

After PR #2 is merged:

```text
verify main contains Phase 0.5 closeout
verify required CI/checks are green
verify staging points to the intended merged state
verify provider report matches the merged state
establish a clean Phase 1 baseline
```

Do not continue Phase 1 development indefinitely on the Phase 0.5 branch.

Phase 1 still requires its dedicated specification and explicit owner approval.

## Items that may remain open without being Phase 0.5 blockers

If explicitly documented, these may remain future/product-data work rather than provider-hardening failures:

```text
final branded public asset domain
domain purchase/configuration
field/control-point terrain accuracy
final production source legal approval
real-world Place verification coverage
additional physical-device certification
Phase 1 production terrain source decision
Property
AI
```

Technical storage/delivery success does not prove source rights, legal authority, or field accuracy.

## Historical next action at this snapshot

```text
1. Re-check local working tree and remote PR #2.

2. Inspect whether a newer provider-acceptance report/evidence exists.

3. Reuse already-proven evidence.

4. Complete only missing cloud R2 lifecycle / exact-byte / cleanup /
   public-delivery / credential-separation evidence.

5. Update the sanitized provider report and current-state documentation.

6. Run required repository validation.

7. Review PR #2 for architecture/security/scope drift.

8. Mark Ready and merge only when all required Phase 0.5 gates pass.

9. Establish clean post-merge main.

10. Only then prepare/approve the dedicated Phase 1 specification.
```

Until those closeout gates are satisfied:

```text
DO NOT START PHASE 1.
```
