# Managed LAND PostgreSQL/PostGIS (0.5-F)

Status: provider-neutral implementation; no managed account/database has been provisioned or accepted by this checkpoint.

## Provisioning and credential separation

Create a dedicated LAND staging database, not a BIKER/TRIP database. Require PostgreSQL compatible with migrations 001–014, PostGIS, pg_trgm, unaccent, verified TLS, backup/PITR and sufficient connections. Record provider, region, PostgreSQL/PostGIS versions, backup retention/restore procedure and connection budget in the operator deployment record. Do not put secrets in that record.

Use an owner/migration role in an operator-only environment. Never inject owner URLs, DATABASE_TEST_URL, DATABASE_APP_PASSWORD or SERVER_BOOTSTRAP_* into Vercel. Runtime receives only the newly provisioned land_app URL. No default administrator exists.

## Connection policy

DATABASE_ENDPOINT_MODE explicitly documents direct, session or transaction pooling. Migrations and provisioning reject transaction mode: migration advisory locks require session affinity. The application uses parameterized unnamed queries and transaction-scoped locks; no session-based authentication state or named prepared statements. A provider pooler still requires actual compatibility testing before acceptance.

Each runtime process reuses a pool capped by DATABASE_POOL_MAX (default 2, range 1–10), idle timeout 10 seconds, connect timeout 5 seconds and statement timeout 15 seconds. Operators use one connection with no DDL statement timeout. Pool limits are not fleet-wide limits: budget concurrent instances × pool maximum plus migrations/headroom against the provider cap. Enable provider-side pooling where appropriate; test burst/queue behavior and its transaction mode before choosing it.

Remote connections use TLS with certificate and hostname verification. DATABASE_CA_CERT optionally supplies the provider PEM CA. URL query options other than application_name are rejected: remove sslmode/sslcert/host/options parameters so they cannot override the explicit TLS policy. TLS is disabled only for LOCAL loopback. Never use rejectUnauthorized=false. Do not guess provider certificate trust or pooler endpoint compatibility.

## Operator migration and bootstrap

1. Take a provider backup/checkpoint and verify restore access. Confirm the exact dedicated database, versions, endpoint mode, owner role and available connection budget using the provider console and read-only SQL. For an existing LAND database inspect product_identity and land_migrations. Restore a copy and rehearse the upgrade before changing staging.
2. In an operator-only shell inject DATABASE_URL, LAND_ENVIRONMENT=STAGING, DATABASE_ENDPOINT_MODE=direct (or verified session endpoint), and CA if required. Use the direct owner URL, not the runtime pooler. Run `node infra/migrate.ts` from the repository root. This checks identity (or an empty schema allowing extension-owned objects), serializes migrations, verifies applied checksums, applies each pending file atomically and records its SHA-256. A foreign populated schema is refused. Never run this on function startup.
3. Re-run the migration command: no pending changes should remain. Verify all expected migration names/checksums, PostGIS_Full_Version(), product_identity=TAXUA_LAND and latest schema. A failed migration rolls back that migration, not previous successful files. Resolve the operator cause before retry; never edit an applied migration. Restore from the checkpoint if schema rollback is required.
4. On initial provisioning only, inject a new LAND-only DATABASE_APP_PASSWORD (32+ characters) and run `node infra/provision-runtime.ts`. Role creation and grants are atomic; existing roles are not overwritten. Remove the password from the shell afterwards. If a managed provider has granted PUBLIC CREATE on public, revoke that privilege as database owner before runtime acceptance. Runtime must not own tables/schema or inherit privileged roles.
5. Inject SERVER_BOOTSTRAP_EMAIL, a unique SERVER_BOOTSTRAP_PASSWORD (14–256 characters), and SERVER_BOOTSTRAP_ROLE=SYSTEM_ADMIN only in the operator shell. Run `node infra/bootstrap-admin.ts`. Existing accounts are never reset. Remove bootstrap variables afterwards; deliver the password privately and rotate through the approved operator process.
6. Supply only runtime credentials to the application. Startup checks LAND identity, PostGIS and dangerous effective permissions, including immutable delivery receipt insertion. Run read-only queries, Admin login/session/logout, import staging/review/explicit commit, publish guards and Core E2E on an isolated provider QA database before accepting the chosen pooler. Deploy and smoke-test only after these gates.

## Evidence boundary

Local tests cover clean/checksummed replay, accepted Phase 0 upgrade (durable-import suite), wrong-database refusal, runtime privilege rejection, two-connection transaction bursts and PostGIS. Core E2E exercises authentication and unchanged domain workflows. They do not verify managed TLS, provider pooler behavior, backup restore or serverless fleet limits. Owner must provide a dedicated managed project/database, operator access, runtime/pooler endpoint and CA requirements, backup policy and permission to run disposable provider QA tests. Credentials belong in the secret manager, never chat or Git.
