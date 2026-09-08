# TÀ XÙA LAND

Independent spatial platform, Phase 0. Architecture authority: [specification](docs/PHASE_0_SPATIAL_FOUNDATION.md).

## Development

Use Node 24 and pnpm 11.19.0. Run `pnpm install --frozen-lockfile`. Configure the dedicated LAND database/runtime environment using the [deployment guide](docs/operations/deployment.md), apply migrations, provision the runtime role and create an administrator. Run `pnpm check`, then `pnpm dev` for development or `pnpm --filter @land/web start` for a validated production start.
Admin is under `/admin`; the public Cesium explorer is `/map`. Domain/application packages remain separate from routes.
No application credentials or databases are shared with other Tà Xùa products.

## Implementation status

Phase 0 repository/local release-candidate acceptance is complete; see [milestones](docs/operations/implementation-status.md) and [acceptance evidence](docs/operations/acceptance.md). This does not claim public production deployment or verified field accuracy. UNKNOWN remains UNKNOWN.

## Operations and evidence

- [Operator guide](docs/operations/operator-guide.md) and [Excel import guide](docs/operations/admin-import-guide.md)
- [Source registration](docs/data-sources/registration.md) and [verification guide](docs/operations/verification-guide.md)
- [Reproducible terrain/roads pipeline](pipelines/README.md), [performance baseline](docs/operations/performance.md), [security review](docs/security/phase-0-review.md)
- [Acceptance evidence](docs/operations/acceptance.md), [known limitations and Phase 1 handoff](docs/operations/known-limitations.md)

GIS binaries and private QA artifacts are excluded from Git. Rebuild/publish the sample releases with the pipeline before terrain E2E. Unit/integration tests use disposable PostGIS databases; set `DATABASE_TEST_URL` to run them locally. CI supplies its own isolated PostGIS service and performs a frozen install, all checks, client syntax validation and secret scan. Browser E2E uses the local production server and authored fixtures; never point it at a public production database.
