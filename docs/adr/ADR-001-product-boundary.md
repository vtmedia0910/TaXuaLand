# ADR-001: Product boundary

Status: Accepted for Phase 0 implementation.

## Context

LAND requires independent trust and operations.

## Decision

Dedicated repository, database roles, credentials and deployment. Legacy content enters through staged import with LEGACY_IMPORT authority; no accounts or secrets.

## Alternatives considered

Shared BIKER/TRIP database or runtime modules were rejected because they erase product isolation.

## Consequences

More independent configuration; no direct cross-product joins.

## Future review conditions

Review only after a later approved phase and an explicit security design.
