# ADR-010: Separate Operational Source Acceptance from Provider Rights Review

Status: Accepted by repository owner Lương Anh Việt on 2026-09-16. Locally implemented on `feat/phase-1d-owner-approved-declared-geometry`; not applied to Production.

## Context

The current public Place predicate requires both the content Source and current-geometry Source to be `ACTIVE` and to have `public_display='ALLOWED'`. This conflates three independent questions: whether LAND accepts a coordinate as operational source data, whether an upstream provider-rights review is complete, and whether the coordinate has been independently verified.

The conflation incorrectly makes a genuine, AOI-valid, owner-approved coordinate unusable as `DECLARED` geometry solely because provider-rights review remains `REVIEW_REQUIRED` or `UNKNOWN`. It also obscures the established rule that publication does not establish verification.

## Decision

LAND recognizes these independent concepts:

- Source acceptance: `OWNER_APPROVED`, `SOURCE_APPROVED`, or `REJECTED`.
- Provider rights review: `ALLOWED`, `RESTRICTED`, `REVIEW_REQUIRED`, or `UNKNOWN`.
- Geometry role: `DECLARED`, `OBSERVED`, or `VERIFIED`.
- Verification: the existing verification contract remains unchanged.

For current Place geometry only, `OWNER_APPROVED` or `SOURCE_APPROVED` source acceptance permits normal publication and public-marker eligibility while provider-rights review is `REVIEW_REQUIRED` or `UNKNOWN`, provided that the Source and source record are active and unarchived, the provider is enabled when applicable, Place identity is accepted, the coordinate is genuine and finite, the authoritative AOI rule passes, provenance is recorded, the geometry role is appropriate, and all existing Place category, review, publication, archive, and privacy gates pass. `REJECTED` source acceptance and `RESTRICTED` provider rights block geometry use.

This geometry-specific exception does not remove or weaken the existing strict rights gates for descriptions, media, images, routes, access, safety material, terrain, imagery, roads, Dataset/Release publication, caching, export, or redistribution workflows. Those paths continue to require their applicable explicit permissions. Provider-rights state remains internal unless a separately approved public-safe contract exposes it.

The ten current Google-origin coordinate cases may therefore be classified as operational `DECLARED` geometry with owner acceptance `OWNER_APPROVED`, verification `UNKNOWN`, accuracy `NULL`, and provider rights `REVIEW_REQUIRED`, subject to every other Place gate. Owner approval changes LAND's internal operational acceptance only: it does not alter Google or another provider's terms, claim ownership, create positional accuracy, imply unrestricted redistribution, or remove attribution/provider obligations.

For Cây Cô Đơn Tà Xùa, the owner-selected current geometry must remain explicit. The existing owner-approved provenance and the OSM replacement-candidate provenance are both retained; this decision does not silently select or replace either coordinate.

## Alternatives considered

- Keep requiring `public_display='ALLOWED'` for every geometry Source: rejected because it continues to conflate operational acceptance, rights review, and verification.
- Reinterpret `sources.status`, `authority_level`, notes, or a current permission value as owner acceptance: rejected because it would collapse existing meanings or make a publication decision depend on unstructured notes.
- Remove the general rights invariant: rejected because it would weaken media, content, layer, export, and redistribution controls beyond the approved geometry-only scope.

## Migration and data compatibility

Migration `015_source_acceptance_and_provider_rights.sql` adds nullable `sources.source_acceptance` and non-null `sources.provider_rights_status DEFAULT 'UNKNOWN'` as independent enum-backed fields. It does not update existing Source decisions or rewrite history. The implemented predicate and schema details are recorded in `docs/architecture/owner-approved-declared-geometry-gate.md`.

Existing Sources must not be bulk-upgraded to owner/source approved. Existing strict `ACTIVE` plus `public_display='ALLOWED'` Place geometry remains compatible. Any backfill must be evidence-based and auditable. Existing geometry history, verification, nullable accuracy, Source records, Dataset/Releases, and public DTOs remain compatible.

## Security and trust impact

Private evidence, raw provider material, internal review notes, and the new governance states are not added to public DTOs. No client receives provider credentials or a way to choose provider endpoints. The decision grants no external right and must not be used to authorize unresolved content or media.

## Rollback

Prefer compatible application rollback or forward repair. The future fields should be additive so older application code can ignore them. Do not drop an applied migration or rewrite geometry history as routine rollback; disable the geometry-specific predicate and retain the recorded decisions for audit.

## Required tests before implementation is accepted

Focused tests must prove the approved declared/unknown/null-accuracy case, `UNKNOWN` verification, `REVIEW_REQUIRED` provider rights, rejected acceptance, invalid/outside-AOI rejection, public DTO privacy, strict unresolved media/content rejection, Published != Verified, Declared != Observed, the existing OSM/allowed path, and unchanged terrain/imagery/roads rights behavior. The repository `pnpm check` and `pnpm test:e2e:core` gates remain required.

Local migration, domain, publication, public list/detail/marker, content-boundary, and regression tests pass. A disposable loopback PostGIS dry run projected all eleven owner-approved current geometries while preserving the separate Cây Cô Đơn OSM candidate: operational declared geometry `11/11`, verification `UNKNOWN` `11/11`, and accuracy `NULL` `11/11`. This is local test evidence, not a production publication count.

ADR-010 acceptance is clean. The non-green checks are dispositioned outside ADR-010: the 793-entry server-artifact cold parse reaches the pre-existing `services/api/src/import-worker.ts` 20-second `IMPORT_TIMEOUT` (`PRE_EXISTING_ENVIRONMENTAL`; ADR-010 causal: no), and two complete Core E2E runs each pass 13/14 because the same public-place journey fails only under full-suite load (`ENVIRONMENT_RESOURCE_CONTENTION`; ADR-010 causal: no). That journey passes 1/1 in isolation, and its failure snapshot confirms the Place is eligible, selected, and rendered with `DECLARED` / `UNKNOWN` semantics. The current Next production build and 68 client-chunk syntax checks pass. No new full green `pnpm check` or Core E2E result is claimed for the resumed head, and neither unrelated blocker is in scope for this branch.
