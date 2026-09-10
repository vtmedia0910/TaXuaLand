# Phase 0.5 milestone ledger

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

## Phase 0.5 closeout

Phase 0.5 provider acceptance is **PASS** on `feat/phase-0-5-production-deployment` at `fb81e012c59d880a2b4b2e48e035c6cf6332f053`.

The earlier Windows R2 S3 TLS failure remains historical client/network-path evidence. An independent ephemeral Linux Docker run using `node:24-bookworm` completed private and published diagnostic PUT/HEAD/GET byte and SHA-256 verification, anonymous public HTTP 200 byte and SHA-256 verification, and confirmed cleanup in both buckets. Owner provider-configuration attestation confirms that the deployed `ta-xua-land-web` runtime has only the scoped private R2 credential and excludes published operator, database owner/bootstrap, and provider/account master credentials.

The detailed sanitized evidence is recorded in `docs/operations/phase-0-5-h-provider-acceptance.md`. No provider configuration, source/runtime code, authoritative data, published release, or Phase 1 scope changed during closeout. Final PR review remains required before PR #2 is marked ready or merged.
