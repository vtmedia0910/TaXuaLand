# Cesium viewer lifecycle

Viewer routes lazily import the client-only engine. The reusable shell owns viewer, handlers, listeners, data sources and destruction. React Strict Mode cleanup disposes the prior instance. Browser/provider initialization never runs in SSR.

Layers are terrain, imagery, roads and places. Only immutable published dataset URLs with public display and redistribution rights are served by the layers contract. The neutral grid is an explicit imagery placeholder without third-party map licensing assumptions. No default Cesium ion token is used.

The initial AOI is an operational coverage box, TX-AOI-DEMO-001, not an administrative boundary or a verified spatial fact. The active database AOI overrides it. Camera controls constrain height and return excursions to that region. The shell supports terrain providers, GeoJSON roads, clustered point markers, selection and a geometry candidate callback.

Milestone 13 supplies a hash-verified bounded Copernicus DSM release with explicit EGM2008 → ellipsoid conversion and a versioned OSM road extract. See `pipelines/README.md` for provenance, resolution and numerical QA. Absolute local/field accuracy remains UNKNOWN. Ellipsoid/grid fallback must never be described as real Tà Xùa terrain. Public place search/details remain available when WebGL fails. First-frame, stable-frame, initialization and tile-failure diagnostics contain no provider credential material.

Production QA found a Cesium dependency's embedded WASM string minified into invalid octal escapes by the Next 16.3.4 client build. The original `@spz-loader/core` JavaScript parses successfully; the emitted client chunk did not. A similar failure is tracked in [Cesium issue 13379](https://github.com/CesiumGS/cesium/issues/13379). Client production JavaScript uses Terser with ASCII-safe output while retaining minification; server/CSS defaults are retained. `infra/check-client-syntax.mjs` parses every emitted client chunk without execution after each root build, including CI. Revisit this bounded workaround after an upstream fix, only with production viewer QA and syntax checks. Webpack configuration internals are not covered by Next semver.
