# TÀ XÙA LAND — PHASE 0: SPATIAL FOUNDATION

Version: 1.0
Status: Implementation handoff for Codex
Repository: `https://github.com/vtmedia0910/TaXuaLand`
Product domain: TÀ XÙA LAND
Phase objective: establish an independent spatial platform foundation before any property marketplace, brokerage, or public AI chatbot work.

---

## 0. Executive intent

Phase 0 must create the technical and operational foundation that every later capability depends on.

At the end of Phase 0, TÀ XÙA LAND must already be a real spatial product, not a static architecture demo. An administrator must be able to create and manage local places, import place data in bulk from Excel, validate coordinates, review data on a real 3D terrain context, and publish approved places to a public Cesium-based viewer.

The phase must prove that TÀ XÙA LAND can reliably transform human-entered or imported local data into authoritative, traceable spatial objects.

The phase must NOT introduce property listings, brokerage workflows, public AI advisory, property valuation, legal assertions, or arbitrary AI/database access.

Core principle:

> Spatial truth first. Property and AI layers must consume trusted spatial services later.

---

# 1. Product outcomes after Phase 0

After Phase 0, the system must provide the following working capabilities.

## 1.1 Public product outcome

A public TÀ XÙA LAND web application exists with:

- a stable CesiumJS 3D viewer;
- terrain rendered for at least one representative Tà Xùa area of interest;
- one approved imagery source or imagery placeholder strategy;
- road and place layers;
- point-of-interest rendering;
- layer toggles without full application reload;
- search by place name;
- fly-to-place interaction;
- camera reset and predefined viewpoints;
- selection of a place on the globe;
- a public place details panel;
- public verification/source/freshness indicators where applicable;
- graceful handling when 3D/WebGL is unavailable;
- responsive behavior for desktop and mobile.

Phase 0 does not require full-production terrain coverage for the whole region. It requires the architecture and pipeline to be production-shaped and validated using a representative Tà Xùa dataset.

## 1.2 Admin product outcome

An authenticated Admin application exists with:

- place CRUD;
- category management;
- coordinate entry;
- map-based location picker;
- map-based spatial review;
- image URL and media metadata management;
- external link management, including Google Maps URLs;
- draft/published/archived publication states;
- verification state management;
- source/provenance metadata;
- freshness metadata;
- spatial validation warnings;
- read-only source/provider diagnostics;
- Excel bulk-import workflow;
- import staging and preview;
- validation errors before commit;
- duplicate detection;
- import audit trail;
- publishing only after explicit admin review.

## 1.3 Spatial data outcome

The platform has a proper spatial core containing:

- PostgreSQL + PostGIS;
- canonical place geometry;
- spatial indexes;
- CRS policy;
- dataset/source registry;
- source authority and license metadata;
- dataset release/version metadata;
- raw/normalized/derived/published asset zones;
- immutable release conventions;
- public-safe DTOs;
- clear separation between imported claims and LAND-verified facts.

## 1.4 Operational outcome

The project has:

- a standalone repository;
- reproducible local development;
- CI checks;
- environment configuration policy;
- no client-exposed secrets;
- structured logging;
- basic metrics and diagnostics;
- architecture decision records;
- implementation docs suitable for later Codex sessions.

---

# 2. Non-negotiable product boundaries

Codex must preserve all of the following.

## 2.1 Repository and database isolation

TÀ XÙA LAND is an independent product and repository.

Do not:

- merge LAND database with TÀ XÙA BIKER;
- merge LAND database with TÀ XÙA TRIP;
- reuse BIKER/TRIP service-role credentials;
- create cross-product direct database access;
- import secrets from legacy files;
- create hidden coupling to BIKER/TRIP runtime code.

If legacy local data is migrated from BIKER, treat it as source data and import it through explicit migration/import logic.

## 2.2 No property marketplace in Phase 0

Do not create:

- `properties` marketplace UI;
- listing publication;
- property search;
- seller account workflows;
- buyer lead workflows;
- agent workflows;
- payment;
- brokerage CRM;
- offer workflows;
- property valuation;
- comparables;
- public property advisor.

Avoid premature property schema except lightweight architecture notes documenting future extension points.

## 2.3 No public AI chatbot in Phase 0

Do not expose a customer chatbot.

Phase 0 may define future AI governance interfaces and configuration schemas only if they do not materially expand scope.

No model receives direct database access.

No generic AI tools such as:

- SQL execution;
- arbitrary RPC;
- arbitrary HTTP;
- generic browser access;
- filesystem write access in customer runtime;
- data mutation tools.

## 2.4 Unknown remains unknown

Never infer missing coordinates, road facts, legal facts, verification states, or source authority automatically.

The system may flag probable inconsistencies, but it must not silently repair them into verified facts.

---

# 3. Technology stack

Use this stack unless an implementation blocker is documented in an ADR.

## 3.1 Monorepo and package management

Recommended:

- pnpm workspaces;
- Turborepo optional but recommended if it materially improves build organization;
- Node.js current supported LTS;
- TypeScript strict mode.

Suggested top-level workspace:

```text
TaXuaLand/
├─ apps/
│  ├─ web/
│  └─ admin/
├─ services/
│  ├─ api/
│  ├─ ingestion-worker/
│  └─ spatial-worker/
├─ packages/
│  ├─ domain/
│  ├─ spatial-types/
│  ├─ contracts/
│  ├─ verification/
│  ├─ provenance/
│  ├─ integrations/
│  ├─ observability/
│  ├─ config/
│  └─ ui/
├─ pipelines/
│  ├─ dem/
│  ├─ imagery/
│  ├─ vectors/
│  └─ places/
├─ infra/
├─ docs/
│  ├─ architecture/
│  ├─ adr/
│  ├─ security/
│  ├─ data-sources/
│  ├─ verification/
│  └─ operations/
└─ tests/
```

