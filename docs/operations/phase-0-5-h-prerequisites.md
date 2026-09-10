# 0.5-H — external staging access handoff

> **CURRENT STATUS — CLOSED 2026-09-11**
>
> Phase 0.5 provider acceptance is PASS and PR #2 is merged into `main` at `47b3f8fabbba5f784092b13c8c1fa6205fe8ed47`. Phase 1 has not started and still requires its dedicated specification plus explicit owner approval.
>
> This file is now a historical prerequisite/setup record and security/provider acceptance checklist. All OPEN, DRAFT, NOT MERGED, PARTIAL, and NOT CLOSED statements below describe earlier snapshots and are not current-state authority. Use `docs/status/CURRENT.md` for mutable current state and `docs/operations/phase-0-5-h-provider-acceptance.md` for the final sanitized provider conclusion.
>
> **HISTORICAL PRE-CLOSEOUT CORRECTION — 2026-09-11**
>
> This document was originally written on 2026-09-09 as a prerequisite handoff at a point when external LAND provider access had not yet been supplied to that task.
>
> The original historical body is preserved below because it remains useful for provider setup, security boundaries, least-privilege requirements, environment contracts, and acceptance criteria.
>
> However, its original opening status:
>
> ```text
> BLOCKED on external deployment access
> ```
>
> is **historical checkpoint context, not current-state authority**.
>
> The 2026-09-11 project handoff reports that substantial external setup was completed after this document was written, including:
>
> ```text
> dedicated LAND Vercel staging project
> dedicated Supabase/PostGIS staging project
> LAND runtime database role
> working Admin bootstrap/login
> Cloudflare R2 private bucket
> Cloudflare R2 published bucket
> separate R2 credential roles
> R2 lifecycle configuration
> R2 CORS configuration
> staging public asset endpoint
> ```
>
> Fresh GitHub inspection still shows:
>
> ```text
> PR #2
> Phase 0.5: production deployment hardening
>
> state:
> OPEN
>
> draft:
> YES
>
> merged:
> NO
>
> branch:
> feat/phase-0-5-production-deployment
>
> head:
> fb81e012c59d880a2b4b2e48e035c6cf6332f053
>
> base main:
> f7080f8a1943d9d86e3c747882b615294a60bd21
> ```
>
> The current conclusion is therefore:
>
> ```text
> EXTERNAL ACCESS MISSING
> → historical
>
> PROVIDER RESOURCES
> → substantially configured according to handoff
>
> COMPLETE PROVIDER ACCEPTANCE
> → not yet proven closed
>
> PHASE 0.5
> → still open
>
> PHASE 1
> → not started
> ```
>
> The remaining task is evidence/acceptance closure, not blindly recreating provider resources.
>
> In particular, current closeout should confirm or complete the required cloud-origin R2 lifecycle/integrity/public-delivery evidence, diagnostic cleanup, and credential-separation evidence.
>
> A local Windows TLS failure against the R2 S3 endpoint does **not** by itself establish provider failure.
>
> After the agent-workflow documentation layer is installed, use:
>
> ```text
> docs/status/CURRENT.md
> ```
>
> for mutable current state.
>
> Use this file primarily as:
>
> ```text
> historical prerequisite/setup record
> +
> security/provider acceptance checklist
> ```
>
> Do not follow setup steps that are already complete merely because they remain in the historical body. Re-check actual provider state first.
>
> Do not expose secrets while reconciling current state.

---

## Original historical prerequisite handoff — preserved

# 0.5-H — external staging access handoff

Status: **BLOCKED on external deployment access, not staging PASS**. Checked 2026-09-09 at HEAD `16df9886a7fbdcbbb712467854662b165c12c3df`, branch `feat/phase-0-5-production-deployment`, PR #2. Owner reports GitHub check/e2e-core PASS on this commit. Cached origin/main is `f7080f8a1943d9d86e3c747882b615294a60bd21`; no fetch, Git write, deployment or account creation performed.

