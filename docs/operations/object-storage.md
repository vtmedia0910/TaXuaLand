# Object storage — Phase 0.5-C

The server-side adapters live in services/api/src/storage. No browser module imports them. No storage route or credential-bearing DTO is added in C. Existing import runtime still uses its Phase 0 files until D connects the new adapters.

## Contracts and boundaries

ObjectStore supports put/get/head/delete. ObjectStoreSigner supports signed upload/download; only the S3 adapter implements network signing. Local development callers use the filesystem adapter directly; no local HTTP signing service is needed at this milestone. All operations use typed descriptors (key, length, MIME, SHA-256), configured zones and bounded bytes. Callers cannot supply a bucket or endpoint per operation. Strict input validation rejects unexpected descriptor fields. Key generators take server-owned batch/dataset/release IDs; arbitrary request keys must never reach these methods.

Raw import keys: imports/raw/{batch UUID}/{object UUID}.xlsx. Inspections: imports/inspection/{batch UUID}/{object UUID}.json. Published spatial keys: spatial/{kind}/{dataset UUID}/{release UUID}/{file}. Both zones permit diagnostics/{UUID}.json. Only the documented extensions/MIME types are accepted; traversal, encoded separators, absolute paths, noncanonical keys and Windows reserved device names are rejected.

Each raw workbook is at most 8 MiB. Other individual objects are at most 32 MiB; terrain tiles remain small. This deliberately bounded adapter buffers one object rather than adding multipart/streaming infrastructure. Larger future individual assets require a reviewed streaming implementation, not raising the ceiling silently. File extension/MIME/checksum do not establish XLSX safety: D must still invoke the existing isolated container/parser checks.

## Local filesystem

Construct LocalFilesystemObjectStore with an absolute private root and a zone. Use separate roots for private and published stores, outside apps/web/public. Files are internal metadata+bytes envelopes, not directly served web assets. A unique temporary sibling is fully written and linked exclusively to the final key; competing writers cannot overwrite or expose a partially written object. Scratch is removed in finally. Reads verify length and SHA-256; a fresh adapter instance can read the same persisted objects. In-tree symlinks/junctions and root symlinks are rejected. The root and its ancestors must be operator-owned and unwritable by untrusted local processes; this is not a defense against a hostile OS administrator racing filesystem operations.

This new format does not modify or migrate the existing work/imports/{id}.json files. D must supply legacy inspection compatibility/migration. The local adapter does not issue signed URLs or claim internet isolation through local filesystem modes on Windows; operator ACLs remain required.

## S3-compatible transport

Construct S3CompatibleObjectStore using validated deployment environment configuration and private/published zone. PREVIEW is rejected even if credentials were accidentally supplied. The bucket comes only from PRIVATE_BUCKET/PUBLISHED_BUCKET; they must differ. The endpoint is configured HTTPS, except loopback HTTP for local tests. AWS SDK v3 and credentials remain inside the adapter. There is no default credential-chain discovery or automatic region redirection. Retries are limited to two attempts, with bounded request/connection timeouts.

Every PUT uses If-None-Match: *; an existing key is a conflict even when bytes match. Network acknowledgment loss may therefore return CONFLICT after a successful upload. Callers may reconcile by get and comparison with the independently persisted expected descriptor; never retry with an overwrite. Private deletes are idempotent. The application adapter refuses deletion of published release files; rights-revocation removal requires an explicit operator action outside it. Dedicated diagnostic objects may be deleted in either zone.

SHA-256 is stored as transport metadata, and get always hashes downloaded bytes. head only reports metadata: it does not prove integrity or provenance. Server put additionally reads back and verifies the result. Finalize in D must compare returned key, size, MIME and SHA-256 against the batch's expected descriptor in PostGIS, then inspect the XLSX container. Provider metadata is never provenance authority. Native full-object checksum support varies among compatible providers, so the adapter disables optional SDK checksum negotiation and performs its own verification. See [R2 S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/).

Signed PUT is limited to a generated private raw XLSX key and 30–600 seconds. The signature binds exact length, MIME, expected SHA-256 metadata, create-only header and private caching. Browser code sends the returned headers and the exact File body; the browser supplies Content-Length itself. Wrong-length signatures must be rejected by the selected provider. Signed GET authorizes one private key for the same bounded lifetime and requests attachment/no-store. Signed URLs are bearer capabilities and must never enter logs, audit details, durable DTOs or public output. AWS's [presigner documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/) describes signed header handling.

## Operator requirements before staging

1. Create separate private and published LAND buckets. Disable public access on the private bucket; names alone do not enforce privacy.
2. Grant the application only required object operations within LAND prefixes. Restrict public publication credentials and disallow overwrite/delete of immutable release keys at provider policy where supported. Do not use account-admin credentials.
3. Configure private upload CORS for exact LAND HTTPS origin, PUT and the signed content-type, x-amz-meta-sha256, if-none-match and cache-control headers. Permit private GET only if a reviewed download flow needs it. Expose only necessary response headers.
4. Configure published CDN access and exact approved read origins with GET/HEAD. Do not enable browser write CORS on published storage.
5. Apply seven-day expiry to imports/raw/ and imports/inspection/ in private storage. Preserve PostGIS staging/audit/provenance. Diagnostics need cleanup after every run; interrupted local .pending-* files require operator cleanup, never evidence retention.
6. Inject the environment names from .env.example server-side. Set an approved public asset host; do not accept it from Admin input. Runtime release resolution/publication follows in E.
7. Verify conditional PUT, signed headers/expiry, wrong-size/type rejection, private unauthenticated denial, CDN reads/CORS and lifecycle on the actual provider before acceptance. No real provider configuration has occurred in C.
8. Rotate by provisioning a replacement scoped credential, updating the deployment secret, verifying reads/writes and then revoking the old credential. Revoke immediately on compromise; outstanding signed URLs may remain usable until expiry depending on the provider's revocation semantics, which must be tested.

## Validation and remaining work

tests/object-storage.test.ts exercises real temporary filesystem I/O and actual SDK HTTP serialization against an in-process S3 protocol fixture without cloud credentials. The fixture is not an IAM or SigV4 verifier. Tests inspect signature-bound headers and keys, conditional writes, missing objects, read integrity, size limits, safe errors and persistence across adapter instances. Provider cryptographic enforcement, real bucket privacy, CORS, browser upload, cold Vercel persistence and lifecycle remain staging acceptance requirements. RBAC/upload issuance limits and batch association/idempotent finalize belong to D, which must gate these infrastructure methods through authenticated application services.
