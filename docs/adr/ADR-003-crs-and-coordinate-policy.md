# ADR-003: CRS and coordinate policy

Status: Accepted for Phase 0 implementation.

## Context

Input spreadsheets use latitude, longitude while GeoJSON/PostGIS use longitude, latitude.

## Decision

Domain/API uses named WGS84 EPSG:4326 positions; PostGIS geometry(Point,4326), GiST index. Metric operations use geography or an explicitly recorded projected CRS. Imports never silently swap/geocode. Vertical datum and transformation version remain explicit; unknown is UNKNOWN.

## Alternatives considered

Unnamed arrays and planar degree distances rejected. VN-2000/local CRS imports require declared source CRS and reproducible PROJ transformation before normalization.

## Consequences

Configurable versioned AOI drives warnings/errors. Geographic ring tests are for local non-antimeridian AOIs; PostGIS validates authoritative polygon geometry.

## Future review conditions

Review before polygon analytics, VN-2000 input, or a region crossing the antimeridian.
