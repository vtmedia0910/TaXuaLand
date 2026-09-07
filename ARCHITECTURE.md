# Architecture

`apps/web` hosts Next.js public routes and a separately protected `/admin` route tree. This is permitted by specification section 3.2.
`services/api` owns application services; routes adapt HTTP to services. `packages` owns domain, spatial, trust, contracts, configuration and shared viewer/UI boundaries.
PostgreSQL/PostGIS is mandatory. Geometry uses EPSG:4326 with explicit longitude/latitude; metric queries use geography. Geometry history is append-only except closing validity intervals.
Ingestion stages untrusted workbooks before draft mutations. Spatial workers produce immutable raw/normalized/derived/published releases. No marketplace or AI runtime is part of Phase 0.
Hosting uses standard Next.js with a dedicated PostGIS service, following the supplied architecture instead of a Cloudflare/Sites starter.
