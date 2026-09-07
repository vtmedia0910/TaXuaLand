# Source registration and releases

SYSTEM_ADMIN registers a source through POST /api/admin/sources using the strict SourceSchema. Admin registry pages are read-only. Provider credentials belong only in server environment/secret storage, never source fields. Credentials cannot be entered through the source schema.

Record authority separately from verification. For license rights (commercial use, display, caching, derivatives, redistribution), each value is ALLOWED, DENIED or UNKNOWN. Record the license reference and review date; absent evidence remains UNKNOWN. No place with a source lacking public display rights can publish.

Manual edits create immutable source records with a payload hash. Legacy imports have LEGACY_IMPORT authority and UNKNOWN/DECLARED verification. Registry status ACTIVE means operationally available, never factually verified.

Dataset releases identify source version, processing version, horizontal CRS, vertical datum, resolution, checksum and QA status. APPROVED precedes explicit publication. Publishing retires the previous release and is audited. Asset bytes at a release URL must be immutable. Raw/normalized/derived storage remains private.

No real terrain, roads, imagery or place verification has been approved merely by creating this registry. Development fixture sources are marked synthetic and must not be published as real data.