## 3.2 Frontend

Public web:

- Next.js;
- React;
- TypeScript strict;
- CesiumJS;
- Tailwind CSS;
- TanStack Query;
- Zod;
- accessible UI primitives.

Admin:

- Next.js or a dedicated route/app within the monorepo;
- React;
- TypeScript strict;
- shared UI package;
- Cesium map review component where useful.

## 3.3 Database

Use:

- PostgreSQL;
- PostGIS extension.

PostGIS is mandatory because spatial features must support:

- point geometry;
- line geometry later;
- polygon geometry later;
- proximity;
- intersection;
- AOI validation;
- nearest-road queries later;
- spatial indexing.

## 3.4 GIS processing

Prepare a Python spatial processing environment using:

- Python;
- GDAL;
- PROJ;
- Rasterio;
- GeoPandas;
- Shapely;
- Pyogrio where useful.

PDAL is not required until LiDAR work exists.

## 3.5 Testing

Use:

- Vitest for unit tests;
- Playwright for end-to-end tests;
- API integration tests;
- schema validation tests;
- import fixture tests;
- browser screenshot regression for critical viewer states where practical.

## 3.6 Infrastructure

Phase 0 should remain operationally simple.

Recommended pattern:

- Vercel or equivalent for web/admin;
- managed PostgreSQL/PostGIS;
- S3-compatible object storage;
- CDN for published spatial assets;
- Docker for workers and local reproducibility.

Do not introduce Kubernetes in Phase 0.

---

# 4. Repository bootstrap requirements

Codex must create a clean repository foundation before feature work.

## 4.1 Required root files

Create:

```text
README.md
CONTRIBUTING.md
SECURITY.md
ARCHITECTURE.md
CODEOWNERS or equivalent ownership docs when practical
.env.example
.gitignore
.editorconfig
package.json
pnpm-workspace.yaml
tsconfig.base.json
```

## 4.2 Required docs

Create at minimum:

```text
docs/adr/ADR-001-product-boundary.md
docs/adr/ADR-002-cesium-primary-3d-engine.md
docs/adr/ADR-003-crs-and-coordinate-policy.md
docs/adr/ADR-004-spatial-storage-and-versioning.md
docs/adr/ADR-005-public-safe-api-boundary.md
docs/adr/ADR-006-verification-semantics.md
docs/adr/ADR-007-admin-import-staging.md
docs/adr/ADR-008-no-ai-direct-db-access.md
```

Each ADR must state:

- context;
- decision;
- alternatives considered;
- consequences;
- future review conditions.

---

# 5. Spatial coordinate and CRS policy

This policy must be implemented and documented before significant spatial feature development.

## 5.1 API and public coordinate representation

Canonical public/interchange location coordinates:

- WGS84;
- EPSG:4326;
- longitude and latitude stored explicitly;
- API response must name coordinate ordering clearly.

Do not allow ambiguous unnamed coordinate arrays in domain code.

Prefer typed objects such as:

```ts
interface Wgs84Position {
  longitude: number;
  latitude: number;
  heightMeters?: number | null;
}
```

## 5.2 Database geometry

For place point geometry:

- PostGIS `geometry(Point, 4326)` or equivalent documented choice;
- add GIST spatial index.

## 5.3 Metric calculations

Do not perform planar area/distance calculations naively on latitude/longitude degrees.

For future metric analysis:

- use PostGIS geography where appropriate;
- or project into an explicitly selected local/projected CRS;
- store the method/version when a calculation becomes a published analytical fact.

## 5.4 Vertical datum

Phase 0 must introduce vertical datum metadata even if actual elevation analytics are deferred.

Required terrain dataset metadata:

```text
horizontal_crs
vertical_datum
resolution
source
source_version
processing_version
```

Unknown vertical datum must remain explicit.

---

# 6. Spatial domain model — Phase 0

Do not model the system as a single `places` table with JSON blobs only.

Use bounded structures that preserve future evolution.

## 6.1 Place

Core entity:

```text
Place
- id
- name
- slug
- short_description
- description
- area_name
- publication_status
- created_at
- updated_at
- created_by
- updated_by
```

Publication status:

```text
DRAFT
PUBLISHED
ARCHIVED
```

## 6.2 Place geometry

Separate geometry lifecycle from content lifecycle.

Suggested model:

```text
PlaceGeometry
- id
- place_id
- geometry
- geometry_type
- source_record_id
- source_crs
- location_role
- verification_status
- horizontal_accuracy_m
- observed_at
- verified_at
- verified_by
- valid_from
- valid_to
- created_at
```

`location_role` should support:

```text
DECLARED
OBSERVED
VERIFIED
```

Do not overwrite the historical geometry when a location is corrected.

## 6.3 Categories

A place can belong to multiple categories.

Use:

```text
PlaceCategory
PlaceCategoryLink
```

Examples:

```text
CHECK_IN
SCENIC_VIEW
CLOUD_HUNTING
TREKKING
CAFE
HOMESTAY
RESTAURANT
LANDMARK
VILLAGE
```

Category configuration should be data-driven, not hard-coded into Cesium components.

## 6.4 Visit context

Store structured fields where useful and retain display text.

Possible model:

```text
PlaceVisitContext
- place_id
- best_season_text
- recommended_time_text
- difficulty
- audience_text
- guide_requirement
```

Phase 0 does not need fully normalized season/time semantics unless easy to implement safely.

## 6.5 Access context

Store descriptive access information separately from authoritative road-network calculations.

```text
PlaceAccessContext
- place_id
- access_method_text
- road_condition_text
- route_note
- source_record_id
- verification_status
- observed_at
```

Do not expose phrases such as “safe road” as deterministic truth.

## 6.6 Safety note

