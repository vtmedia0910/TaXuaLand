# ADR-007: Admin import staging

Status: Accepted for Phase 0 implementation.

## Context

Excel is untrusted human data, not a database migration.

## Decision

Inspect bounded xlsx in a worker; exclude account/credential sheets; select sheet, deterministically map columns, normalize, validate, identify duplicates, stage and map-review. Explicit CREATE/UPDATE/SKIP/REVIEW_LATER. Commit chosen valid rows atomically to drafts and audit. No automatic publish or merge.

## Alternatives considered

Direct INSERT, macro formats, arbitrary remote fetches, AI-only mapping and automatic duplicate merges rejected.

## Consequences

Row hashes, source identity, errors, decisions and batch totals persist. Raw files private with time-bounded retention. Formula cells never execute.

## Future review conditions

Review when supported formats, volume limits or retention needs change.
