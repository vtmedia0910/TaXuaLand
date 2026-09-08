# ADR-009: Vercel and provider-neutral object storage

Status: Phase 0.5 infrastructure decision authorized by the supplied Phase 0.5 specification. Implementation proceeds at milestone checkpoints; staging acceptance remains pending.

## Context

Phase 0 stores sanitized workbook inspections in a persistent private volume. Vercel instances and deployments cannot use that volume as durable state. The frozen PostGIS, provenance, verification, publication and public DTO boundaries continue to apply.

## Decision

Deploy the existing Next.js application from apps/web using Node 24. Keep domain code independent of hosting SDKs. Treat the deployed application filesystem as immutable. Any parser scratch must be unique, bounded, temporary and removed in finally; it is never evidence or retention storage. Preserve the isolated parser and its resource/permission limits. Actual deployed measurements at 100, 500 and 2,000 rows are required before acceptance; an external worker requires a separate ADR and owner approval.

Use typed infrastructure adapters for local filesystem and S3-compatible durable storage. Private raw imports and sanitized inspections use a private bucket; approved immutable spatial releases use a separate published bucket and configured CDN base. Application-generated keys, SHA-256 checks and bounded signed URLs define transport authority. PostGIS remains provenance and publication authority. Local storage remains available for development and regression tests. Never overwrite published release bytes.

LOCAL uses a loopback origin. PREVIEW is explicitly enabled, trusts only the exact configured Vercel deployment hostname, and has no database or object-store write credentials. STAGING and PRODUCTION require separate operator configuration with exact HTTPS origins and S3 storage. Vercel's production deployment slot may run LAND STAGING; it does not imply public launch. No custom public launch domain is authorized.

## Alternatives

A durable application volume is unsuitable for ephemeral functions. A public bucket with private-looking prefixes fails the privacy boundary. Provider-specific domain types and a premature distributed worker add unnecessary coupling. All are rejected.

## Security and compatibility

Preserve Admin RBAC, exact Origin checks, secure session cookies, isolated bounded XLSX parsing, explicit review/commit and UNKNOWN semantics. Previews reject database access even if credentials are accidentally injected. Storage credentials remain server-only. No domain schema, CRS, verification, immutable history or source/publication semantics change. Operational import metadata may be added by later additive migrations, with clean/upgrade tests. Existing local inspection files require an explicit migration path in milestone D.

## Rollback and future review

Roll back the application to a compatible prior deployment. Preserve new durable objects and migration data; prefer a forward database fix or validated isolated restore. Deactivate an invalid spatial release and reactivate the previous reviewed immutable release. Never rewrite bytes at a published URL. Revisit execution design only after deployed resource measurements demonstrate a blocker.

## Delivery override

The owner explicitly delegated all Git writes to host PowerShell/GitHub Desktop. Codex edits and validates milestone changes, then stops at checkpoints; the owner performs commits, pushes and PR delivery. Codex uses read-only Git inspection. The protected main and required check/e2e-core gates remain in force.