Safety content must be informational, sourced, and freshness-aware.

```text
PlaceSafetyNote
- id
- place_id
- note
- source_record_id
- verification_status
- observed_at
- expires_at
```

## 6.7 Media

Use a media entity rather than fixed `image_1`, `image_2` database columns.

```text
PlaceMedia
- id
- place_id
- media_type
- source_url
- storage_key
- title
- alt_text
- sort_order
- source_record_id
- captured_at
- created_at
```

Media types should support future extension:

```text
IMAGE
VIDEO_LINK
PANORAMA_360
DRONE_IMAGE
```

In Phase 0, image URL and video URL support are sufficient.

## 6.8 External references

```text
ExternalReference
- id
- subject_type
- subject_id
- provider
- external_url
- external_id
- source_record_id
```

Provider example:

```text
GOOGLE_MAPS
```

Google Maps is a cross-reference, not LAND's spatial source of truth.

---

# 7. Verification and trust model

Verification must be first-class from Phase 0.

## 7.1 Separate source authority from verification status

Prefer two dimensions.

### Source authority

```text
OFFICIAL
LAND_OBSERVED
PARTNER
SELLER
THIRD_PARTY
LEGACY_IMPORT
UNKNOWN
```

### Verification status

```text
VERIFIED
DECLARED
UNKNOWN
EXPIRED
```

This is preferable to overloading a single enum.

## 7.2 Verification rules

A value imported from Excel is not automatically `VERIFIED`.

A Google Maps URL is not automatic verification.

A value copied from BIKER is not automatic verification.

A human admin moving a marker is not automatically sufficient to establish factual verification unless the configured procedure says so.

Every verified value must be associated with:

- verification method;
- verification timestamp;
- actor;
- evidence/source reference where applicable;
- expiry/freshness policy where applicable.

## 7.3 Unknown behavior

When data is missing:

- do not auto-fill using AI;
- do not silently geocode to a guessed result;
- do not publish a map location if required geometry is unknown, unless a deliberate product policy provides a non-map fallback;
- surface review required.

---

# 8. Source and provenance model

Phase 0 must implement a source registry.

## 8.1 Source registry fields

Suggested fields:

```text
Source
- id
- provider_id
- name
- category
- authority_level
- license_name
- license_reference
- public_display_allowed
- redistribution_allowed
- source_crs
- freshness_class
- status
- last_checked_at
- notes
```

## 8.2 Source record

Each imported value or record should be traceable to a source record.

```text
SourceRecord
- id
- source_id
- external_record_id
- import_batch_id
- collected_at
- imported_at
- raw_payload_hash
- notes
```

## 8.3 Import batch

```text
ImportBatch
- id
- source_id
- file_name
- file_hash
- uploaded_by
- uploaded_at
- status
- total_rows
- valid_rows
- warning_rows
- invalid_rows
- committed_at
```

Batch status:

```text
UPLOADED
VALIDATING
READY_FOR_REVIEW
REJECTED
COMMITTED
FAILED
```

---

# 9. Excel bulk import — required Phase 0 feature

This is a required feature, not a future enhancement.

The system must support a human-friendly Excel import workflow based on the current Tà Xùa local-data format.

## 9.1 Import principles

Do not perform:

```text
Excel → direct INSERT into production tables
```

Required flow:

```text
Excel upload
→ workbook inspection
→ sheet selection
→ column mapping
→ normalization
→ validation
→ spatial validation
→ duplicate detection
→ staging
→ map preview
→ admin review
→ commit
→ draft places
→ explicit publish
```

## 9.2 Supported input concepts

The initial importer should support fields corresponding to:

```text
name
slug
area
coordinates
google_maps_url
category/categories
best_season
recommended_time
difficulty
audience
guide_requirement
access_method
road_condition
route_note
short_description
description
highlight/review
safety_note
image_url(s)
video_url(s)
source
source_updated_at
notes
```

The importer must not require database column names in the Excel file.

## 9.3 Column mapping

Admin must be able to map spreadsheet columns to import fields.

Provide sensible aliases for Vietnamese headers.

Examples:

```text
"Địa điểm" → name
"Tên" → name
"Tọa Độ" → coordinates
"URL Google Map" → google_maps_url
"URL Ảnh" → image_url
"Giới thiệu ngắn" → short_description
"Mô tả" → description
"Tình trạng đường" → road_condition
```

Do not rely exclusively on fuzzy AI mapping.

Use deterministic alias matching first.

Optional AI-assisted suggestions can be a future enhancement and must require human confirmation.

## 9.4 Coordinate parser

Support input such as:

```text
21.26254175667024, 104.53036202410956
```

Parse into:

```text
latitude = 21.26254175667024
longitude = 104.53036202410956
```

Validate:

- latitude in `[-90, 90]`;
- longitude in `[-180, 180]`;
- point within configured TÀ XÙA LAND AOI where expected;
- coordinate order ambiguity detection;
- missing coordinate;
- malformed coordinate.

If coordinates appear reversed but both values are valid, flag for review instead of silently swapping unless a deterministic regional rule is explicitly documented and tested.

## 9.5 Google Maps URL handling

Store the URL as an external reference.

If coordinates can be deterministically parsed from a supported Google Maps URL format, importer may expose them as a candidate comparison, but must not overwrite a coordinate automatically without explicit policy.

Google Maps URL does not make a location verified.

## 9.6 Validation categories

Each staged row must result in:

```text
VALID
WARNING
INVALID
```

Examples:

### VALID

- valid name;
- valid coordinates;
- inside AOI;
- unique slug or safe generated slug;
- known category mappings.

### WARNING

- missing Google Maps URL;
- missing image;
- coordinate is unusually far from known settlement/road context;
- duplicate-like name;
- unknown category token;
- description indicates car access but nearest mapped road is unusually distant once road data exists.

