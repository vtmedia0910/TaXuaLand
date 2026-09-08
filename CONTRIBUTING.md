# Contributing

Phase 0 architecture is frozen at its accepted release candidate. Contributors and Codex must read the [architecture freeze](docs/operations/phase-0-architecture-freeze.md) before changes; architecture changes require an approved ADR before implementation. Use a branch and PR with `check` and `e2e-core` required by the main ruleset. Phase 1 requires its own specification and explicit approval.

Follow the Phase 0 specification and milestone order. Use strict typed contracts, parameterized SQL and explicit application services.
Run `pnpm check` at each milestone; run integration and browser checks for affected behavior. Record runtime evidence and limitations.
Commit logical milestones with clear messages. Never commit credentials, raw workbooks, generated terrain or large GIS binaries.
