# ADR-006: Verification semantics

Status: Accepted for Phase 0 implementation.

## Context

An imported claim and a LAND observation have different trust.

## Decision

Source authority and verification are independent. VERIFIED requires method, actor, evidence record, timestamp and freshness policy. Moving a marker resets verification to UNKNOWN. Expired evidence is displayed EXPIRED. Reviewed UNKNOWN places may publish only with geometry, category, source display permission and no blockers; UNKNOWN remains visible.

## Alternatives considered

Implicit verification from Google URLs, source prestige, imports or editor actions rejected.

## Consequences

Verification requires explicit verifier permission. No automated factual upgrade. Historical evidence is retained privately.

## Future review conditions

Review when the operator supplies a new field-verification procedure.