### INVALID

- missing name;
- malformed coordinate for a record intended to appear on the map;
- impossible coordinates;
- corrupt workbook row;
- unsafe/unsupported URL format where strict policy requires rejection.

## 9.7 Duplicate detection

Use deterministic candidate rules, for example:

- exact slug match;
- normalized name match;
- near-identical coordinates;
- same external reference URL;
- combined name + proximity heuristic.

Do not auto-merge duplicates.

Admin must decide:

```text
create new
update existing
skip
review later
```

## 9.8 Import preview

Admin must see a preview before commit.

Required summary:

```text
total rows
valid
warnings
invalid
duplicate candidates
missing coordinates
```

Required map preview:

- candidate markers;
- invalid points visually distinguished;
- click row ↔ focus marker;
- click marker ↔ focus row;
- AOI boundary where useful.

## 9.9 Commit semantics

Import commit creates/updates draft records according to explicit user selection.

Import must not automatically publish public content.

All mutations must be auditable.

---

# 10. Admin Spatial Content Management

Phase 0 Admin is not a generic CRUD panel. It is a spatial content operations workspace.

## 10.1 Place list

Admin place list should support:

- search;
- category filter;
- publication status filter;
- verification filter;
- missing-coordinate filter;
- stale-data filter;
- source filter;
- sort by last updated;
- bulk archive where safe;
- bulk publish only for records that pass required validation.

## 10.2 Place editor

Required sections:

```text
Basic information
Location
Categories
Visit context
Access context
Content
Safety
Media
External references
Source / provenance
Verification
Publishing
Audit summary
```

## 10.3 Map picker

The editor must include a spatial picker.

Required behavior:

- enter longitude/latitude and fly camera to point;
- click map to create a candidate point;
- drag point when editing;
- show old vs proposed geometry when changing a verified location;
- confirm geometry change before save;
- preserve historical geometry instead of destructive overwrite.

## 10.4 Verification workspace

For each location, Admin should see:

```text
candidate location
current public/verified location
source
verification state
last verified time
accuracy if known
terrain context
imagery context
nearby mapped road context when available
```

Phase 0 may implement road context at a basic level depending on available road data, but the interface and service boundary should be designed for future expansion.

## 10.5 Publication gate

A place cannot be published to the map if required public geometry is absent.

Suggested minimum publish requirements:

- name;
- slug;
- public geometry;
- category;
- source record;
- verification status explicitly set;
- no blocking validation errors.

`UNKNOWN` verification may still be publishable where policy allows, but must be surfaced as unknown and never rendered as verified.

---

# 11. CesiumJS viewer architecture

CesiumJS is the primary regional 3D engine.

## 11.1 Client loading

Cesium must be client-safe.

Requirements:

- lazy-load Cesium on viewer routes;
- do not execute browser-only initialization during server rendering;
- isolate viewer lifecycle in a dedicated package/component;
- clean up viewer instances on unmount;
- prevent duplicate viewer creation in development strict-mode scenarios.

## 11.2 Viewer responsibilities

Create a reusable viewer shell supporting:

- terrain provider;
- imagery provider;
- place layer;
- road layer;
- layer manager;
- camera controls;
- selected-feature state;
- fly-to actions;
- error and fallback states.

## 11.3 Layer manager

Required logical layers in Phase 0:

```text
terrain
imagery
roads
places
```

Layer configuration should be driven by typed definitions.

Do not scatter provider URL strings through components.

## 11.4 Camera policy

Define:

- initial Tà Xùa overview;
- allowed camera region/bounds where appropriate;
- camera minimum/maximum height;
- reset action;
- one or more preset viewpoints;
- fly-to-place.

Prevent user navigation from causing uncontrolled asset loading far outside the intended regional scope when practical.

## 11.5 Place rendering

Phase 0 place layer must support:

- point marker;
- category-specific icon or visual encoding;
- clustering if needed for mobile/zoomed-out states;
- selected state;
- hover/tap interaction;
- details panel integration.

Do not bake full place descriptions into Cesium entities when API-driven details are more efficient.

## 11.6 Terrain proof of concept

Phase 0 must display a representative terrain dataset correctly.

Acceptance requires:

- known location aligns visually with terrain;
- camera navigation stable;
- no secret exposed in client bundle;
- terrain source metadata visible in developer/admin diagnostics.

---

# 12. Terrain and spatial asset pipeline — Phase 0 scope

Phase 0 implements a reproducible proof-of-concept pipeline, not the final all-region pipeline.

## 12.1 Asset zones

Use logical object storage zones:

```text
raw/
normalized/
derived/
published/
```

Prefer separate buckets or strong path/policy separation between private raw data and public published assets.

## 12.2 Raw assets

Raw assets are immutable.

Store metadata:

```text
source
license
capture/download date
checksum
original CRS
vertical datum if known
resolution
raw filename/object key
```

## 12.3 Normalized assets

Normalized outputs may include:

- clipped DEM;
- CRS-normalized vectors;
- normalized imagery;
- repaired geometries.

## 12.4 Derived assets

Phase 0 derived examples:

- terrain asset;
- optimized imagery artifact;
- place/road vector exports if needed.

Slope, viewshed, sun/shadow are not required yet.

## 12.5 Published release

Published spatial assets must be immutable and versioned.

Example:

```text
/terrain/TX-DEM-2026-001/...
/imagery/TX-IMG-2026-001/...
```

Do not update bytes at the same permanent versioned URL.

Use a release manifest/pointer when switching current release.

---

# 13. Dataset registry and release model

Required entities:

```text
Dataset
DatasetRelease
DatasetAsset
PipelineRun
```

## 13.1 Dataset

Examples:

```text
TX_TERRAIN_BASE
TX_IMAGERY_BASE
TX_ROADS_BASE
TX_PLACES
```

