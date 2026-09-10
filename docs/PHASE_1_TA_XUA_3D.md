# Phase 1 — TÀ XÙA 3D

Status: **DRAFT — OWNER APPROVAL REQUIRED**

Baseline: `e08b5aa5919709c639e7bd81120b10feffd85b9d`

Implementation authorization: **NOT GRANTED**

This specification extends the accepted Phase 0/0.5 architecture. It does not reopen the core engine, data authority, publication lifecycle, product boundaries, or provider/secrets boundaries.

Authority order:

1. approved architecture, ADRs, contracts, migrations, and tests;
2. this specification after owner approval;
3. [Series 00–10 visual catalog](visual-specs/README.md), led for this phase by Series 01 v2;
4. specialist presentation guidance.

Visual samples are illustrative. They are not source data, verified coordinates, accepted providers, performance evidence, or implementation authorization.

Frozen authority and semantics:

```text
PostgreSQL/PostGIS = authoritative spatial/application truth
CesiumJS = primary 3D geospatial client
Object storage = artifacts, not spatial authority
GIS pipelines = reproducible spatial processing

Declared != Observed != Verified
Published != Verified
Dataset != Release
Import Commit != Publish
Published Release = immutable
Unknown != Zero
LAND != BIKER != TRIP
AI != spatial authority
```

---

## 1. Purpose

Phase 1 turns the accepted spatial foundation into a useful public, map-first understanding of Tà Xùa. A visitor can orient within the region, see approved terrain and spatial context, find a published Place, move the camera to it, and understand the source, freshness, and verification status of what is shown.

This value stands independently of future Property, AI, Brokerage, mobility, or travel-commerce features. The product promise is honest spatial context, not a tourism-card catalog and not a photorealistic claim of ground truth.

---

## 2. Phase entry conditions

- Phase 0 spatial foundation is accepted at repository/local release-candidate level.
- Phase 0.5 production deployment hardening is closed and merged through PR #2.
- Phase 0.5 provider acceptance is PASS; that transport evidence does not certify any Phase 1 dataset, licence, or accuracy.
- The agent-workflow migration is merged through PR #3.
- This specification is drafted from baseline `e08b5aa5919709c639e7bd81120b10feffd85b9d`.
- Phase 1 implementation remains blocked until the owner explicitly approves this specification.

ADR assessment: **none required for the scope as written**. Any implementation discovery that requires changing a frozen decision remains **ADR REQUIRED** and outside this specification until separately approved.

---

## 3. Goals

Phase 1 must deliver:

1. a public CesiumJS regional 3D experience that keeps the map as the primary surface;
2. approved, immutable, release-resolved terrain with honest coverage and accuracy communication;
3. one approved imagery layer when a lawful source is ready, with the neutral grid retained as an honest fallback;
4. approved released roads as mapped context only;
5. published, public-safe Places with scalable markers and clustering;
6. public Place search with deterministic minimum-useful ranking;
7. select, deep-link, fly-to, close, reset, and interruption behavior that preserves orientation;
8. clear source, licence, freshness, verification, and availability presentation;
9. equivalent core journeys across desktop, tablet, and mobile;
10. accessible non-canvas access to critical selected Place facts;
11. progressive loading, bounded detail, failure isolation, and truthful degraded modes;
12. regression evidence that current publication, rights, privacy, and provider kill-switch gates remain effective.

---

## 4. Non-goals

Phase 1 does not authorize:

- Property Registry, Parcel workflows, Listings, Property Intelligence, or Property comparison;
- AI Advisor, AI Control Center, or any AI authority over data or publication;
- Brokerage, leads, contracts, payments, or travel booking/commerce;
- ownership of BIKER mobility or TRIP itinerary concerns;
- route calculation, guaranteed reachability, travel-time prediction, current passability, motorbike suitability, legal access, or road-safety claims;
- advanced viewshed, sun/shadow, terrain-analysis, or Property-analytics suites;
- photorealistic invented buildings or landmarks;
- field verification inferred from coordinates, terrain, imagery, rendering, or visual plausibility;
- a new Place CMS, spatial database, 3D engine, standalone Vite application, or parallel Three.js scene;
- mutating published releases or replacing PostGIS authority with object storage or client scene state.

### Series 01 concept classification

| Board concept | Phase classification | Boundary |
| --- | --- | --- |
| Regional terrain and a basic terrain source/coverage summary | **PHASE 1 MINIMAL** | Display the approved release and limitations; do not add analytical tools. |
| One approved imagery layer and a neutral fallback | **PHASE 1 MINIMAL** | No imagery/time comparison. |
| Released road overlay | **PHASE 1 MINIMAL** | Mapped context only; no route analysis. |
| Published Place markers, clustering, search, select/fly-to, detail | **PHASE 1 MINIMAL** | Existing Place/public contracts remain authoritative. |
| Public layer controls and source/verification explanation | **PHASE 1 MINIMAL** | Small layer panel, not a GIS workbench. |
| Elevation profile | **DEFERRED TO PHASE 2** | Requires a defined deterministic analysis contract and accuracy limits. |
| Slope analysis/layer | **DEFERRED TO PHASE 2** | Terrain coloring in Phase 1 must not be described as slope analysis. |
| Interactive terrain inspector | **DEFERRED TO PHASE 2** | Phase 1 may show release metadata, not point analytics. |
| Route/access analysis | **DEFERRED TO PHASE 2** | Phase 1 does not compute network distance, suitability, or safety. |
| Imagery/data comparison | **DEFERRED TO PHASE 2** | Phase 1 exposes at most one approved imagery release. |
| Advanced nearby/Place comparison | **DEFERRED TO PHASE 2** | Basic search and selection are sufficient for Phase 1. |
| Property and AI panels | **DEFERRED TO PHASE 3/4** | Their appearance in the board is continuity only. |

