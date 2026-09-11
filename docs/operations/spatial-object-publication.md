# Spatial object publication — Phase 0.5-E

PostGIS remains the publication/provenance authority. Object storage holds immutable bytes, not an alternative registry. The operator command does not create sources, infer rights, approve QA, change verification, or publish a draft automatically. Only TERRAIN and ROADS are supported; no Phase 1 processing is added.

## Existing and new releases

Apply migration 014 before deploying the new application. It adds immutable `spatial_object_deliveries` receipts, keyed by release ID and approved public origin. Existing published release/asset rows are not modified. Runtime roles have SELECT only on receipts; migration/operator credentials perform delivery. New runtime provisioning already grants SELECT on all tables. Custom roles need `GRANT SELECT ON spatial_object_deliveries TO <runtime-role>` and must NOT receive receipt INSERT/UPDATE/DELETE.

Use an existing reviewed Phase 0 release or prepare a new release through the existing GIS QA/registry workflow. The release must already be APPROVED or PUBLISHED, have a valid WGS84 bbox, license, completed pipeline run and registered published assets with sizes, MIME and SHA-256. Source status/public-display/derivative/redistribution/caching permissions and provider kill switches must permit delivery. An operator must review rights; the command never sets them to ALLOWED.

The Phase 0 local registration command remains local QA only. It can populate the accepted registry from the existing pipeline outputs, but is not a cloud rights-approval workflow. Do not run it against an unreviewed production dataset. Raw/normalized/derived assets and road observation/source records remain under the original pipeline policy.

### Register the reviewed terrain metadata as APPROVED

`register-approved-release.ts` is the bounded production-safe metadata onboarding gate for an already processed `LAND_HEIGHTMAP_V1` terrain build. It reuses one explicitly selected existing Source, requires operator database authority that the web runtime must not have, validates the source lock, committed QA evidence, build evidence, manifest, raw/normalized/derived files and every published tile, then transactionally registers the Dataset, immutable asset descriptors, COMPLETED pipeline evidence and an APPROVED Release. It does not create or change Source rights, upload objects, create a delivery receipt, call `publishRelease`, or produce a PUBLISHED Release.

The proposed Source metadata for `TX-DEM-2026-001` is shown below for owner review. It is not an approval and must not be submitted until the owner explicitly approves the rights record. The licence URL is evidence for that review, not an external legal opinion; `legalReviewedAt` remains `null`.

```json
{
  "id": "0633d396-ed73-4d00-880c-73a2d421e822",
  "name": "Copernicus GLO-30 Public AWS N21 E104",
  "providerId": null,
  "category": "TERRAIN",
  "authorityLevel": "THIRD_PARTY",
  "licenseName": "Copernicus WorldDEM-30 Free & Open",
  "licenseReference": "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf",
  "commercialUse": "ALLOWED",
  "publicDisplay": "ALLOWED",
  "caching": "ALLOWED",
  "derivatives": "ALLOWED",
  "redistribution": "ALLOWED",
  "legalReviewedAt": null,
  "sourceCrs": "EPSG:4326",
  "freshnessClass": "STATIC",
  "status": "ACTIVE",
  "lastCheckedAt": null
}
```

After owner rights approval, register that Source through the existing authenticated `POST /api/admin/sources` workflow. A separately authorized operator can then run:

```text
node --experimental-transform-types --env-file=<operator-env> pipelines/register-approved-release.ts 0633d396-ed73-4d00-880c-73a2d421e822 work/gis/TX-DEM-2026-001 docs/qa/terrain-2026-001.json
```

The command must return the exact Release UUID with `status: APPROVED`. Review that output and the registered metadata before separately authorizing object delivery. Registration does not authorize delivery or publication.

## Deliver approved bytes

Configure the dedicated LAND operator environment (never the browser): DATABASE_URL, LAND_ENVIRONMENT, SERVER_ORIGIN, OBJECT_STORE_DRIVER=s3, OBJECT_STORE_ENDPOINT, OBJECT_STORE_REGION, scoped OBJECT_STORE_ACCESS_KEY_ID/OBJECT_STORE_SECRET_ACCESS_KEY, PRIVATE_BUCKET, PUBLISHED_BUCKET and PUBLIC_ASSET_BASE_URL. Buckets must be separate. PUBLIC_ASSET_BASE_URL is one exact HTTPS origin, without path, credentials, wildcard, query or fragment. Map its root to the published bucket root. Do not place owner credentials in Vercel runtime.

From the repository, run for each reviewed release:

```text
node --experimental-transform-types --env-file=<operator-env> pipelines/publish-object-release.ts <release-uuid> <published-directory>
```

