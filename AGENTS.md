# Repository guidance

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Phase 0 architecture freeze](docs/operations/phase-0-architecture-freeze.md) before editing. Preserve the accepted domain, spatial, verification, provenance and security boundaries. Changes listed in the freeze require a new ADR and explicit owner approval before implementation.

Use logical commits on a branch, validate `pnpm check` and `pnpm test:e2e:core`, then deliver through a PR with the required GitHub checks. Never commit secrets, raw workbooks or generated GIS assets. Phase 1 implementation requires its dedicated specification and explicit approval.
