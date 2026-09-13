# Sentinel-2 L2A via AWS COGs — Slice 1C evidence note

Status: read-only source research; no scene selected or downloaded; no Source, Dataset, Release, DB, R2, Vercel, or publication mutation.

> **Owner decision update — 2026-09-12.** Exact Item
> `S2C_T48QVJ_20260527T033930_L2A` is approved for local Slice 1C candidate
> construction. Its sensing time is `2026-05-27T03:42:16.849000Z`, scene cloud
> is `8.200835%`, native CRS is `EPSG:32648`, and the accepted AOI SCL
> obstruction is approximately `5.86%` against the fixed `<= 10%` gate. Full
> AOI containment and exact source checksums remain fail-closed pipeline checks.
> Only Item JSON, TCI/visual, and SCL source assets are authorized for
> acquisition. The historical discovery blockers below are superseded by this
> decision but retained as research history.

## Source identity and rights evidence

- Proposed canonical Source name: `Copernicus Sentinel-2 Collection 1 Level-2A Surface Reflectance / AWS Open Data COGs`.
- The authoritative product family is Sentinel-2 MSI Level-2A surface reflectance (formerly BOA reflectance). Products use 110 km × 110 km UTM/WGS84 tiles and include 10 m true-colour imagery, 20 m Scene Classification (SCL), quality masks, and 10/20/60 m bands. Nominal pixel size is not positional accuracy or LAND verification. ([Copernicus SentiWiki](https://sentiwiki.copernicus.eu/web/s2-products), [Sentinel-2 Collection 1 L2A description](https://sentinels.copernicus.eu/data-products/-/asset_publisher/fp37fc19FN8F/content/id/4715515))
- Preserve the complete product identity. The compact product name encodes mission, `MSIL2A`, sensing start, processing baseline, relative orbit, MGRS tile, and product discriminator; acquisition time and processing time are different facts. ([Copernicus SentiWiki](https://sentiwiki.copernicus.eu/web/s2-products), [Sentinel-2 Product Specification](https://sentinels.copernicus.eu/documents/d/sentinel/s2-pdgs-cs-di-psd-v15-0))
- Licence name/reference: `Copernicus Sentinel Data Legal Notice (rev. 1)` / `https://cds.climate.copernicus.eu/licences/ec-sentinel`. The notice grants lawful reproduction, distribution, communication to the public, adaptation, modification, and combination, without warranty. This is not a Creative Commons licence. ([European Commission legal notice](https://cds.climate.copernicus.eu/licences/ec-sentinel), [Copernicus Data Space terms](https://dataspace.copernicus.eu/terms-and-conditions))
- Proposed Source-rights mapping, subject to the owner's recorded product-governance acceptance: `commercialUse=ALLOWED`, `publicDisplay=ALLOWED`, `caching=ALLOWED`, `derivatives=ALLOWED`, `redistribution=ALLOWED`; keep `legalReviewedAt=null` unless an actual legal review occurs.
- A LAND crop/mosaic/reprojection/tile product is modified data and must show `Contains modified Copernicus Sentinel data [acquisition year]`. Also retain the AWS access citation separately: `Sentinel-2 Cloud-Optimized GeoTIFFs was accessed on [access date] from https://registry.opendata.aws/sentinel-2-l2a-cogs.` ([European Commission legal notice](https://cds.climate.copernicus.eu/licences/ec-sentinel), [AWS Registry of Open Data](https://registry.opendata.aws/sentinel-2-l2a-cogs/))

## AWS acquisition evidence

- Preferred discovery collection: Earth Search v1 `sentinel-2-c1-l2a`; COGs are generated from ESA/Sinergise JPEG 2000 inputs, stored in `e84-earth-search-sentinel-data` in `us-west-2`, and processed to at least baseline 5.0. Public assets use HTTPS URLs. Earth Search is best-effort and its documented historical gaps must not be treated as a current no-data finding. ([AWS registry](https://registry.opendata.aws/sentinel-2-l2a-cogs/), [Earth Search documentation](https://github.com/Element84/earth-search/blob/main/README.md), [live collection](https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a))
- Discovery must pin the API URL, collection ID, query geometry, UTC date interval, query time, and returned Item JSON. Do not use the STAC API or source asset URLs as browser runtime imagery endpoints.
- Require from every selected Item: `collection`, Item `id`, WGS84 `geometry` and `bbox`, `datetime`, platform/instrument, `eo:cloud_cover`, product URI/name, MGRS/grid code, orbit/tile identifiers, processing baseline/generation time, and self/collection/source links. A STAC `intersects` query is discovery only; acceptance must use Item geometry, not bbox, to prove coverage. ([STAC Item specification](https://github.com/radiantearth/stac-spec/blob/master/item-spec/item-spec.md), [Earth Search documentation](https://github.com/Element84/earth-search/blob/main/README.md))
- Minimum source asset set for a display product: `visual`/TCI COG at nominal 10 m GSD, `scl` COG at nominal 20 m for AOI QA/masking, and the available product/granule/tile metadata assets. For each, retain exact asset key and URL, roles, MIME, GSD, byte size, `proj:code` (or legacy `proj:epsg`), `proj:shape`, `proj:transform`, and `file:checksum`. ([live collection asset definitions](https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a), [STAC Projection extension](https://github.com/stac-extensions/projection), [STAC File Info extension](https://github.com/stac-extensions/file))
- Preserve upstream `file:checksum` as a lowercase hexadecimal Multihash and independently compute LAND SHA-256 for the fetched Item evidence and every downloaded/derived byte. Never use S3 ETag as the content checksum; multipart/encrypted ETags need not be whole-object MD5. ([STAC File Info extension](https://github.com/stac-extensions/file), [AWS S3 integrity documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html))

## Candidate acceptance implications

1. Search the live Collection 1 catalogue with the approved AOI geometry, acquisition window, and owner-approved scene-wide `eo:cloud_cover` ceiling.
2. Preserve all returned evidence, then prove that the union of selected assets' valid-data footprints covers the exact approved AOI. Nominal tile size, bbox coverage, or intersection is insufficient because Sentinel tiles can be partially filled and bands can contain nodata. ([Copernicus SentiWiki](https://sentiwiki.copernicus.eu/web/s2-products), [STAC Item specification](https://github.com/radiantearth/stac-spec/blob/master/item-spec/item-spec.md))
3. Compute AOI-specific nodata and cloud percentages from SCL/quality data. `eo:cloud_cover` is only a scene-level 0–100 estimate, so it cannot alone establish acceptable AOI visibility. ([STAC EO extension](https://github.com/stac-extensions/eo), [Copernicus SentiWiki](https://sentiwiki.copernicus.eu/web/s2-products))
4. Rank only candidates that pass containment and both cloud gates; prefer the newest acquisition only after those gates. Record sensing time as freshness, separately from source generation, LAND processing, delivery, and publication times.
5. Use one Item when it covers the AOI with valid pixels; mosaic only the minimum same-acquisition compatible Items needed for coverage. Record ordering, masks, resampling, colour handling, CRS transformation, tool versions, commands/options, inputs, outputs, and hashes. If analytic bands replace TCI, honor per-asset scale/offset, especially across processing baselines. ([Earth Search documentation](https://github.com/Element84/earth-search/blob/main/README.md))

## Cesium delivery implication

- `UrlTemplateImageryProvider` supports north-origin XYZ `{z}/{x}/{y}` and TMS `{z}/{x}/{reverseY}`. Defaults are Web Mercator, 256 × 256 tiles, minimum level 0, and no maximum level; it supports an explicit rectangle and visible credit. ([CesiumJS API](https://cesium.com/learn/cesiumjs/ref-doc/UrlTemplateImageryProvider.html))
- Smallest deterministic LAND contract: release-scoped HTTPS `.../{z}/{x}/{y}.png`, Web Mercator XYZ, `image/png`, 256 × 256, explicit EPSG:4326 coverage rectangle, minimum/maximum levels, immutable cache/CORS, no pick-feature URL, and the required modified-data credit. The target zoom ceiling must be derived from the selected 10 m source and verified output; resampling must not claim added detail.
- The public manifest should expose the immutable URL template and tile hashes plus release/source/coverage/acquisition/licence/attribution/verification metadata. It must not expose STAC source URLs as arbitrary client-selected providers. Any manifest/tile failure returns to the labeled `NEUTRAL_GRID` state.

## Unresolved blockers

- Exact authoritative LAND AOI geometry/version.
- Owner-approved acquisition date window/freshness policy.
- Owner-approved scene-wide cloud ceiling.
- Owner-approved AOI-specific cloudy-pixel ceiling and exact SCL classes counted as cloud/obstruction.
- Live Collection 1 candidate Item(s), valid-pixel containment, exact asset identities, upstream checksums, source CRS, acquisition time, and processing baseline.
- Whether one Item covers the AOI or a same-acquisition mosaic is required.
- Owner acceptance of the proposed Source-rights mapping and exact public notices; this evidence is product governance, not external legal advice.
- Final output zoom range and edge/nodata encoding after candidate inspection and pipeline QA.

Local PowerShell read-only candidate discovery failed with a TLS receive error. That is local-path evidence only, not an Earth Search/provider failure; no candidate was selected and no scene bytes were downloaded.
