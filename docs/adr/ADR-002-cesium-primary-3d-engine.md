# ADR-002: Cesium primary 3D engine

Status: Accepted for Phase 0 implementation.

## Context

Terrain accuracy and geospatial coordinates must remain first-class.

## Decision

Use lazy client-only CesiumJS with one managed viewer lifecycle, typed layers, request-render mode, bounded camera and graceful searchable fallback.

## Alternatives considered

Custom Three.js/Blender regional models rejected as a substitute for georeferenced terrain.

## Consequences

Worker/static asset serving and desktop/mobile QA are required. Imagery may be an explicitly labelled neutral grid until approved.

## Future review conditions

Review when measured device performance or licensing prevents acceptance.