---

## 5. User experience

The public experience is `MAP FIRST`.

### Journey A — open and orient

1. `/map` renders the application shell immediately.
2. The map reports Cesium, terrain, imagery/base, roads, and Places as separate loading states.
3. The initial camera uses the server-provided LAND AOI/configuration rather than a visual-board coordinate.
4. Available approved layers appear progressively without blocking unrelated layers.
5. The user can identify the represented coverage and return to the regional home view.

### Journey B — understand context and layers

1. The user opens a compact layer control.
2. Each layer shows availability, visibility, source/release summary, and failure state.
3. Toggling one layer does not reload the page or change another layer's authority.
4. Unavailable layers remain unavailable; no fabricated substitute is presented as real data.

### Journey C — find and inspect a Place

1. The user searches published LAND Places by name and may narrow by published category.
2. Results state no-result, loading, and error outcomes separately.
3. Selecting a result selects its marker and flies to the terrain-clamped Place position.
4. The selected Place opens in a spatially connected drawer, panel, or bottom sheet.
5. The detail shows public-safe facts, source, verification, freshness where known, and UNKNOWN where not known.
6. The URL remains shareable through the existing Place slug/deep-link behavior.

### Journey D — recover honestly

- If WebGL is unavailable, public search and textual Place detail remain usable.
- If a single layer fails, the remaining layers and textual experience remain usable.
- If the Place API fails, the map may remain usable but must not retain stale results as current without an explicit stale/error label.
- Retry is bounded and user-driven where automatic retry has been exhausted.

### Mobile equivalence

Mobile prioritizes the map viewport, search, selection, layer access, and Place details. It may reduce visual cost and marker density, but it must expose the same facts, source, verification, publication eligibility, and UNKNOWN semantics.

---

## 6. Data authority matrix

| Public object/layer | Authoritative source and PostGIS ownership | Artifact and public-safe contract | Cesium representation | Public trust/freshness/UNKNOWN behavior |
| --- | --- | --- | --- | --- |
| Terrain | Registered `sources` row; `datasets.kind='TERRAIN'`; one applicable immutable published `dataset_releases` row. The current established processing source is the registered Copernicus GLO-30-derived LAND release; the exact Phase 1 release must be selected explicitly. | Published `LAND_HEIGHTMAP_V1` manifest plus checksum-verified height tiles, resolved only through the current delivery receipt and published asset origin. Current `ViewerConfig` carries URL, release version, and manifest checksum; Phase 1 may add a public-safe layer descriptor for trust metadata. | Existing bounded Cesium `TerrainProvider`; ellipsoid only as a labeled fallback. | Manifest exposes source, licence, attribution, datum, resolution, liability, and `verificationStatus: UNKNOWN`. Missing accuracy/control evidence remains UNKNOWN. Current source rights or provider kill switch can suppress the layer. |
| Imagery | `sources` + `datasets.kind='IMAGERY'` + immutable published release when one is lawfully selected. **OPEN — DATA SOURCE REQUIRED.** | Current public contract is only `imagery: 'NEUTRAL_GRID'`; no published imagery release is integrated. Phase 1 needs the smallest extension of the existing published asset/release path and a public-safe layer descriptor. | A Cesium imagery provider created only from the approved release contract; the neutral grid is a clearly labeled fallback, not imagery. | Expose source, licence/attribution, acquisition/freshness date when known, coverage, and UNKNOWN otherwise. A reachable tile endpoint is insufficient authority. |
| Roads | Registered road source; `datasets.kind='ROADS'`; immutable published release; corresponding `road_segments` retain PostGIS geometry/source records. The established baseline is the pinned OSM snapshot release, subject to exact release selection and current rights. | Released GeoJSON resolved through the current delivery receipt. Current `ViewerConfig` exposes URL and release version; Phase 1 should expose a public-safe source/freshness descriptor without internal provider fields. | Existing ground-clamped Cesium `GeoJsonDataSource`. | Attribution/licence and source timestamp must remain visible. Segment verification defaults to UNKNOWN. Geometry does not establish safety, access, passability, or suitability. Revoked applicable rights/provider disablement suppresses output. |
| Villages/geographic labels | Prefer existing published Places with an approved village/geographic category. If a separate geographic-label dataset is required: **OPEN — DATA SOURCE REQUIRED.** | Existing `PublicPlaceDTO`/map-marker projection when modeled as Places. No external label service becomes authority by convenience. | Place marker/label with density rules; no invented building geometry. | Use Place source/location trust and freshness. Unpublished or ineligible entries do not render. Absence is empty/UNKNOWN, not proof a village does not exist. |
| Places | `places`, current `place_geometries`, source records/sources, categories, and independent verification/publication state in PostGIS. | Existing `PublicPlaceDTO`, `PublicPlaceDetailDTO`, and public list/detail endpoints. Phase 1 may add a narrower viewport marker DTO derived from the same model; it must not create a parallel Place model. | Ground-clamped marker/entity, cluster, selected label, and fly-to target. | Show content source trust and location trust separately. Published is not Verified. Expired/UNKNOWN remain explicit. Provider kill switch, source disablement/public-display revocation, archive/review state, or publication removal suppresses public output. |

