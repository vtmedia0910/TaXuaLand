# ADR-005: Public-safe API boundary

Status: Accepted for Phase 0 implementation.

## Context

Public consumers must not receive source payloads or administrative evidence.

## Decision

HTTP handlers call typed application services. Public endpoints select published records and explicitly construct Zod DTOs. DTO parsing strips unknown keys; nested objects allowlist fields. Separate privileged repository access and role checks.

## Alternatives considered

Raw SELECT * serialization, client database service credentials and generic RPC endpoints rejected.

## Consequences

New public fields need explicit contracts and leak tests. Public freshness/authority/verification remain distinct.

## Future review conditions

Review whenever a new external consumer or public factual section is added.
