# Admin spatial workflow

The editor calls the same transactional place application service as import commit. Coordinates are explicitly longitude/latitude in EPSG:4326. Candidate changes call authenticated PostGIS validation after a debounce; browser bounding boxes never replace authoritative polygon checks. Click/drag updates only the candidate. Saving an existing geometry change requires confirmation, closes its validity interval and inserts an UNKNOWN geometry. Earlier verified geometry remains visible for comparison.

Verification requires the `verify` permission, an exact place version and explicit confirmation. VERIFIED additionally requires a usable evidence source record, method, server timestamp/actor and a known freshness policy. Location verification appends geometry history. Access/safety verification snapshots prior content before changing trust. Every verification change returns the place to draft and increments its version. Browser tests never verify a factual location; integration verification evidence is synthetic in disposable databases.

Publishing requires the `publish` permission, explicit review of the current location status, source display rights, geometry, active categories and no blocking spatial validation. Nonblocking warnings need acknowledgement. Bulk actions are bounded to 50 unique selections, lock places in stable order and commit atomically. One invalid item rolls the entire operation back. Archiving preserves content/history.

Admin lists filter by name, category, source, publication, effective verification, missing coordinates and expiry. HTTP filters parse boolean text explicitly (`false` never becomes true). Metric road context uses PostGIS geography, a geography GiST index and a 5 km search radius. Mapped proximity does not establish access or safety.

`node --env-file=.env.local infra/configure-aoi.mjs` configures the documented LAND operational demo rectangle only if no AOI is active. It is not an administrative/cadastral boundary and never replaces an existing active AOI. Production coverage changes require a separately versioned polygon and documented source.
