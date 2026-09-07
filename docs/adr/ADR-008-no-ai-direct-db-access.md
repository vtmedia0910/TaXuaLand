# ADR-008: No AI direct database access

Status: Accepted for Phase 0 implementation.

## Context

Future AI must consume spatial truth without becoming its source.

## Decision

No public chatbot or AI runtime in Phase 0. Future explicit read tools consume public-safe services; never arbitrary SQL/RPC/HTTP/browser/filesystem or mutation.

## Alternatives considered

Giving a model a database connection or generic tools rejected.

## Consequences

Contracts can evolve for future read-only tools; no speculative AI UI or provider configuration.

## Future review conditions

Review only under a later approved phase specification.