All objects follow:

```text
SOURCE
→ PROVENANCE
→ POSTGIS / DATASET / RELEASE
→ PUBLIC-SAFE CONTRACT
→ CESIUM
→ PRESENTATION
```

Rendered appearance never feeds authority back into this chain.

---

## 7. Terrain contract

### Objective

Show bounded regional relief clearly enough to orient users and relate published Places/roads to terrain. The terrain is spatial context, not a survey product or terrain-analysis suite.

### Existing authority and format

- Reuse `datasets`, `dataset_releases`, `dataset_assets`, pipeline runs, source rights, published delivery receipts, and `publicLayers()`.
- Reuse the validated `LAND_HEIGHTMAP_V1` manifest and bounded terrain provider unless an approved successor contract is required.
- Do not relax existing manifest integrity, finite coverage, completeness, size, height, or checksum validation.
- Only a current `PUBLISHED` release with matching published artifact, delivery receipt, active/allowed source rights, and an enabled provider may resolve publicly.

### CRS and vertical honesty

- Public interchange remains EPSG:4326 with explicit longitude/latitude ordering.
- The current terrain client contract requires `horizontalCrs='EPSG:4326'` and output `verticalDatum='WGS84_ELLIPSOID'`.
- Source vertical datum and normalization CRS remain explicit.
- Ellipsoidal height is not altitude above ground; DSM is not bare earth; resampling does not create source detail.
- Any new datum/format strategy that changes the frozen terrain contract is **ADR REQUIRED** and is not authorized by this specification.

### LOD and coverage

- Load the regional overview first and request finer tiles only as camera distance requires.
- The release manifest defines finite coverage and maximum level; no terrain is invented outside it.
- High-detail hotspots require an approved source/release and belong only where justified.
- Mobile may lower resolution scale or effective visual detail without changing facts.

### Artifact/publication path

```text
approved source
→ reproducible pipeline
→ QA
→ approved release
→ immutable published manifest/tiles
→ delivery receipt
→ explicit publication
→ publicLayers()
→ Cesium terrain provider
```

### Failure/degraded behavior

- Missing/revoked release: use ellipsoid/neutral fallback and state that real terrain is unavailable.
- Manifest/tile HTTP or checksum failure: mark terrain failed/degraded, isolate the failure, and state that the affected view must not be used to assess terrain.
- Partial coverage: expose coverage and do not fill it with fabricated height.
- Cesium or WebGL failure: preserve public textual Place access.

### Accuracy boundary

Terrain readability, a plausible ridge silhouette, tile continuity, a stable camera, or matching checksums do not prove field accuracy. Accuracy claims require declared datum, method, uncertainty, and suitable control evidence. Otherwise the public status is UNKNOWN.

---

## 8. Imagery contract

Phase 1 includes at most one approved imagery layer. Side-by-side, temporal, or analytical imagery comparison is deferred to Phase 2.

Current state:

```text
NEUTRAL_GRID
not aerial/satellite imagery
```

Production imagery is **OPEN — DATA SOURCE REQUIRED**.

Before public imagery is enabled, the source must have:

- a registered identity and provenance;
- an explicit source/acquisition version and coverage;
- confirmed public-display, redistribution, derivative, and caching rights as applicable;
- a non-null licence reference and required attribution;
- freshness/acquisition date when known;
- a reproducible processing path;
- QA, immutable Dataset/Release registration, public artifact delivery, and publication;
- a Cesium-compatible public-safe contract.

Technical reachability, a public URL, or a browser-compatible tile service does not grant rights. If no source satisfies the gate, the neutral grid remains and is labeled as a visual reference grid, not imagery.

Extending the existing publication code to support `IMAGERY` artifacts is a Phase 1 implementation gap, not authorization for a second provider architecture or direct third-party endpoint chosen by browser input.

---

## 9. Roads contract

Roads communicate mapped spatial context and relationships to terrain and Places.

The minimum contract is the existing published road Dataset/Release path and ground-clamped GeoJSON representation. Each release retains source snapshot/version, licence/attribution, timestamp/freshness where known, checksum, bounding coverage, pipeline version, and UNKNOWN verification unless separately proven.

Mandatory distinctions:

```text
road geometry != road safety
road geometry != legal access
road geometry != current passability
road geometry != motorbike suitability
road geometry != a route or travel-time model
```

Phase 1 must not infer those facts from road class, visual width/color, terrain, proximity, or external routing services. Any displayed access/context statement must come through an existing public-safe Place trust contract or a separately approved authoritative contract.

Source rights, current source status, release status, delivery receipt, and provider kill switch remain live public projection gates. A revoked road layer disappears or becomes unavailable; stale cached URLs do not authorize continued presentation.

---

## 10. Place contract

Phase 1 reuses the existing Place domain and public projection. It does not create a map-specific CMS entity.

Only a Place satisfying the current public eligibility gate may appear:

- `publication_status='PUBLISHED'`;
- `review_required=false`;
- content and current geometry source records are not archived;
- content and geometry sources are active, not archived, and allow public display;
- provider, when present, is enabled and not kill-switched;
- current geometry and at least one active category exist.

### Marker and cluster

- Marker position comes only from the public-safe current geometry.
- Marker category/color is presentation metadata, not verification.
- Marker height clamps to ground and must not imply a measured elevation.
- Selected state is visually and programmatically distinct.
- Clustering is enabled at densities where individual markers would be unreadable.
- Cluster count is a count of loaded eligible public markers, not a total registry claim unless the API provides that total.