## Evidence and boundary

- No provider settings in the process or repo/web .env.local for Vercel authorization, managed DATABASE_URL, S3 endpoint/keys/buckets, SERVER_ORIGIN or PUBLIC_ASSET_BASE_URL. Values were not printed; only presence was checked. Local DATABASE_TEST_URL is not managed staging access.
- No .vercel/project.json at repo/web root, Supabase project config or Wrangler config. No Vercel/Supabase/R2 connector available. This does not establish that the owner has no accounts: no LAND project/access has been supplied to this task. Other-product credentials are out of scope.
- Phase 0 sample terrain manifest/QA and published roads exist locally under work/gis; their presence is not staging registry approval, checksum acceptance or public delivery evidence.
- F/G already provides provider-neutral DB/runtime/storage/parser/publication configuration and tests. H now needs actual accounts and endpoints. No speculative adapter/worker change is justified before measuring provider behavior. This handoff adds documentation only; I/J and Phase 1 are not started.

## 1. Owner creates/identifies dedicated resources

Recommended stack is the specification's Vercel + Supabase PostGIS + Cloudflare R2. Names below are proposed LAND-only names, not claims that resources exist. Owner controls plan/billing/region choices; choose compatible nearby web/DB regions and a backup-capable plan. Do not reuse BIKER/TRIP projects, DBs or service-role credentials.

### Vercel: taxualand-staging