For the accepted sample outputs, use `work/gis/TX-DEM-2026-001/published` and `work/gis/TX-ROADS-2026-001/published` with their actual PostGIS release UUIDs. Query those IDs read-only; do not invent new identities for existing published releases. No source files, GIS bytes, secrets or generated assets are committed.

The command reads only the registered published file set. It rejects traversal/symlink inputs, missing/mismatched files, unexpected terrain entries and incomplete tile indexes. Each file is bounded to the existing 32-MiB adapter maximum, terrain manifests to 1 MiB, and the finite release to 128 MiB/5,462 files. This covers the accepted 341-tile sample; larger formats require a reviewed change, not silent limit increases. Terrain manifest version, source hash, pipeline version, vertical datum and resolution must match the registry. It checks all local files before public writes, rechecks bytes during upload, and verifies downloaded objects after upload.

Keys are generated as:

```text
spatial/terrain/{dataset-uuid}/{release-uuid}/manifest.json
spatial/terrain/{dataset-uuid}/{release-uuid}/{level}/{x}/{y}.bin
spatial/roads/{dataset-uuid}/{release-uuid}/roads.geojson
```

Relative tile references remain unchanged; manifests are not rewritten. Every PUT is conditional (`If-None-Match: *`). Retry accepts an existing object only after descriptor and downloaded-byte checksum verification. Conflicting bytes are never overwritten or deleted. A successful complete set creates one immutable PostGIS receipt and audit event; retry does not duplicate either. No receipt is committed for partial/error uploads. Reviewed objects uploaded before an interruption can exist in the public bucket without appearing in the application; retry completes them. Do not use this workflow for private/unapproved files. Do not garbage-collect published keys automatically.

The operator transaction holds release/assets/source/provider locks while verifying and uploading, to keep the checked authority consistent. Run in a maintenance window; it is not an HTTP handler or distributed worker. Public runtime requests do not perform object writes or filesystem reads.

## Activate and resolve

For APPROVED releases, use the existing authenticated Admin `publishRelease` workflow after successful delivery. It requires configure permission, existing spatial/license/QA gates, provider eligibility, and the receipt for the configured origin. Delivery alone does not change APPROVED to PUBLISHED. Already PUBLISHED local releases can be delivered without rewriting their immutable metadata or changing their publication timestamp.

In S3 mode, the runtime ignores registry public_url values and derives URLs only from the approved configured origin, registered release-scoped file and matching receipt. Missing receipt/configuration never falls back to a web-local spatial path. Only PUBLISHED releases with allowed active sources/providers and matching entry checksum are emitted. Retirement, source revocation or a kill switch suppresses new API projections; previously cached public URLs require provider/CDN revocation separately. LOCAL retains safe relative Phase 0 URLs only, never arbitrary HTTPS registry URLs.

Changing the CDN origin requires deliberate delivery/readback and a receipt for the new origin. Changing bucket mapping behind an existing origin requires operator verification; database receipts are not live provider-availability probes. Provider failure leaves the viewer's existing unavailable-layer/search fallback, not fabricated terrain.

## Provider controls and acceptance still required

- Published endpoint: GET/HEAD and only approved LAND origins in CORS. No browser PUT authority. Private bucket remains inaccessible anonymously.
- Keep `Cache-Control: public, max-age=31536000, immutable` on versioned spatial objects. Do not apply import lifecycle expiry to published releases. The S3 adapter supplies this header; verify the CDN preserves it.
- Use scoped operator publication credentials and provider policies preventing overwrite. Store/runtime credential rotation remains per the object storage guide.
- On real staging, run delivery of the reviewed sample, verify manifest and every tile/road checksum, anonymous public GET/HEAD, exact-origin CORS, wrong-origin behavior and actual Cesium desktop/mobile loading. Deploy/redeploy the web app without GIS binaries and verify identical URLs/bytes still load. Measure cold/warm CDN timing. Local adapter recreation is not evidence of a Vercel redeploy.
- Real provider accounts/credentials are not configured by this checkpoint. These checks remain unverified, not PASS.

## Recovery

Keep database backups with release metadata and delivery receipts; immutable objects have a separate retention policy. Migration 014 is additive and leaves the 13-migration data intact. Do not reverse it or rewrite published rows. Prefer forward repair or an isolated validated restore. A bad release is retired through PostGIS; restore the previous reviewed immutable release under operator control, never overwrite its bytes. Receipt immutability does not stop explicit provider revocation when legally required.

An old LOCAL application can still use unchanged local metadata/files. An old application that only understands relative URLs is not a valid serverless rollback target; use a compatible deployment or deliberately restore the local environment. Actual managed backup/restore and Vercel setup are later milestones, not 0.5-E.