### Selected detail

The panel/drawer/bottom sheet uses `PublicPlaceDetailDTO` and displays:

- name, public categories, description, and public media;
- content source trust;
- location role, verification, horizontal accuracy when known, and location source trust;
- freshness/observed/verified/expiry dates where known;
- public-safe visit/access/safety sections with their independent trust;
- UNKNOWN instead of empty certainty.

`Published != Verified`. Content trust and location trust remain separate.

---

## 11. Search contract

Search operates only over eligible public-safe LAND Places. It must not silently query or rank from an external geocoder, tourism catalog, Property dataset, BIKER/TRIP database, or AI output.

Minimum useful scope:

- Vietnamese diacritic-insensitive Place-name search using the existing bounded input;
- optional published category filter;
- stable pagination or bounded viewport results;
- deterministic ranking: exact normalized name, then name prefix, then substring, with normalized name and immutable ID as stable tie-breakers;
- no hidden paid placement or verification-based ranking unless separately specified;
- a result includes only the existing public summary fields needed to identify and select a Place.

States:

- empty query: show the bounded public default set for the current map/AOI;
- no result: state that no matching public Place is available, not that the Place does not exist;
- invalid/overlong input: safe validation response;
- API error: retain map usability, expose retry, and do not relabel stale results as current;
- selection from a paginated/search result: fetch detail by public slug and preserve a shareable URL.

---

## 12. Camera and select/fly-to

Camera behavior is deterministic product behavior; it does not change spatial truth.

### Regional entry/home

- Use the configured active LAND AOI and `ViewerConfig.initialView`.
- Retain configured minimum/maximum camera heights and AOI guardrails.
- The view should show useful terrain context with limited empty sky and without suggesting an administrative/legal boundary.
- Home/reset returns to this framing; overhead view remains a separate explicit action if retained.

### Place selection

- A search/list/marker selection updates one canonical selected Place state and shareable slug.
- Fly to the terrain-clamped entity/bounding sphere, not a zero-height underground target.
- Range/altitude remains inside `ViewerConfig` bounds. The current 3,500 m range is an implementation baseline to validate visually, not a universal accuracy value.
- Desktop framing reserves room for the detail panel; mobile framing reserves room for the bottom sheet.
- The selected marker remains identifiable after flight.

### Interruption and motion

- Selecting another Place cancels/supersedes the prior transition; the latest selection wins.
- Direct camera input cancels cinematic continuation and leaves the current selection intact unless the user closes it.
- Closing selection does not unexpectedly reset the camera.
- Repeated home/fly actions are idempotent and do not navigate the document.
- With reduced motion, use immediate or minimal-duration camera placement while preserving final framing and focus.
- Camera completion and terrain/data settled state remain distinct observables.

---

## 13. Layer model

Phase 1 has four public layer groups. Villages/geographic labels are Places unless a later approved source requires a separate layer.

| Layer | Availability | Default visibility | Loading and source information | Failure isolation |
| --- | --- | --- | --- | --- |
| Terrain | Available only with an eligible published release; otherwise labeled unavailable/degraded | On when available | Show release version, source/attribution, datum, resolution, coverage, verification/accuracy limitation | Fall back to ellipsoid/neutral surface; do not disable search or Places |
| Imagery/base | Approved imagery when eligible; otherwise neutral grid | Approved imagery on when available; neutral grid on as fallback | Distinguish imagery from neutral grid; show source, licence, acquisition/freshness, coverage | Imagery failure returns to labeled neutral grid without fabricating imagery |
| Roads | Available only with eligible published road release | On when available | Show release, attribution/licence, source timestamp/freshness, UNKNOWN verification/safety boundary | Hide/mark roads unavailable; terrain and Places remain usable |
| Places | Available from the public-safe Place projection | On | Separate list/marker loading; expose content/location trust in selection | Place API failure does not invalidate terrain/roads; textual error and retry remain |

Controls use progressive disclosure: visibility toggle, availability, and a compact source link/summary. Phase 1 does not include a giant GIS control panel, arbitrary URL input, opacity laboratory, styling editor, or release administration in the public client.

---

## 14. Public-safe API / DTO boundary

Current contracts to preserve:

- `ViewerConfig` for AOI, camera bounds, terrain URL/release/checksum, road URL/release, and neutral base state;
- `PublicPlaceDTO`, `PublicPlaceDetailDTO`, `PublicTrust`, `PublicCategory`, and bounded `PublicListQuery`;
- server-owned `publicLayers()`, `publicPlaces()`, and `publicPlace()` projections.

Genuine Phase 1 gaps:

1. a typed public-safe layer descriptor for terrain, imagery, and roads covering only availability, release version, public URL/checksum where needed by the client, source name/authority, licence/attribution, coverage, freshness timestamps/classification, and verification/accuracy limitations;
2. imagery resolution through the existing Dataset/Release/delivery path;
3. a bounded map-marker projection or viewport query if the existing paginated Place list cannot supply complete marker coverage without eagerly loading detail;
4. explicit per-layer loading/degraded state in viewer diagnostics.

Any new marker DTO is a narrower projection of Place, not a parallel model. Spatial filtering and authoritative containment/distance remain server/PostGIS owned. Client-side filtering is presentation-only.

Never expose:

- private evidence, raw workbook rows, raw/private artifacts, internal notes, actor/audit identities, or private source records;
- database credentials, private R2 credentials, published operator credentials, signed private URLs, provider master credentials, or bootstrap values;
- internal provider endpoints, bucket names, storage keys not already encoded in approved public URLs, health internals, or operator information;
- unpublished/rejected releases or unapproved source rights;
- arbitrary registry URLs or user-chosen provider endpoints.

DTO schemas remain strict/stripping, and public privacy/source/provider kill-switch regression tests remain mandatory.

---

## 15. Responsive experience

Series 08 is supporting authority. Responsive behavior transforms layout, not semantic truth.

### Desktop

- Large map-first viewport with a bounded side drawer/panel.
- Search/results and selected detail share one secondary surface.
- Compact layer controls overlay the map without obscuring the region.

### Tablet

- Map remains primary; panel may overlay or occupy a narrower side region.
- Landscape and portrait layouts avoid unusable map/panel competition.
- Selection keeps marker and critical Place facts visible together where practical.

### Mobile

- Map occupies the primary viewport.
- Search opens as a focused sheet/overlay with a clear close action.
- Selection uses a bottom sheet with collapsed, partial, and expanded states.
- Layer access is a compact, labeled sheet or popover.
- Touch targets meet the repository/design-system accessibility baseline.
- Map gestures and sheet scrolling do not trap or conflict with each other.
- A lower-cost render profile may reduce resolution/detail/marker density, but not facts or status meaning.

The textual Place page/deep link remains a useful non-canvas and shareable path.

---

## 16. Accessibility

- Search, results, layer toggles, reset/home, close, retry, and selected Place actions are keyboard reachable and visibly focused.
- Selection updates focus deliberately: initiating result remains recoverable, and the selected detail heading is announced without trapping focus.
- Escape closes transient overlays/sheets where consistent with existing UI behavior.
- Controls and status messages have programmatic labels; loading uses status semantics and failures use appropriate alerts without repeated announcement noise.
- Verification, source authority, freshness, publication eligibility, availability, and errors are not communicated by color alone.
- Contrast follows Series 00 and current code tokens.
- Reduced-motion preference removes or minimizes fly animations while preserving final state.
- Critical selected Place facts and trust data are available as semantic HTML outside the canvas.
- Marker clustering and canvas visuals have a corresponding searchable textual route.
- The 3D canvas alone is never claimed to be accessible.

---

## 17. Performance / LOD budget

Architecture requirements:

- lazy-load Cesium and spatial assets after the shell can render;
- render regional context first, then progressively request finer terrain/imagery detail;
- keep terrain/imagery/roads/Places independently loadable and independently degradable;
- use finite AOI/coverage and release-defined LOD; do not load a monolithic high-detail region;
- cluster markers and load public marker summaries separately from Place details;
- fetch selected Place detail on demand;
- avoid recreating the Cesium viewer or navigating the document for layer/camera state changes;
- retain request cancellation and bounded retry/size/checksum behavior;
- use a lower-cost mobile profile based on measured device/browser behavior;
- park unnecessary animation and respect reduced motion.

Exact Phase 1 thresholds are **MEASURE DURING IMPLEMENTATION** because imagery and production release payloads are not selected yet.

Measure and record at each material slice:

- shell-to-Cesium initialization;
- first rendered frame and first stable usable regional frame;
- cold/warm transfer bytes by layer;
- terrain/imagery/roads failures and time-to-ready;
- marker-layer build time at representative sparse/dense counts;
- select-to-camera-complete and camera-complete-to-stable;
- long-task, memory/context-loss, and interaction behavior;
- desktop and constrained mobile viewport/network/CPU profiles.

Thresholds must be proposed from the baseline and approved in the slice acceptance record before final Phase 1 acceptance. A visual effect or detail level that misses the approved budget is reduced or deferred; trust/security checks are not removed.

---

## 18. Loading, error, and degraded modes

| Condition | Required behavior |
| --- | --- |
| Application shell loading | Show bounded skeleton/status; do not claim map ready. |
| Cesium initializing | Keep search/text shell available where possible; distinguish initialization from layer loading. |
| Terrain unavailable/corrupt/revoked | Use labeled ellipsoid/neutral fallback; state real terrain unavailable and prevent terrain assessment claims. |
| Imagery unavailable/unlicensed/revoked | Use labeled neutral grid; do not silently substitute third-party imagery. |
| Roads unavailable/revoked | Hide/disable roads with source-aware error; other layers continue. |
| Place API unavailable | Preserve terrain/roads, show result/detail error and retry; do not expose cached results as current silently. |
| Partial layer failure | Mark only the affected layer degraded/failed and keep independent controls usable. |
| WebGL unavailable/context lost | Show useful fallback with search and semantic Place details; offer bounded reload where appropriate. |
| Slow network | Expose progressive per-layer states and cancellation; do not freeze the whole UI behind one spinner. |
| Empty eligible Place dataset | State that no public Places are currently available; do not insert sample data. |
| Coverage gap | State unavailable/UNKNOWN outside coverage; never synthesize terrain, roads, labels, or Places. |

Previously rendered data must not be presented as currently authorized after the application learns that its source/release has been suppressed. Browser/CDN caching limitations must remain documented; the provider/operator revocation path is separate from public projection logic.

---

## 19. Security / trust

Phase 0.5 boundaries remain unchanged.

The public client receives no:

- database owner/runtime credential;
- private object-store credential;
- published release operator credential;
- signed private upload/download URL;
- provider/account master credential;
- bootstrap/authentication secret;
- raw workbook, private evidence, internal note, private provider metadata, or operator identity.

All public data comes from strict public-safe projections. URLs are server-resolved from approved configuration/release receipts; untrusted inputs cannot select providers or arbitrary network endpoints.

Current rights and availability are evaluated at publication and public projection. Delivery receipts do not override revoked source rights. Provider kill switches remain effective. Published is not Verified, and a public URL is not publication authority.

Client errors, status UI, logging, screenshots, and diagnostics must suppress secret values and private response bodies.

---

## 20. Observability

Reuse the existing correlation-ID and structured server logging boundaries. Add only the minimum useful Phase 1 signals:

- Cesium initialization failure/category and WebGL availability;
- terrain, imagery, roads, and Places load state/failure category;
- public API status and correlation ID;
- release resolution unavailable/suppressed outcome without source/provider secrets;
- first frame, first stable frame, layer readiness, and marker build timing during controlled QA;
- WebGL context loss and recovery outcome.

Do not log raw search text, selected precise coordinates, private DTO fields, full external URLs with query strings, cookies, authorization headers, or user-identifying navigation histories by default.

Operational dashboards use aggregate health/error/timing categories and bounded retention. This phase does not introduce surveillance-style analytics, ad-tech, cross-product tracking, or session replay.

---

## 21. Implementation slices

The slices extend existing code. They are not authorization to implement before owner approval.

| Slice | User-visible outcome | Likely files/components | Backend/domain impact | Required tests and acceptance gate | Explicit exclusions |
| --- | --- | --- | --- | --- | --- |
| **1A — shell, camera, and degraded-state baseline** | Reliable map-first shell, regional home view, explicit per-stage loading, WebGL fallback, deterministic reset and reduced-motion behavior | `apps/web/app/map/page.tsx`; `public-explorer.tsx`; `spatial-viewer/index.tsx`, `viewer-engine.tsx`, `types.ts`; `globals.css`; `packages/config/src/viewer.ts` | No schema/domain change; preserve `ViewerConfig` authority | Viewer unit/contract tests; Playwright initial view/reset/interruption/reduced-motion/WebGL fallback; desktop/mobile observed frames; no page navigation/recreated viewer | No real imagery, analytics, new engine, or scene framework |
| **1B — published terrain** | Eligible regional terrain loads from immutable public delivery with visible source/datum/coverage/UNKNOWN limitations | `services/api/src/layers.ts`, `published-assets.ts`; spatial viewer terrain files; `packages/spatial-types/src/terrain.ts`, `viewer.ts`; existing pipeline/publication scripts only if a successor release needs compatible metadata | Reuse Dataset/Release/source/delivery authority; no migration expected unless an unavoidable gap is separately reviewed | Manifest/tile/size/checksum/coverage tests; source-rights/kill-switch/release suppression; corrupt/missing/partial terrain browser tests; provider anonymous delivery and desktop/mobile visual acceptance | No terrain format/engine redesign, field-accuracy claim, slope/elevation inspector |
| **1C — imagery and roads** | One approved imagery layer when data-ready, neutral fallback otherwise, and released roads with source context | `services/api/src/layers.ts`, `published-assets.ts`; `pipelines/publish-object-release.ts`; storage descriptors if needed; `viewer.ts`; `viewer-engine.tsx`; bounded new imagery adapter/pipeline files | Extend existing `IMAGERY` Dataset/Release/artifact path; roads reuse current model; no external search/routing authority | Publication/delivery/source-rights/checksum tests for imagery and roads; wrong/revoked release tests; independent layer-failure Playwright; attribution/licence inspection | No comparison slider, routing, passability/safety inference, arbitrary tile URL, second provider architecture |
| **1D — published Places and scalable markers** | Eligible Places appear as markers/clusters without eagerly loading full detail | `packages/contracts/src/index.ts`; `services/api/src/public-places.ts`; public Place route(s); `public-explorer.tsx`; `viewer-engine.tsx` | Optional narrow viewport marker projection from existing Place/PostGIS model; no parallel entity or schema unless proven necessary | PostGIS public eligibility/bbox/pagination tests; DTO privacy tests; cluster sparse/dense browser tests; source/provider suppression; empty dataset | No synthetic production Places, Place CMS rewrite, Property/Parcel model |
| **1E — search, select, fly-to, and Place detail** | Ranked public search, stable selection/deep link, interruptible/reduced-motion fly-to, accessible public detail | `public-explorer.tsx`; `place-detail.tsx`; public Place routes; `services/api/src/public-places.ts`; contracts; viewer engine | Improve bounded search ordering/projection only; PostGIS remains search authority | Search ranking/escaping/no-result/error tests; public DTO/trust tests; Playwright search→select→fly→deep-link→close and competing selections; keyboard/focus checks | No external geocoder, AI ranking, nearby/compare engine, route computation |
| **1F — layers, source, freshness, and verification presentation** | Compact layer panel and Place detail make availability/source/release/freshness/verification distinctions visible | `ViewerConfig`/new public layer descriptor; `services/api/src/layers.ts`; `viewer-engine.tsx`; `public-explorer.tsx`; `place-detail.tsx`; styles | Public-safe projection additions only; current rights gates stay live | Schema stripping/privacy tests; Published/Verified and UNKNOWN presentation tests; rights revocation/kill-switch suppression; layer-toggle/source UI Playwright | No admin release controls, private provider diagnostics, generic status badge collapse |
| **1G — responsive, accessibility, and performance hardening** | Equivalent core journeys on desktop/tablet/mobile with measured progressive loading and usable non-canvas fallback | Existing public components/styles and focused helpers only | No domain/schema change | Keyboard/focus/labels/contrast/reduced-motion checks; desktop/tablet/mobile Playwright; constrained profiles; approved measured budgets; actual browser visual review | No redesign of Admin, physical-device claims without observation, cosmetic scope expansion |
| **1H — final browser/provider acceptance** | Reviewed Phase 1 release behaves through the deployed LAND stack and fails safely | Tests, acceptance/status/operations docs; configuration only through existing secure provider process | No new authority; exact release IDs and evidence recorded without secrets | `pnpm check`; `pnpm test:e2e:core`; affected release/provider tests; anonymous public bytes/checksums; rights/kill-switch suppression; deployed desktop/mobile/WebGL/degraded journeys; secret scan | No merge if data/licence/accuracy claims exceed evidence; no Phase 2/3/4 features |

