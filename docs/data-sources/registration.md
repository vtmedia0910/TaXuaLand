# Source registration and releases

SYSTEM_ADMIN registers a source through POST /api/admin/sources using the strict SourceSchema. Admin registry pages are read-only. Provider credentials belong only in server environment/secret storage, never source fields. Credentials cannot be entered through the source schema.

Record authority separately from verification. For license rights (commercial use, display, caching, derivatives, redistribution), each value is ALLOWED, DENIED or UNKNOWN. Record the license reference and review date; absent evidence remains UNKNOWN. No place with a source lacking public display rights can publish.

Manual edits create immutable source records with a payload hash. Legacy imports have LEGACY_IMPORT authority and UNKNOWN/DECLARED verification. Registry status ACTIVE means operationally available, never factually verified.

Dataset releases identify source version, processing version, horizontal CRS, vertical datum, resolution, checksum and QA status. APPROVED precedes explicit publication. Publishing retires the previous release and is audited. Asset bytes at a release URL must be immutable. Raw/normalized/derived storage remains private.

No real terrain, roads, imagery or place verification has been approved merely by creating this registry. Development fixture sources are marked synthetic and must not be published as real data.

## Operator procedure

Gather a source name, provider/reference, authority, source CRS, freshness and evidence for each licence permission. Keep unsupported permissions UNKNOWN and use REVIEW_REQUIRED until reviewed. A public web page is not evidence of redistribution rights. `legalReviewedAt` records an actual documented review, never an inferred date. A provider record contains only a safe identifier/type/status/health/timeout/kill-switch; its credentials belong to the server secret store.

In an authenticated SYSTEM_ADMIN browser session, submit the complete strict SourceSchema to `/api/admin/sources` with a same-origin JSON request. The minimum shape includes `id` (UUID), `name`, nullable `providerId`, `category`, `authorityLevel`, nullable `licenseName`/`licenseReference`, `commercialUse`/`publicDisplay`/`caching`/`derivatives`/`redistribution`, nullable `legalReviewedAt`, `sourceCrs`, `freshnessClass`, `status` and nullable `lastCheckedAt`. Use UNKNOWN/null explicitly; do not add arbitrary credential or provider-payload fields. The API authenticates the configure permission and records SOURCE_REGISTERED audit. Refresh `/admin/sources` to inspect the stored metadata. Source registration is an API/operator workflow in Phase 0; registry screens are read-only.

For the sample DEM/roads release, follow `pipelines/README.md`; the owner-only local adapter validates input hashes and source rights, registers pipeline/assets/source records, and records maintenance audit before local QA publication. Source authority stays THIRD_PARTY, location verification stays UNKNOWN and legal review remains unset. Production publication requires the deployment-specific rights review and object-store procedure. Source disabling or provider kill switch removes new public DTOs/layers; separately revoke cached CDN objects when required. Never rewrite a published release or overwrite immutable bytes to correct metadata: create a new version with a traceable change.
