# ADR-004: Spatial storage and versioning

Status: Accepted for Phase 0 implementation.

## Context

Terrain bytes and corrected geometry need reproducible history.

## Decision

Raw/normalized/derived zones private; only explicit approved published releases public. Immutable version/checksum keys, release manifests, pipeline versions and QA metadata. Correct geometry by closing prior interval and inserting new geometry in one transaction.

## Alternatives considered

Mutable latest.tif URLs and destructive coordinate updates rejected.

## Consequences

Object storage lifecycle cleanup must preserve auditable release ancestry. Current pointers may change; release bytes may not.

## Future review conditions

Review when retention, measured storage cost or regional coverage changes.