## 13.2 Dataset release

Suggested fields:

```text
id
dataset_id
version
source_version
pipeline_version
source_crs
target_crs
vertical_datum
bbox
resolution
license
checksum
qa_status
generated_at
published_at
supersedes_release_id
```

## 13.3 QA status

```text
DRAFT
VALIDATED
APPROVED
REJECTED
PUBLISHED
RETIRED
```

Publishing a release is an explicit admin/system operation.

---

# 14. Public-safe API contracts

Public web and future AI must not read raw database rows directly.

Create a contract package with Zod schemas and TypeScript types.

## 14.1 PublicPlaceDTO

Example shape:

```text
id
name
slug
shortDescription
categories
location
publicationStatus
mediaSummary
verificationSummary
sourceSummary
freshnessSummary
```

Do not expose:

- internal admin notes;
- private evidence;
- actor identifiers not meant for public use;
- raw source payloads;
- secrets;
- internal diagnostics.

## 14.2 PublicPlaceDetailDTO

May additionally include:

```text
description
visitContext
accessContext
safetyNotes
media
externalReferences
```

Every factual section that requires trust semantics should preserve source/verification state where meaningful.

## 14.3 Spatial location DTO

Example:

```text
longitude
latitude
heightMeters?
locationRole
verificationStatus
horizontalAccuracyMeters?
```

---

# 15. API structure

Recommended Phase 0 public endpoints:

```text
GET /api/public/places
GET /api/public/places/:slug
GET /api/public/places/search
GET /api/public/layers
GET /api/public/datasets/current
```

Recommended Admin endpoints:

```text
GET    /api/admin/places
POST   /api/admin/places
GET    /api/admin/places/:id
PATCH  /api/admin/places/:id
DELETE /api/admin/places/:id  # preferably archive/soft-delete semantics

POST   /api/admin/imports
GET    /api/admin/imports/:id
POST   /api/admin/imports/:id/validate
POST   /api/admin/imports/:id/commit

GET    /api/admin/sources
GET    /api/admin/datasets
GET    /api/admin/diagnostics
```

Use explicit application services between route handlers and database access.

Do not put complex domain logic directly in route handlers.

---

# 16. Security baseline

Phase 0 security is mandatory.

## 16.1 Secrets

Rules:

- no secrets in client bundles;
- no secret prefixed with `NEXT_PUBLIC_` unless intentionally public;
- no secret stored in admin-editable database fields;
- no raw API key displayed in Admin;
- no BIKER/TRIP service-role credential reused;
- no credentials imported from uploaded Excel workbooks.

Admin may see only statuses such as:

```text
CONFIGURED
MISSING
DISABLED
UNHEALTHY
```

## 16.2 Uploaded workbook security

Treat Excel files as untrusted inputs.

Requirements:

- size limit;
- extension/MIME validation;
- parse in controlled server/worker environment;
- never execute workbook macros;
- reject unsupported macro-enabled formats initially;
- sanitize strings used in logs/UI;
- do not persist full workbook publicly;
- retention policy for import files.

## 16.3 Admin authentication

Implement authenticated Admin access.

At minimum support roles conceptually:

```text
DATA_VIEWER
DATA_EDITOR
VERIFIER
PUBLISHER
SYSTEM_ADMIN
```

Phase 0 implementation may begin with fewer roles, but permissions architecture must not assume every admin is superuser.

## 16.4 Audit

Audit at least:

- place create/update/archive;
- geometry changes;
- verification actions;
- publish/unpublish;
- import commit;
- source/dataset publication actions.

---

# 17. Soft delete and history

Avoid destructive delete for core spatial/business records.

Use archive/soft-delete semantics for:

- places;
- geometries;
- source records;
- categories where referenced.

Hard delete may exist only for narrowly defined safe cases such as failed staging rows with no audit requirement.

---

# 18. Performance strategy

Mobile performance is a Phase 0 requirement.

## 18.1 Device profiles

Test at least:

```text
Desktop modern/high
Desktop median
Mobile modern
Mobile constrained/network-throttled
```

## 18.2 Viewer performance rules

- lazy-load Cesium;
- avoid shipping admin code to public viewer where possible;
- minimize React rerenders around Cesium;
- progressive data loading;
- prefer CDN assets;
- use clustering/LOD for places;
- avoid expensive shadows in Phase 0;
- no full-region photogrammetry;
- preload only minimal critical assets;
- cache immutable versioned spatial assets aggressively.

## 18.3 Metrics

Capture or make observable:

```text
viewer initialization time
first stable frame
failed tile requests
place-layer load time
API latency
import validation duration
client errors
WebGL capability/failure
```

FPS telemetry may be basic in Phase 0 but architecture should allow later profiling.

## 18.4 Fallback

If Cesium/WebGL cannot run:

- show a usable fallback state;
- provide place search/details;
- optionally provide a lightweight 2D/static representation;
- never fabricate spatial facts to compensate.

---

# 19. Observability and diagnostics

Admin must have read-only diagnostics.

Required areas:

## 19.1 Dataset/source diagnostics

Show:

```text
source name
configured status
license metadata
last checked
current release
release status
freshness class
```

## 19.2 Viewer diagnostics

Development/admin diagnostics should expose:

```text
Cesium initialized
terrain provider status
imagery status
current dataset release ids
failed requests count
WebGL support
```

Do not expose sensitive provider payloads to public users.

## 19.3 Import diagnostics

Show:

```text
batch status
validation duration
row counts
error categories
duplicate candidates
commit result
```

---

# 20. Source data and licensing requirements

Before using a source in production, record:

```text
provider
source URL/reference
license
commercial use status
public display permission
caching permission
transformation/derivative permission
redistribution permission
last legal/license review
```

Do not assume that a publicly viewable map/imagery source can be cached and redistributed.

