# Phase 0 architecture freeze

Phase 0 architecture is frozen after repository/local Release Candidate acceptance at `a93d0db9045181c9a972891f8d9d4fc7707ae6cb`. Phase 1 extends this accepted platform; it does not redesign it by default. Public production release, field accuracy and legal/source approval are not asserted by this freeze.

Authority remains the [Phase 0 specification](../PHASE_0_SPATIAL_FOUNDATION.md), [acceptance evidence](acceptance.md), [limitations](known-limitations.md) and [ADRs](../adr). Read these before proposing changes. This document does not authorize Phase 1 implementation.

## Frozen invariants

- **Product boundaries:** LAND remains an independent product/repository/database. No direct shared database, cross-product runtime database access or shared service-role credentials with BIKER/TRIP.
- **Spatial truth:** PostGIS is authoritative. CRS, coordinate order, horizontal/vertical datum, provenance and versions stay explicit. Metric calculations use the documented geography/projected CRS policy. UNKNOWN remains UNKNOWN; corrections preserve immutable geometry history. Rendered detail never establishes accuracy.
- **Verification:** source authority, observation verification and freshness remain separate. Seller, partner and imported claims never become VERIFIED automatically. Verification requires explicit method, evidence, authorized actor and timestamp. Location, access and safety are independent facts.
- **Publication:** ingest is not publish. Staging, draft, review and explicit publication gates remain. Public consumers receive typed public-safe DTOs, never raw/internal records. Published dataset releases/assets remain immutable and versioned.
- **Security:** secrets remain server-side; runtime database access remains least privileged. Admin permissions remain explicit and are checked against current roles/account state. No arbitrary provider endpoint input. Private imports, raw payloads, credentials and evidence stay outside public output.
- **Future AI:** no model gets generic database/SQL/RPC/browser/HTTP authority by default. Future AI consumes explicitly typed authoritative tools/services and cannot become spatial or legal authority. Public AI and its tools are not implemented by this freeze.

## Changes within the freeze

Bug, security, dependency compatibility and performance fixes that do not change facts are allowed, as are test/observability improvements, deployment hardening, documentation corrections and small internal refactors with no domain/contract impact. Preserve all invariants and run appropriate regression checks.

During pre-Phase 1 hardening, a runtime/domain exception additionally requires a reproducible bug/security defect/compatibility failure, the smallest safe fix, a regression test and documented evidence. No invariant may be weakened.

## Architecture changes require an approved ADR first

Before implementation, write a new ADR for changes to database/domain boundaries, CRS strategy, verification or source authority semantics, public DTO trust, geometry history, publication lifecycle, provider/secrets boundaries, cross-product sharing, AI tool authority, the core 3D engine or terrain/3D Tiles strategy.

The ADR must document the problem, current invariant, proposed change, alternatives, migration impact, data compatibility, security/trust impact, rollback and tests. It must explicitly require repository-owner approval **before implementation**, and record that approval. A feature request alone does not silently reopen these architectural decisions. Codex must surface the proposed change and wait for that approval.

## Delivery gate

Use a feature/fix branch and PR, with mandatory `check` and `e2e-core` once the main ruleset is active. Keep commits logical, inspect the final diff for architectural drift and preserve UNKNOWN in all authored QA fixtures. Release-heavy terrain/accuracy acceptance remains separate from deterministic Core E2E.

Stop after the four pre-Phase 1 hardening items. Wait for the dedicated `PHASE_1_TA_XUA_3D.md` specification and explicit approval before Phase 1.
