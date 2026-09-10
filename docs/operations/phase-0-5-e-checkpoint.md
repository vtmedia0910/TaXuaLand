# Phase 0.5-E checkpoint — External published spatial assets

Date: 2026-09-09. Milestone E code/local validation complete; overall Phase 0.5 remains PARTIAL, not staging PASS.

Starting/final HEAD: `30b5f6cba5399fc517d52c8ba294d4d312271734`. Branch: `feat/phase-0-5-production-deployment`. PR #2 is owner-reported; its D checkpoint passed all four push/pull_request checks according to the owner. E is uncommitted working-tree code; no new E GitHub run is claimed. No Git writes or Git Data API were used.

## Delivered scope

- Operator-only `publish-object-release.ts` consumes APPROVED/PUBLISHED PostGIS release metadata and the registered published file set. It preserves source/license/provider/spatial gates; never creates approval, changes UNKNOWN or publishes a draft automatically.
- Generated dataset/release UUID object paths, conditional immutable PUT, full checksum/size/MIME readback and safe retry. Terrain manifest/tile hashes and provenance/version/CRS/datum/resolution/bbox remain tied to PostGIS.
- Additive migration 014 introduces immutable delivery receipts with runtime SELECT-only access. Existing published release/asset metadata is untouched; delivered metadata cannot be rewritten behind the receipt. All 13 earlier migrations remain unchanged.
- Approved public URL resolver derives CDN URLs from the configured HTTPS origin and matching PostGIS receipt. Arbitrary registry URLs, wrong release keys, missing receipts and unapproved/retired/revoked releases do not select external URLs. S3 runtime does not read web-local spatial files.
- Delivery of APPROVED releases is separate from the existing explicit Admin publication step. That step requires successful delivery for the configured S3 origin. Existing LOCAL URLs remain supported for local QA.
- No dependencies, GIS binaries, deployment account configuration, Phase 0.5-F or Phase 1 were added.

## Modified files (7)

```text
docs/operations/deployment.md
docs/operations/known-limitations.md
docs/operations/object-storage.md
pipelines/README.md
services/api/src/layers.ts
services/api/src/registry.ts
tests/durable-import.test.ts
```

The D test changes only its expected current migration count from 13 to 14; its Phase 0 upgrade scenario still executes the original first 12 migrations before upgrade.

## New files (6, including this report)

```text
docs/operations/phase-0-5-e-checkpoint.md
docs/operations/spatial-object-publication.md
infra/migrations/014_spatial_object_deliveries.sql
pipelines/publish-object-release.ts
services/api/src/published-assets.ts
tests/spatial-delivery.test.ts
```

Ignored operator/QA files under work/ and the existing ignored .env.local are not commit inputs. The temporary sample QA script and byte copies were local test artifacts, not a replacement publication workflow.

## Git diff --stat

```text
 docs/operations/deployment.md        |  2 ++
 docs/operations/known-limitations.md |  2 ++
 docs/operations/object-storage.md    |  2 ++
 pipelines/README.md                  |  2 ++
 services/api/src/layers.ts           | 21 ++++++++++++++++-----
 services/api/src/registry.ts         | 34 ++++++++++++++++++++++++++++++++--
 tests/durable-import.test.ts         |  2 +-
 7 files changed, 57 insertions(+), 8 deletions(-)
```

Read-only Git stat excludes the six untracked new files until the owner stages them. They must be included in the checkpoint.

## Validation

| Gate | Result |
| --- | --- |
| pnpm check | PASS: lint, all typechecks, 15 suites / 120 tests, production build, 66 client chunk syntax checks and secret scan |
| Relevant PostGIS/storage tests | PASS: publication versus delivery, immutable retries, wrong/missing/corrupt input, provider failure/kill switch, revoked source rights, retirement, wrong origin/key, and persistence after deleting pipeline input |
| Migration | PASS: fresh DB and upgrade of accepted Phase 0 schema through migration 014; earlier metadata/immutability tests retained |
| pnpm test:e2e:core | Final run PASS, 9/9 on completed production build |
| Secret scan | PASS: repository/new files and 210 built public artifacts; values never printed |
| git diff --check | PASS |
| Native Node operator CLI | Loads under Node 24 --experimental-transform-types; missing config fails safely without values |

One earlier Core run failed its existing five-second `data-settled` assertion after public place selection (search/detail/UNKNOWN were present). No assertion, timeout or viewer code was changed. The final sequential full run passed all nine tests. This transient local timing failure is recorded rather than hidden; E GitHub checks still need owner push.

Additional local sample byte verification used a newly created disposable PostGIS DB and local object store (not cloud). `TX-DEM-2026-001` delivered/read back all 342 objects (manifest + 341 tiles), and `TX-ROADS-2026-001` delivered/read back its one GeoJSON object. Both same-key retries passed. Entry hashes remained:

```text
terrain: ff17bcb5a85ddd31e47b7e2d8e6742819f3aacb47ca8a3a611dc5c0a859eb5e6
roads:   7c36bbb1c8d9da99cc88c14f78c939be3fb1ee812580abef56557cadbb752bc0
```

That fixture grants rights only inside a disposable QA DB to exercise transport of the already available sample bytes. It establishes no new legal/source approval or field verification. Original GIS outputs and user databases were not modified. Temporary DBs, runtime roles and owned sample object copies were cleaned up; the independent loopback QA PostGIS server is stopped at handoff.

## Not verified without real provider/cloud

Actual S3/CDN IAM enforcement, anonymous published GET/HEAD, private bucket denial, origin CORS, cache header preservation, real external Cesium desktop/mobile load, cold/warm CDN timing and Vercel redeploy persistence are NOT VERIFIED. Unit tests and local adapter recreation do not prove these. No cloud upload/deployment was performed and no staging URL is claimed.

For later provider acceptance supply a LAND-authorized project/environment, dedicated managed PostGIS endpoints/roles, scoped S3 endpoint/region/credentials, separate buckets, approved asset HTTPS origin mapped to the published bucket and exact LAND staging origin. Supply secrets via private environment/secret manager, not chat. See [operator steps, lifecycle and recovery](spatial-object-publication.md).

Frozen Phase 0 domain/spatial/verification architecture changed: NO. Infrastructure delivery receipts implement the authorized Phase 0.5 transport change; PostGIS is still the authority. Phase 0.5-F started: NO. Phase 1 started: NO.

Suggested commit: `feat(spatial): publish immutable object releases and resolve approved CDN URLs`

STOP for owner commit/push to PR #2 outside the sandbox, then required check/e2e-core on push and pull_request.
