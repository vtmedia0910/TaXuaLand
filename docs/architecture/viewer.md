# Cesium viewer lifecycle

Viewer routes lazily import the client-only engine. The reusable shell owns viewer, handlers, listeners, data sources and destruction. React Strict Mode cleanup disposes the prior instance. Browser/provider initialization never runs in SSR.

Layers are terrain, imagery, roads and places. Only immutable published dataset URLs with public display and redistribution rights are served by the layers contract. The neutral grid is an explicit imagery placeholder without third-party map licensing assumptions. No default Cesium ion token is used.

The initial AOI is an operational coverage box, TX-AOI-DEMO-001, not an administrative boundary or a verified spatial fact. The active database AOI overrides it. Camera controls constrain height and return excursions to that region. The shell supports terrain providers, GeoJSON roads, clustered point markers, selection and a geometry candidate callback.

Terrain rendering accuracy acceptance remains pending until milestone 13 supplies and validates a real georeferenced release. Ellipsoid/grid fallback must never be described as real Tà Xùa terrain. Public place search/details remain available when WebGL fails. First-frame, initialization and tile-failure diagnostics contain no provider credential material.