1. In the intended Vercel team, Add New → Project → import vtmedia0910/TaXuaLand. Owner authorizes the GitHub integration for this repository only. Required access: manage this project's settings/env, deploy/redeploy, view build/function logs and deployment protection; no unrelated-team administration is needed.
2. Framework Next.js; Root Directory apps/web; enable Include source files outside of the Root Directory in the Build Step; Node24.x; install `pnpm install --frozen-lockfile`; build `cd ../.. && pnpm build`; default Next output. [Official monorepo setting](https://vercel.com/docs/monorepos/monorepo-faq).
3. Reserve a stable staging HTTPS origin (the project's assigned .vercel.app domain is sufficient). Do not attach taxualand.vn for public launch. Keep main as the normal controlled staging branch. Do not give arbitrary PR previews staging write credentials. Owner must choose the initial deployment route: merge PR #2 through normal protected workflow, or explicitly authorize deploying this reviewed commit to the dedicated staging project's Production environment without changing main. Do not silently change Production Branch to the feature branch.
4. The dedicated staging project's Vercel Production environment receives LAND_ENVIRONMENT=STAGING. Preview remains credential-free; exact per-deployment SERVER_ORIGIN, LAND_ENVIRONMENT=PREVIEW and LAND_PREVIEW_ENABLED=true are required to enable Preview. No wildcard or Host-derived origins.
5. Owner authenticates CLI outside this task with `npx vercel login`, then from C:/Projects/TaXuaLand/apps/web runs `npx vercel link` and selects only the LAND team/project. Alternatively provide VERCEL_TOKEN via a secret-manager-injected operator environment and non-secret VERCEL_ORG_ID/VERCEL_PROJECT_ID. Linking is not deployment. Do not paste tokens into chat. If deployment protection is enabled, grant authenticated browser access or securely inject a protection-bypass credential for acceptance; never put it in public URLs/logs.

### Managed PostGIS: dedicated Supabase project taxualand-staging

1. Create a new LAND-only project in the intended organization; retain its database password in the secret manager. Use its dedicated postgres database, not another product's database. Required operator authority: connect with TLS, install supported extensions, own LAND schema objects, create/grant land_app and take/verify backups. Do not require or grant true superuser to runtime.
2. In Connect, obtain the exact direct and session/transaction pooler endpoint formats for this project. Keep an operator direct/session endpoint and a separate land_app runtime endpoint/password. Confirm IPv4/IPv6 connectivity; do not guess pooler username/host. Session mode is an initial compatibility option, not a demonstrated serverless capacity solution. Record provider limits, max connections and selected mode; actual transactions/PostGIS/auth/burst tests remain mandatory. [Connection reference](https://supabase.com/docs/guides/database/connecting-to-postgres).
3. Supply the provider CA requirements. The app verifies TLS; URL sslmode/sslcert/options parameters are rejected by its explicit policy. Do not disable certificate verification. Configure PostGIS, pg_trgm and unaccent compatible with the existing unqualified Phase 0 SQL/public schema; do not move existing extensions blindly. Have Codex inspect a new project's schema before migration. A provider-populated public schema may require a different dedicated DB setup, not bypassing the wrong-product guard.
4. Do not expose LAND tables through Supabase Data API/anon/authenticated access. Review/disable the unused Data API and provider default grants before application tables are created; no browser Supabase SDK or service-role key is needed. Record effective privileges, including future-table defaults, as a prerequisite to importing private data.
5. Enable a documented backup/snapshot/export path; provide permission and destination for one isolated restore/export verification, never restore over staging. Supply plan retention/PITR facts, not an assumed SLA.
6. Once operator access is injected, Codex can perform read-only preflight, then the existing ordered migration/provision/bootstrap steps. Owner need not manually invent schema or copy Phase 0 SQL into the console. See [managed DB procedure](managed-postgis.md). Bootstrap is a new unique Admin, not a default account.

### Object storage/CDN: Cloudflare R2

1. Enable R2 in the intended Cloudflare account (owner handles billing). Create separate buckets `taxualand-staging-private` and `taxualand-staging-published`, in the same supported endpoint/jurisdiction. Private: no custom public domain, no r2.dev public access. Published: connect an owner-controlled asset hostname through bucket Settings → Custom Domains, mapped at the bucket root. Do not use the S3 API endpoint as PUBLIC_ASSET_BASE_URL. [Public delivery reference](https://developers.cloudflare.com/r2/buckets/public-buckets/).
2. R2 → account API tokens → create bucket-scoped credentials, not account-wide admin credentials. Runtime needs private Get/Head/Put/Delete for imports; publication operator needs published Put/Get/Head and diagnostic cleanup. Current adapter accepts one key pair per process: inject a private-bucket token into web runtime and a published-bucket token into the separate publication operator process. Do not grant web runtime published-release write access merely for diagnostics. R2 bucket-level permissions do not establish prefix-level or write-once IAM guarantees; conditional writes and application immutable guards still require real tests. [Token permissions](https://developers.cloudflare.com/r2/api/tokens/).
3. Owner with bucket-settings authority configures lifecycle expiration after 7 days for imports/raw/ and imports/inspection/ only. Never apply that expiration to published spatial assets. The existing operator retention command must also run daily; provider lifecycle alone does not update batch state. Keep scheduling credentials outside Vercel runtime.
4. Configure CORS with the exact approved staging origin, replacing the placeholder below. CORS is browser policy, not private access control. Public reads remain intentionally public to non-browser clients. Verify preflight and actual signed PUT headers on the provider, including create-only and checksum metadata. [CORS reference](https://developers.cloudflare.com/r2/buckets/cors/).

Private bucket CORS (no public read permission):

```json
[
  {
    "AllowedOrigins": ["https://STAGING_HOST"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": [
      "content-type",
      "x-amz-meta-sha256",
      "if-none-match",
      "cache-control"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

Published bucket CORS (no browser writes):

```json
[
  {
    "AllowedOrigins": ["https://STAGING_HOST"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Range",
      "Accept-Ranges"
    ],
    "MaxAgeSeconds": 300
  }
]
```

5. Preserve object Cache-Control public,max-age=31536000,immutable for versioned releases. Verify custom-domain cache/range/header behavior, anonymous private denial, and no broad write CORS. Owner grants zone/DNS/cache configuration access only if Codex is to configure those settings; S3 object credentials cannot configure DNS/CORS/lifecycle. R2 token/endpoint details must be taken from the actual bucket jurisdiction.

## 2. Exact environment handoff

Set these in Vercel → LAND project → Settings → Environment Variables → Production ONLY for this staging project. Secret values are entered there, not chat/Git. A secret-manager-injected local process may receive the same runtime configuration for validation.

| Variable                       | Required value/source                                                      |
| ------------------------------ | -------------------------------------------------------------------------- |
| LAND_ENVIRONMENT               | STAGING                                                                    |
| SERVER_ORIGIN                  | Exact stable https:// staging origin; no path/query/wildcard               |
| LAND_PREVIEW_ENABLED           | false                                                                      |
| DATABASE_URL                   | TLS-capable land_app runtime connection from provider; URI-encode password |
| DATABASE_ENDPOINT_MODE         | Actual direct/session/transaction mode, to be tested                       |
| DATABASE_POOL_MAX              | 2 initially; validate total instance budget against provider limit         |
| DATABASE_CA_CERT               | Provider PEM CA if required; otherwise system trusted CA                   |
| OBJECT_STORE_DRIVER            | s3                                                                         |
| OBJECT_STORE_ENDPOINT          | Actual R2 S3 HTTPS endpoint, including jurisdiction if applicable          |
| OBJECT_STORE_REGION            | auto for R2                                                                |
| OBJECT_STORE_ACCESS_KEY_ID     | Private-bucket runtime S3 access key                                       |
| OBJECT_STORE_SECRET_ACCESS_KEY | Matching private-bucket runtime secret                                     |
| PRIVATE_BUCKET                 | taxualand-staging-private                                                  |
| PUBLISHED_BUCKET               | taxualand-staging-published                                                |
| PUBLIC_ASSET_BASE_URL          | Exact HTTPS custom asset origin, bucket root mapping                       |
| SIGNED_UPLOAD_TTL_SECONDS      | 300                                                                        |
| IMPORT_RETENTION_DAYS          | 7                                                                          |

Do not set a local LAND_WORKSPACE_ROOT on Vercel. Do not set DATABASE_TEST_URL, owner URL, DATABASE_APP_PASSWORD, SERVER_BOOTSTRAP_* or storage management tokens in web runtime. No NEXT_PUBLIC secret variables.

Separate operator environment (temporary secret-manager injection): DATABASE_URL=owner direct/session connection, DATABASE_ENDPOINT_MODE=direct/session, LAND_ENVIRONMENT=STAGING, optional CA; DATABASE_APP_PASSWORD (unique 32+ characters) only for initial role provisioning; SERVER_BOOTSTRAP_EMAIL/PASSWORD (14–256 characters)/ROLE=SYSTEM_ADMIN only for bootstrap. Publication uses the same documented S3 variable names but a distinct published-bucket key pair. Remove bootstrap variables after use. Authenticated browser acceptance requires secure access to the newly created Admin credential, not a password pasted here.

Existing commands, run only after dedicated target/backup/access preflight and with secrets injected (no secret values in arguments):

```text
node infra/migrate.ts
node infra/provision-runtime.ts
node infra/bootstrap-admin.ts
node --experimental-transform-types pipelines/publish-object-release.ts <reviewed-release-uuid> <published-directory>
```

Do not call the local QA registration script against cloud to auto-approve sources. Owner must approve which Phase 0 sample and license/QA registry state can be transferred into the dedicated staging DB. Supply a reviewed LAND snapshot/registry source or authorize the existing explicit review workflow. Published bytes alone cannot supply missing PostGIS authority. Existing directories: work/gis/TX-DEM-2026-001/published and work/gis/TX-ROADS-2026-001/published; verify hashes and actual release UUIDs before delivery.

## 3. What owner sends back (non-secret only)

- Vercel team/project IDs, project URL, exact staging origin, and confirmation LAND-only CLI/session/env access is available; chosen protected-merge versus explicit reviewed-commit staging-deployment route.
- Managed provider/project identifier/region, endpoint mode, backup capability, and confirmation operator/runtime credentials + CA are injected securely; disposable provider QA/restore permission.
- R2 account/bucket names, exact public asset origin, and confirmation private/runtime and publication/operator credentials are injected, bucket/DNS/CORS/lifecycle configured or scoped management access available.
- Approved sample dataset/registry source and confirmation synthetic 100/500/2,000-row imports, explicit test publish, dedicated diagnostics cleanup and staging redeploy are authorized. Provide secure Admin/protection access through the configured environment/session.

## 4. Acceptance queue once unblocked — all currently NOT RUN on cloud

1. Identity/TLS/effective runtime grants/PostGIS/migration state; direct/session operator safety; actual pooler transactions, SQL, auth and burst budget; backup/export/isolated restore evidence.
2. Vercel build SHA/Node/trace/layout/size and cold restricted child; HTTPS /, /map, APIs, Admin sessions/cookies/RBAC/wrong-origin, mobile/WebGL/fallback and public DTO safety.
3. Private anonymous denial, narrow signed PUT/expiry/type/size/headers, finalize idempotency, staging → explicit CREATE/UPDATE/SKIP → atomic commit; no automatic verification. Signed URLs/cookies never enter evidence logs.
4. Reviewed spatial delivery/readback/checksums/receipt, explicit publication, CDN GET/HEAD/Range/CORS/immutable cache and actual Cesium load. No registry replacement by object headers.
5. Upload then redeploy before finalize/validate/review; verify private bytes plus PostGIS staging/audit survive. Redeploy web without GIS binaries and verify identical external immutable URLs/bytes still load.
6. Record 100/500/2,000-row upload/finalize/parse/validation/total timing and observable memory on real functions; homepage/map ready/map stable/API/login and cold/warm terrain CDN. No fabricated timing or increased timeout workaround; inability to reliably handle 2,000 rows requires stopping for a worker ADR.

Repository validation is separate from these unchecked cloud gates. No H PASS until actual evidence exists. Stop here for external access; do not start I/J or Phase 1.


---

# Historical 2026-09-11 pre-closeout reconciliation

The original prerequisite handoff above remains intentionally preserved.

The following section clarifies how it should be used now.

## 1. What is no longer current

Do not treat these original statements as current facts without re-checking:

```text
BLOCKED on external deployment access

no LAND provider access supplied

H now needs actual accounts and endpoints

all cloud acceptance checks NOT RUN
```

Those statements described the 2026-09-09 checkpoint.

The later handoff reports that the owner subsequently created/configured substantial external LAND infrastructure.

## 2. What remains valid

The following original guidance remains applicable unless newer approved repository/provider contracts supersede it:

```text
LAND-only provider resources

no BIKER/TRIP credential reuse

least-privilege runtime database role

separate operator and runtime database authority

private and published storage separation

published operator credential separate from web runtime

exact trusted origins

no secrets in chat/Git/screenshots

no NEXT_PUBLIC server secrets

provider-neutral storage/domain boundaries

immutable published release behavior

source/license/release authority remains in LAND/PostGIS

diagnostic objects must be bounded and temporary

provider acceptance requires actual external evidence
```

## 3. Snapshot provider posture

According to the 2026-09-11 handoff:

```text
Vercel staging deployment
PASS / established

Supabase/PostGIS staging
PASS / established

LAND runtime role
PASS / established

Admin login
PASS / established

R2 resources
CONFIGURED

local Windows R2 S3 TLS path
FAILS FROM THAT CLIENT PATH

R2 provider failure
NOT ESTABLISHED

complete cloud R2 lifecycle acceptance
REQUIRES CONFIRMATION / COMPLETION

overall Phase 0.5 provider acceptance
PARTIAL / NOT CLOSED
```

Use fresh provider evidence if it differs.

## 4. Historical remaining H acceptance focus

The current H task should be narrowed to evidence that remains unproven.

Confirm or complete the applicable:

```text
private diagnostic lifecycle:
PUT
HEAD
GET
exact-byte / SHA-256 verify
DELETE
cleanup verify

published operator diagnostic lifecycle:
PUT
HEAD
GET
exact-byte / SHA-256 verify
DELETE
cleanup verify

public published delivery:
anonymous GET
expected HTTP status
exact-byte verify
relevant HEAD/Range/CORS/cache behavior

credential separation:
private runtime credential configured where required
published operator credential absent from web runtime
DB owner/bootstrap credential absent from web runtime

no secrets exposed in evidence
```

Use only temporary diagnostic objects under the approved diagnostic namespace.

Do not mutate authoritative Place/Property/dataset/verification state merely to prove storage health.

## 5. Do not recreate already-configured infrastructure blindly

Before running any "create" or "configure" instruction in the historical body:

```text
inspect current provider state
→ compare to repository contract
→ identify actual missing evidence/config
→ change only what is genuinely required
```

If current provider setup already satisfies the contract, preserve it and close evidence first.

Do not "clean up" bucket names, CORS, lifecycle, pool mode, deployment branch, or other provider settings during a report-only acceptance task unless evidence shows a material problem.

## 6. Local Windows TLS failure handling

Do not disable certificate verification.

Do not classify:

```text
local TLS failure
```

as:

```text
provider outage
```

without independent evidence.

Prefer an approved cloud execution environment for the bounded diagnostic lifecycle when the local Windows path cannot complete the TLS handshake.

Record execution context in the final report.

## 7. Historical completion gate

Phase 0.5-H may be marked PASS only when required external evidence is complete.

Minimum expected closeout remains:

```text
[ ] deployed LAND application reachable
[ ] Admin authentication works
[ ] runtime DB identity/health works
[ ] PostGIS diagnostics pass
[ ] private object-storage lifecycle passes
[ ] published operator lifecycle passes
[ ] public published-object delivery passes
[ ] integrity matches
[ ] diagnostic cleanup passes
[ ] runtime/operator credential separation evidenced
[ ] no secret exposed
```

Use the narrowest defensible state.

If a required area is still unproven:

```text
PARTIAL PASS
```

not PASS.

## 8. PR and phase boundary

Current remote snapshot at reconciliation:

```text
PR #2
OPEN
DRAFT
NOT MERGED
MERGEABLE

head
fb81e012c59d880a2b4b2e48e035c6cf6332f053

base main
f7080f8a1943d9d86e3c747882b615294a60bd21
```

Do not merge solely because GitHub reports the PR mergeable.

Do not begin Phase 1 before:

```text
Phase 0.5 evidence closes
→ final review completes
→ PR #2 merges
→ clean main baseline is established
→ dedicated Phase 1 specification is approved
```

## 9. Current-state authority after workflow migration

Once the new workflow files are installed, use:

```text
CONTEXT.md
→ stable project/domain context

docs/status/CURRENT.md
→ mutable branch/PR/blocker/next-action status

docs/agents/SKILL_ROUTING.md
→ Skill/Plugin ownership

docs/agents/SPATIAL_3D_WORKFLOW.md
→ 3D/Cesium specialist workflow

docs/visual-specs/README.md
→ visual authority index
```

This prerequisite document should remain a historical provider/setup record plus acceptance checklist.

Do not continually rewrite its historical checkpoint to track every branch transition.

## 10. Historical next action at this snapshot

```text
1. Re-check local and remote PR #2 state.

2. Inspect any newer provider-acceptance report/evidence.

3. Determine which H checks are already proven.

4. Complete only missing bounded cloud R2 lifecycle/integrity/
   public-delivery/cleanup checks.

5. Confirm credential separation without exposing values.

6. Update the sanitized final provider-acceptance report.

7. Run repository-required validation appropriate to any changes.

8. Review PR #2 for architecture/security/scope drift.

9. Mark Ready and merge only when the required Phase 0.5 gates pass.

10. Establish clean post-merge main.

11. Do not start Phase 1 until its dedicated specification and owner
    approval exist.
```