If an implementation slice reveals a frozen-contract change, stop and label it **ADR REQUIRED** rather than expanding that slice silently.

---

## 22. Test strategy

### Unit tests

- strict schemas for layer metadata, marker summaries, loading states, and terrain/imagery manifests;
- camera target/range/reduced-motion decisions as pure logic where extracted;
- search normalization/ranking and safe error mapping;
- public status/UNKNOWN presentation helpers.

### Contract tests

- strict public DTO parse/strip behavior;
- public layer URLs/checksums/source metadata derived only from eligible releases/configuration;
- no arbitrary provider endpoint or unpublished release resolution;
- Dataset/Release and Published/Verified distinctions.

### PostGIS integration tests

- published/current Place eligibility and viewport/search ordering;
- source/content/geometry/provider revocation suppression;
- one applicable published release per dataset and immutable published metadata/assets;
- terrain/imagery/roads current rights, delivery receipt, retirement, and kill-switch behavior;
- spatial bounds use PostGIS/4326 and parameterized queries.

### Public DTO/privacy tests

Assert absence of private evidence, raw rows/payloads, internal notes, actor/operator identities, storage/provider secrets, bucket/internal endpoints, unpublished releases, and database fields outside the public schemas.

### Cesium/browser tests

- initialization, regional framing, layer toggles, independent loading/failure, and home/reset;
- released terrain/imagery/roads render with expected attribution and no failed asset requests;
- markers/clusters, selected state, camera completion, and settled state;
- corrupt/missing/checksum-failed assets fail closed;
- no relevant page/console errors.

### Playwright journeys

- open map → orient → toggle layer;
- search → no result / ranked result → select → fly-to → detail → share/deep link;
- competing selection and user-interrupted camera transition;
- keyboard and reduced-motion variants;
- WebGL unavailable/context failure and each independent layer failure;
- empty Place dataset;
- desktop, tablet landscape/portrait where relevant, and mobile portrait.

### Release/publication regressions

- delivery is not publication;
- Import Commit is not Publish;
- current source-rights revocation suppresses public output after delivery/publication;
- provider kill switch suppresses output;
- published bytes/metadata remain immutable and retirement selects no stale public layer.

Every substantial implementation checkpoint retains:

```text
pnpm check
pnpm test:e2e:core
```

Run affected release/provider and browser suites in addition. Do not claim a browser, provider, physical-device, or accuracy PASS unless that environment was actually observed.

---

## 23. Provider / data prerequisites

Keep four readiness states separate.

### CODE READY

The approved implementation, tests, public contracts, fallback paths, and build are complete. This can be proven with fixtures and the neutral grid without claiming production data readiness.

### DATA READY

For every enabled layer, the exact source, rights, provenance, CRS/datum, coverage, freshness, QA, Dataset, immutable Release, artifact checksums, and limitations are registered and approved.

Current gaps:

- imagery: **OPEN — DATA SOURCE REQUIRED**;
- villages/geographic labels beyond eligible Places: **OPEN — DATA SOURCE REQUIRED**;
- exact Phase 1 terrain and road release selection: **OPEN — OWNER/DATA DECISION**;
- field/local absolute terrain accuracy: **UNKNOWN** until suitable control evidence exists.

### PROVIDER READY

The exact published objects are delivered through the configured public origin, anonymously readable as intended, integrity checked, cache/CORS behavior verified where applicable, and loadable by the deployed Cesium client. Phase 0.5 diagnostic transport PASS does not prove these Phase 1 release objects.

### ACCURACY VERIFIED

Accuracy is supported by explicit source specifications and, where a public local-accuracy claim is desired, suitable control/field evidence with declared datum, method, uncertainty, timestamp, and authorized review. A rendered match, checksum, or source reputation alone is insufficient.

Technical availability never substitutes for licence/publication approval.

---

## 24. Acceptance criteria

Phase 1 may be accepted only when all applicable items are evidenced:

- [ ] `/map` provides a regional public Cesium 3D experience with map-first hierarchy.
- [ ] The shell, Cesium, terrain, imagery/base, roads, and Places expose distinct loading/readiness states.
- [ ] The initial and home camera use approved LAND AOI/configuration and preserve orientation.
- [ ] Approved terrain resolves through current PostGIS Dataset/Release/delivery authority.
- [ ] Terrain manifest/tiles pass exact byte/checksum/coverage validation and failures close honestly.
- [ ] Terrain source, release, horizontal/vertical reference, resolution/coverage, and accuracy limitation are visible.
- [ ] Imagery is enabled only from an approved, licensed, immutable release; otherwise the neutral grid is explicitly labeled.
- [ ] Roads resolve from an eligible release, show attribution/source freshness, and make no safety/access/passability/suitability claim.
- [ ] Current source-rights revocation, release retirement, or provider kill switch suppresses terrain/imagery/road public output.
- [ ] Only current eligible public-safe Places appear; draft, review-required, archived, source-revoked, and provider-disabled Places do not.
- [ ] Place markers remain readable through clustering at representative densities.
- [ ] Search uses only public-safe LAND data, deterministic ranking, bounded input/results, and honest empty/no-result/error states.
- [ ] Search/list/marker selection converges on one selected Place and a shareable slug.
- [ ] Fly-to is terrain-aware, bounded, interruptible, stable, responsive, and reduced-motion compatible.
- [ ] Selected Place details expose content source and location verification/freshness separately, preserving UNKNOWN.
- [ ] Layer controls show availability/source and isolate failures without becoming a GIS administration panel.
- [ ] WebGL failure preserves useful semantic search/Place access.
- [ ] Desktop, tablet, and mobile core flows work with equivalent facts and touch/keyboard-appropriate controls.
- [ ] Critical Place facts are available outside the canvas; focus, labels, contrast, status, and reduced motion meet the acceptance baseline.
- [ ] Progressive loading/LOD and representative desktop/mobile measurements meet thresholds approved during implementation.
- [ ] Public DTOs/client bundles/logs contain no secrets, private evidence, raw workbook rows, operator data, or unpublished releases.
- [ ] Published release metadata/assets remain immutable; delivery remains distinct from publication.
- [ ] Provider/browser observations are recorded separately from code/test results and accuracy evidence.
- [ ] No Property, Parcel, Listing, AI, Brokerage, routing, terrain-analysis, viewshed, sun/shadow, or other Phase 2/3/4 scope has leaked in.
- [ ] `pnpm check`, `pnpm test:e2e:core`, affected tests, secret scan, and final architecture/security review PASS on the delivered head.

---

## 25. Rollback

Phase 1 must fail safely without rewriting published spatial truth.

- Revert the public application deployment to the last compatible build through the normal deployment workflow.
- Disable an unhealthy integration provider or use its kill switch; public projection then suppresses affected layers.
- Revoke applicable source public rights/status when legally or operationally required; do not rely only on UI hiding.
- Retire a bad release and select/publish a reviewed successor or prior immutable release through current PostGIS/operator authority.
- Never overwrite or delete published release bytes as routine rollback. Provider-level legal/security revocation is a separate explicit operator action.
- Preserve the neutral grid, ellipsoid/degraded state, public textual Place page, and independent layer failures so the whole product need not fabricate or fail together.
- Do not roll back database migrations destructively. Prefer compatible application rollback, forward repair, or validated restore procedures.
- Record rollback reason, affected release/provider, observed behavior, and remaining UNKNOWN without secrets.

---

## 26. Open questions

These questions require owner/data/provider decisions; current repository contracts do not answer them.

### Q1 — What exact geographic coverage is the Phase 1 public promise?

- **Why it matters:** The current operational AOI and representative terrain coverage are not official administrative boundaries and may not equal the intended public region.
- **Recommended default:** Launch with the current bounded operational coverage that has eligible releases, label it as coverage rather than a legal boundary, and expand only through successor releases.
- **Consequence of deferring:** Code and QA can proceed against fixtures/current coverage, but public launch copy and completeness acceptance remain OPEN.

### Q2 — Which imagery source and licence will Phase 1 use?

- **Why it matters:** The repository currently has only a neutral grid; imagery rights, freshness, coverage, format, and cost are unresolved.
- **Recommended default:** Keep the neutral grid until one source passes registration, rights review, reproducible processing, Dataset/Release, and public delivery gates. Do not bind to a vendor in the client.
- **Consequence of deferring:** Phase 1 can deliver terrain/roads/Places, but the imagery layer remains unavailable and must not be claimed complete.

### Q3 — Which exact terrain and road releases are approved for Phase 1 public use?

- **Why it matters:** The established Copernicus-derived terrain and pinned OSM road releases prove the current pipeline, but their exact deployed release IDs, coverage fitness, current rights, and desired accuracy claims require explicit selection.
- **Recommended default:** Reuse the existing eligible immutable releases for the bounded first launch, retain UNKNOWN local/field accuracy, and create successor releases only when source/coverage evidence changes.
- **Consequence of deferring:** Code integration can be tested, but DATA READY and provider/browser acceptance remain OPEN.

### Q4 — Are villages/geographic labels modeled only as published Places in Phase 1?

- **Why it matters:** No separate authoritative geographic-label source/contract is established, while adding an external labels service would create an unapproved authority path.
- **Recommended default:** Represent only eligible village/geographic entries as existing Places/categories. Add a separate dataset only after a source and real product need are approved.
- **Consequence of deferring:** No separate village label layer is shipped; the map remains honest but may have sparse regional labels.

---

## 27. Owner approval gate

Approval must confirm that this scope, its open-question decisions/defaults, and its evidence boundaries are acceptable. Approval of the specification does not approve specific datasets, licences, accuracy claims, or provider mutations that still have separate gates.

```text
PHASE 1 IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

Implementation starts only after explicit owner approval of this specification.
