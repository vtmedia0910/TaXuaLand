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

Owner checkpoint: review B, commit/push through the host Git workflow, then authorize continuation to C. C–J and actual staging acceptance remain pending. Phase 1 has not started.