Phase 0 may use development/demo sources when necessary, but production source assumptions must be documented clearly.

---

# 21. Road data in Phase 0

Road mapping is essential to LAND's future moat, but Phase 0 should establish the domain and rendering foundations without overbuilding routing.

Required:

- a road layer can be loaded/rendered;
- road source is registered;
- road geometry can be represented as spatial features;
- public road rendering is versioned;
- admin can visually compare a place to nearby mapped roads;
- road facts remain distinct from place text descriptions.

Not required yet:

- production turn-by-turn routing;
- guaranteed access analysis;
- road safety scores;
- travel-time accuracy models;
- full road verification workflow.

Future model should support:

```text
RoadSegment
RoadObservation
RoadAccessFact
```

Do not encode road quality as a single permanent field directly on `Place`.

---

# 22. AI readiness without public AI

Phase 0 should prepare the system for future AI without implementing customer chatbot runtime.

## 22.1 Design rule

Future AI must consume the same public-safe authoritative contracts as other clients.

AI must never be the source of spatial truth.

## 22.2 Future tool compatibility

Public contracts should be suitable for future explicit tools such as:

```text
search_places
get_place_details
get_place_spatial_context
get_elevation
get_slope
get_road_access
get_viewshed
get_nearby_places
```

No need to implement these AI tools in Phase 0.

## 22.3 Integration registry foundation

It is acceptable to implement a generic provider registry concept now for future terrain/imagery/storage/AI integrations.

Fields may include:

```text
provider_id
type
enabled
credential_status
health_status
last_checked_at
latency_ms
timeout_policy
budget_policy
kill_switch
```

Do not build public chatbot UI or AI prompt/persona editor yet unless Phase 0 is otherwise fully complete and the work is only a non-runtime placeholder.

---

# 23. Data migration from existing Tà Xùa datasets

Legacy Excel or BIKER data may be used as seed source data.

Treat the source as:

```text
source_authority = LEGACY_IMPORT
verification_status = UNKNOWN or DECLARED
```

unless a separate verification process upgrades specific fields.

Required migration behavior:

- do not import account/credential sheets;
- do not import secrets;
- do not share BIKER database access;
- migrate only content/spatial records;
- preserve original source identity;
- preserve raw source row reference/hash where practical.

---

# 24. Suggested database entities for Phase 0

The exact ORM/library is implementation-defined, but the logical entities should include at least:

```text
users/admin_users
roles
role_permissions

audit_events

places
place_geometries
place_categories
place_category_links
place_visit_contexts
place_access_contexts
place_safety_notes
place_media
external_references

sources
source_records

import_batches
import_rows
import_row_errors
import_row_actions

datasets
dataset_releases
dataset_assets
pipeline_runs

integration_providers
integration_health_checks
```

Do not create dozens of micro-tables without reason. Preserve domain clarity while keeping Phase 0 manageable.

---

# 25. Suggested import staging model

A strong staging model is important.

Example:

```text
ImportRow
- id
- batch_id
- row_number
- raw_data_json
- normalized_data_json
- validation_state
- target_place_id
- duplicate_candidate_ids
- admin_action
- committed_at
```

Error model:

```text
ImportRowError
- id
- import_row_id
- field
- code
- severity
- message
- metadata_json
```

Possible error codes:

```text
MISSING_REQUIRED_FIELD
INVALID_COORDINATE
OUTSIDE_AOI
AMBIGUOUS_COORDINATE_ORDER
DUPLICATE_SLUG
DUPLICATE_LOCATION_CANDIDATE
UNKNOWN_CATEGORY
INVALID_URL
UNSUPPORTED_MEDIA_URL
```

---

# 26. AOI — Area of Interest

Define a configurable TÀ XÙA LAND area of interest.

Do not hard-code it invisibly in multiple services.

Store/configure:

```text
AOI polygon
name
version
source
updated_at
```

Coordinate import validation may use the AOI to flag unexpected points.

Being outside the AOI should be a warning or error according to configured policy, not necessarily a hidden rejection.

---

# 27. Public place experience

The public place page/panel should prove the future value proposition.

At minimum display:

```text
name
category/categories
short description
images if available
location
external map link if configured
visit context
access description
safety note if available
verification/source/freshness summary
```

Do not display internal review comments.

When a place is selected:

- Cesium flies/focuses to location;
- selected marker is visually distinct;
- details panel opens;
- shareable URL or state is desirable.

---

# 28. Search

Phase 0 search should support place discovery.

Required:

- search by place name;
- normalized Vietnamese search behavior where practical;
- category filtering;
- public only returns published records;
- result click triggers fly-to/select.

Do not introduce external search infrastructure until justified. PostgreSQL text search/trigram may be enough initially.

---

# 29. Error handling principles

Errors must be safe and actionable.

Public errors:

- user-friendly;
- no stack traces;
- no secret/provider raw bodies.

Admin diagnostics:

- categorized errors;
- safe detail;
- trace/correlation identifier;
- no Authorization header logging;
- no secret logging.

---

# 30. CI/CD requirements

At minimum CI should run:

```text
install
lint
typecheck
unit tests
build
```

Add database/integration tests where environment supports them.

Before merge to main, critical checks should pass.

Recommended branch workflow:

```text
main
feature/*
fix/*
```

Use pull requests for significant implementation changes when practical.

Do not push generated GIS binaries or large terrain assets into Git.

---

# 31. Environment configuration

Create `.env.example` with safe placeholders only.

Separate:

```text
PUBLIC_*
SERVER_*
DATABASE_*
STORAGE_*
CESIUM_*
```

Do not place real secrets in documentation.

Runtime configuration should validate required variables at startup.

---

# 32. Phase 0 testing plan

## 32.1 Domain tests

Test:

- verification transitions;
- source authority semantics;
- publication requirements;
- geometry history behavior;
- category relations.

## 32.2 Coordinate tests

Test:

- valid lat/lng;
- invalid ranges;
- malformed comma-separated coordinates;
- spaces;
- reversed-order candidate;
- outside AOI;
- missing coordinate.

## 32.3 Import tests

Fixtures should include:

- valid workbook;
- missing required header;
- duplicate slug;
- duplicate coordinates;
- mixed valid/invalid rows;
- unsupported sheet;
- malicious/oversized workbook scenario where practical;
- accidental credential/account sheet present and ignored/not mapped.

## 32.4 API tests

Test:

- public endpoint does not expose draft place;
- public DTO hides internal fields;
- admin endpoint requires auth;
- publish gate;
- archive behavior;
- source and verification state preserved.

## 32.5 Viewer tests

Playwright scenarios:

```text
viewer loads
terrain initializes
place markers appear
layer toggle works without reload
search returns place
fly-to works
place panel opens
mobile viewport works
fallback renders when viewer fails
```

---

# 33. Phase 0 performance acceptance targets

Avoid rigid numbers where infrastructure is not yet known, but define measurable budgets.

Codex should create a documented baseline for:

- public JS bundle size excluding lazy Cesium chunk;
- Cesium chunk lazy loading;
- viewer ready time on a representative broadband connection;
- viewer behavior on throttled mobile network;
- maximum initial place records sent to client;
- marker clustering threshold;
- import validation time for representative workbook sizes.

Any known regression must be documented before merge.

---

# 34. Phase 0 Admin screens

Minimum screens:

```text
/admin
/admin/places
/admin/places/new
/admin/places/:id
/admin/imports
/admin/imports/:id
/admin/sources
/admin/datasets
/admin/diagnostics
```

Optional if time allows:

```text
/admin/categories
/admin/audit
```

Do not add AI Control Center as a full production module in Phase 0.

---

# 35. Phase 0 public routes

Suggested routes:

```text
/
/map
/places
/places/[slug]
```

The exact UX may evolve, but the main spatial viewer should be easy to reach.

---

# 36. Commit-by-commit implementation plan for Codex

Codex should implement Phase 0 in small reviewable commits.

## Commit 1 — Repository foundation

Create:

- workspace;
- apps/packages directories;
- TypeScript strict config;
- linting;
- formatting;
- test runner;
- CI baseline;
- root docs.

Acceptance:

```text
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

all pass.

## Commit 2 — Domain contracts and ADRs

Implement:

- core enums;
- verification types;
- source authority types;
- WGS84 position type;
- public place DTOs;
- ADRs 001–008.

No database yet unless required by chosen migration tooling.

## Commit 3 — Database + PostGIS

Implement:

- Postgres connection;
- PostGIS enablement/migration;
- core Phase 0 tables;
- indexes;
- migration scripts;
- local development setup.

Acceptance:

- fresh database can be created from migrations;
- spatial point insert/query works;
- test database passes spatial smoke test.

## Commit 4 — Admin authentication and authorization foundation

Implement:

- Admin auth;
- role concepts;
- protected routes;
- authorization helpers;
- audit actor context.

Do not implement broad superuser-only assumptions in domain services.

## Commit 5 — Place application service and CRUD

Implement:

- place repository/service;
- geometry history;
- categories;
- media metadata;
- external references;
- provenance link;
- draft/archive lifecycle.

Add tests.

## Commit 6 — Source registry + dataset registry

Implement:

- sources;
- dataset metadata;
- dataset releases;
- admin read-only pages;
- safe diagnostics contracts.

## Commit 7 — Cesium viewer shell

Implement:

- lazy Cesium client component;
- base terrain provider config;
- imagery config;
- camera policy;
- layer manager;
- error/fallback state.

Do not integrate complex content UI yet.

## Commit 8 — Public place layer

Implement:

- public places API;
- published-place filtering;
- place markers;
- selection;
- details panel;
- fly-to;
- category filter/search basics.

## Commit 9 — Admin spatial editor

Implement:

- place editor;
- coordinate fields;
- Cesium map picker;
- candidate vs current geometry;
- verification fields;
- publication gate.

## Commit 10 — Excel import parser and staging

Implement:

- workbook upload;
- supported `.xlsx` parsing;
- sheet selection;
- deterministic header alias mapping;
- staging entities;
- coordinate parser;
- field validation.

No direct commit to places yet.

## Commit 11 — Import review and map preview

Implement:

- validation summary;
- table preview;
- error/warning display;
- duplicate candidates;
- map preview;
- row↔marker focus.

## Commit 12 — Import commit workflow

Implement:

- explicit create/update/skip actions;
- commit transaction boundaries;
- draft creation;
- source/source-record linkage;
- audit events;
- batch result summary.

## Commit 13 — Terrain/asset pipeline proof of concept

Implement:

- pipeline folder/scripts;
- raw/normalized/derived/published conventions;
- one sample/relevant DEM processing workflow;
- release manifest generation;
- documentation.

Do not commit large generated assets to git.

## Commit 14 — Observability and diagnostics

Implement:

- structured logs;
- viewer diagnostics;
- import diagnostics;
- provider/source status UI;
- safe error categories;
- correlation IDs.

## Commit 15 — Mobile and performance pass

Implement/fix:

- responsive public viewer;
- lazy loading;
- marker clustering or equivalent;
- mobile interaction;
- fallback;
- performance baseline doc.

## Commit 16 — Security and QA pass

Complete:

- secret scanning checks where practical;
- input validation;
- upload limits;
- authorization tests;
- public DTO leak tests;
- audit checks;
- final Phase 0 e2e suite.

## Commit 17 — Phase 0 documentation and release candidate

Create:

- operator guide;
- admin import guide;
- source registration guide;
- data verification guide;
- environment/deployment guide;
- known limitations;
- Phase 1 handoff notes.

---

# 37. Phase 0 acceptance criteria

Phase 0 is complete only when all mandatory criteria below pass.

## 37.1 Repository and build

- independent `TaXuaLand` repository;
- clean install works;
- build passes;
- lint/typecheck/test pass;
- CI configured.

## 37.2 Spatial viewer

- Cesium opens reliably on supported desktop browser;
- Cesium opens on representative mobile device/profile;
- terrain displays correctly for configured representative Tà Xùa AOI;
- imagery/layer architecture works;
- road layer can render;
- published places can render;
- layer toggle does not reload application;
- search/fly-to/select works;
- WebGL failure has fallback.

## 37.3 Spatial data integrity

- place location stored as PostGIS geometry;
- CRS strategy documented and enforced;
- geometry change does not destroy history;
- source/provenance exists for imported place data;
- verification status explicitly stored;
- unknown remains unknown.

## 37.4 Admin

- admin auth works;
- place CRUD works;
- map picker works;
- category association works;
- image/video link metadata works;
- publication workflow works;
- archived place disappears from public output;
- verification/source/freshness fields visible.

## 37.5 Excel import

- Admin can upload `.xlsx`;
- select relevant sheet;
- map recognized columns;
- parse coordinates;
- detect invalid rows;
- detect duplicate candidates;
- preview records on map;
- choose create/update/skip;
- commit valid rows into draft places;
- import is auditable;
- no imported secret/account sheet becomes runtime configuration.

## 37.6 Security

- no secret visible in client bundle;
- no server secret stored in editable Admin database field;
- no BIKER/TRIP service-role credential shared;
- public APIs do not expose internal raw rows;
- admin APIs require authorization;
- upload is treated as untrusted.

## 37.7 Operations

- source registry view works;
- dataset release metadata exists;
- diagnostics are safe;
- deployment/environment guide exists;
- known limitations documented.

---

# 38. What explicitly must NOT be built in Phase 0

Codex must not implement the following unless a later approved phase file instructs it to do so.

```text
Property marketplace
Property listings
Seller onboarding
Agent CRM
Lead management
Appointments
Payments
Offers
Contracts
Automated valuation
Comparable pricing engine
Development Suitability score
Viewshed production engine
Sun/shadow production engine
Full slope analytics service
Road safety scoring
Turn-by-turn routing
Full regional photogrammetry
Manual Blender model of the entire region
LiDAR pipeline
Public AI chatbot
AI Property Advisor
AI write tools
Generic SQL tool
Generic HTTP/browser tool
Direct AI database access
Cross-product database sharing
Shared service-role credentials
```

---

# 39. Known Phase 0 risks

## 39.1 Spatial source quality

Risk:

- DEM/road/imagery source may be inaccurate, stale, or weakly licensed.

Mitigation:

- source registry;
- release versioning;
- explicit license fields;
- no false verification.

## 39.2 Coordinate quality from legacy Excel

Risk:

- wrong coordinate;
- reversed latitude/longitude;
- copied pin is approximate;
- missing point.

Mitigation:

- staging;
- AOI validation;
- map preview;
- human review;
- geometry history;
- verification state.

## 39.3 Public map looks visually good but is spatially wrong

This is a critical product risk.

Mitigation:

- favor truthful lower-detail terrain over fabricated detail;
- verify source CRS;
- inspect known control points;
- keep dataset version visible in diagnostics;
- do not use hand-modeled regional geometry as spatial truth.

## 39.4 Mobile Cesium performance

Mitigation:

- lazy load;
- limited initial layers;
- clustering;
- no photogrammetry in Phase 0;
- mobile QA before acceptance.

## 39.5 Scope creep

The highest-risk scope creep areas are:

- adding marketplace too early;
- adding public AI too early;
- building routing before road data quality exists;
- spending too long on visual polish before data correctness.

The Phase 0 completion gate must block these expansions.

---

# 40. Codex execution rules

When Codex receives this file, it should follow these operating rules.

1. Read this complete file before writing code.
2. Inspect the current repository state before making changes.
3. Do not overwrite existing work without understanding it.
4. Implement in the commit order above unless a technical dependency requires a documented change.
5. After each major commit:
   - run lint;
   - run typecheck;
   - run tests;
   - run build where practical.
6. Keep architecture docs synchronized with implementation.
7. Never commit secrets.
8. Never commit legacy account credentials.
9. Never use AI-generated coordinates as verified facts.
10. Never silently repair spatial data.
11. Prefer explicit typed contracts.
12. Preserve provenance and verification semantics.
13. Keep public APIs public-safe.
14. Do not start Phase 1 features until Phase 0 acceptance criteria are met or an explicit documented exception is approved.

---

# 41. Definition of done

Phase 0 is done when TÀ XÙA LAND can demonstrate this end-to-end workflow reliably:

```text
Admin uploads a Tà Xùa place Excel workbook
            ↓
LAND parses and stages rows
            ↓
LAND validates coordinates and data
            ↓
Admin reviews warnings and duplicates
            ↓
Admin previews points against Cesium terrain/map context
            ↓
Admin commits approved rows as draft spatial places
            ↓
Admin adjusts/verifies location if necessary
            ↓
Admin publishes a place
            ↓
Public API exposes a public-safe place object
            ↓
Cesium renders the place at the approved real-world coordinate
            ↓
User searches the place and flies to it
            ↓
User sees its content together with source/verification context
```

If that workflow is robust, traceable, secure, and works on desktop/mobile, Phase 0 has achieved its purpose.

The product is then ready for Phase 1 — full Tà Xùa 3D regional base, where terrain, imagery, roads, villages, POIs, camera presets, search/fly-to/share, and regional spatial accuracy become the main delivery focus.

