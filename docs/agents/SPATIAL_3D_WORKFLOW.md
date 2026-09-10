# TÀ XÙA LAND — SPATIAL 3D WORKFLOW

Status: Specialized 3D/spatial implementation protocol
Purpose: Define how Codex should use `3dviz-pro-max` inside the existing LAND architecture without replacing Cesium, PostGIS, release authority, or spatial-truth semantics
Repository: `vtmedia0910/TaXuaLand`

> `3dviz-pro-max` is a 3D reasoning and presentation specialist.
>
> It is **not** the spatial source of truth, the domain authority, the release authority, or the primary application workflow.
>
> The core LAND authority chain remains:
>
> ```text
> SOURCE
> → PROVENANCE
> → POSTGIS / DATASET / RELEASE
> → PUBLIC-SAFE CONTRACT
> → CESIUM
> → 3D PRESENTATION
> → OBSERVED BROWSER OUTPUT
> ```

---

## 1. Scope of this workflow

Use this workflow when a task materially affects:

- regional 3D map experience;
- terrain presentation;
- imagery presentation;
- road/spatial context;
- Place markers in 3D;
- camera framing;
- fly-to behavior;
- 3D scene readability;
- 3D layer composition;
- hotspot presentation;
- 3D object/landmark representation;
- spatial motion;
- lighting/material direction;
- progressive visual LOD;
- WebGL/degraded/fallback presentation;
- visual inspection of actual rendered frames.

Do not invoke this workflow merely because a page happens to contain a map.

---

## 2. Architecture authority

The following are already decided unless explicitly reopened through an approved ADR:

```text
PostgreSQL/PostGIS
= authoritative spatial datastore

CesiumJS
= primary 3D geospatial client

Cesium 3D Tiles
= preferred direction for streamed high-volume/high-detail 3D assets

Object storage
= artifact storage, not spatial truth

GIS pipelines
= reproducible spatial processing
```

`3dviz-pro-max` must adapt to this architecture.

It must not silently:

- replace Cesium with Three.js;
- create a second 3D application in Vite;
- move spatial authority into browser scene state;
- bypass PostGIS;
- bypass Dataset/Release lifecycle;
- create facts from visual appearance;
- change terrain strategy;
- change 3D Tiles strategy;
- change CRS semantics;
- change geometry-history semantics.

Any such change requires architecture review and an approved ADR before implementation.

---

## 3. Relationship to the main implementation workflow

For substantial 3D work:

```text
Requirements/domain reasoning
→ Matt skills only if needed

Implementation/TDD/debugging
→ Superpowers

Minimalism
→ Ponytail throughout

3D specialist reasoning
→ 3dviz-pro-max

Frontend integration
→ Build Web Apps

Responsive/touch/accessibility
→ frontend-design-pro

Visual polish
→ Designer Skill

Browser verification
→ Playwright

Final substantial review
→ Matt code-review
```

`3dviz-pro-max` does not replace Superpowers as the primary implementation workflow.

Its role is to improve 3D reasoning, visual construction, camera, lighting, hierarchy, interaction, and observed output.

---

## 4. 3D truth hierarchy

Every 3D feature must preserve this hierarchy:

```text
1. Real source / approved source
2. Source authority / rights / freshness
3. Spatial processing
4. PostGIS / registered dataset / release
5. Public-safe spatial contract
6. Cesium representation
7. 3D visual treatment
8. Observed rendered result
```

Lower levels cannot promote themselves into higher authority.

Examples:

```text
A mesh that looks accurate
!=
verified terrain accuracy

A road line rendered in Cesium
!=
road-safety certification

A Place marker at a coordinate
!=
field verification

A photorealistic building model
!=
legal Property truth

A moving object
!=
physics simulation
```

---

## 5. Representation honesty

Before implementing any 3D behavior, classify what the user is actually seeing.

Use one of:

```text
ILLUSTRATION
DISCRETE STATE
PLAYBACK
SIMULATION
```

### Illustration

A visual explanation or decorative representation.

Do not imply authoritative dynamics.

### Discrete state

A visualization driven by explicit application/domain state.

Example:

```text
Place verification status
terrain layer visibility
selected map layer
published release state
```

### Playback

A recorded or authored timeline.

Example:

```text
camera tour
guided fly-through
time-sequenced presentation
```

Playback is not a physical simulation.

### Simulation

Use this label only if the underlying model genuinely computes state evolution from explicit model rules/input.

Do not call a visual animation a simulation simply because it moves.

---

## 6. Source and accuracy boundary

3D presentation must never exceed the evidentiary quality of the source.

Preferred rule:

```text
SOURCE ACCURACY
sets the ceiling for
VISUAL CERTAINTY
```

If source quality is uncertain:

- use lower detail;
- expose UNKNOWN where appropriate;
- expose source/verification state;
- avoid false precision;
- avoid realistic detail that implies unsupported certainty.

For terrain, buildings, roads, or landmarks:

```text
better to show
coarse but honest
than
detailed but invented
```

---

## 7. Phase 1 public 3D priorities

After Phase 0.5 is closed and Phase 1 is explicitly authorized, prioritize:

```text
regional terrain
imagery
roads
villages/geographic context where source exists
published Places
search
select/fly-to
Place detail
source/verification presentation
layers
responsive mobile experience
WebGL/fallback behavior
```

Primary visual authority:

```text
Series 01 v2 — Public Map & 3D Experience
```

Supporting visual authorities:

```text
Series 00 — Design System
Series 04 — Place / POI
Series 06 — Dataset / Release
Series 08 — Mobile / Responsive
Series 03 — verification presentation only where relevant
```

Do not implement future Property/AI features merely because Series 01 shows them.

---

## 8. 3D task intake checklist

Before coding a 3D task, Codex should answer:

```text
What user problem is being solved?

What spatial/domain object is involved?

Where does the authoritative data come from?

Is the data:
Declared?
Observed?
Verified?
Published?
Unknown?

Which dataset/release owns the artifact?

What CRS and coordinate order apply?

What accuracy/uncertainty is known?

Is the visual:
illustration?
state?
playback?
simulation?

What Cesium primitive/layer/model should represent it?

What should 3dviz-pro-max contribute?

What must remain outside scope?
```

Do not start from visual styling alone.

---

## 9. Construction-route decision

For every 3D asset or representation, choose the smallest appropriate route.

Possible routes:

```text
A. Existing Cesium primitive/entity
B. Existing project component/helper
C. Existing published terrain/tiles/model
D. Adapted reusable 3D asset
E. Custom lightweight geometry
F. External authored asset
G. Mixed approach
```

Prefer reuse before custom work.

Do not introduce a full external 3D toolchain unless the feature genuinely needs it.

---

## 10. Translating 3dviz-pro-max guidance into Cesium

`3dviz-pro-max` may provide recommendations expressed in Three.js or generic 3D terms.

Codex must translate concepts into the existing Cesium architecture.

Example translations:

```text
Three.js camera composition
→ Cesium Camera / flyTo / viewBoundingSphere / heading-pitch-range

Three.js scene hierarchy
→ Cesium layer/entity/primitive/tileset composition

Three.js mesh material
→ Cesium Material / appearance / tileset styling / model material controls

Three.js LOD
→ Cesium 3D Tiles LOD / geometricError / screen-space-error strategy

Three.js object picking
→ Cesium screen-space event picking

Three.js model animation
→ Cesium Model animation where appropriate

Three.js terrain object
→ Cesium terrain provider / approved terrain release

Three.js light direction
→ Cesium lighting / globe lighting / model light behavior where supported
```

Do not copy a Three.js scaffold into LAND to implement a Cesium feature.

---

## 11. Terrain workflow

Terrain must follow:

```text
approved source
→ source rights
→ registered dataset
→ reproducible pipeline
→ QA
→ release candidate
→ immutable published release
→ public delivery
→ Cesium terrain integration
→ observed visual verification
```

3D visual review should inspect:

- terrain legibility;
- ridge readability;
- slope impression;
- horizon behavior;
- camera clipping;
- scale perception;
- texture/imagery alignment;
- mobile performance;
- degraded states.

Visual inspection does not replace:

- source licensing;
- vertical datum validation;
- checksum validation;
- release registration;
- accuracy verification.

---

## 12. Imagery workflow

Imagery must have:

- source/provider;
- rights/license;
- freshness;
- intended coverage;
- release identity;
- public-safe delivery path.

3D presentation should inspect:

- terrain/imagery alignment;
- oversharpening;
- contrast;
- atmospheric washout;
- readability under labels/markers;
- mobile rendering cost.

Do not fabricate imagery to make a production terrain layer appear more complete.

---

## 13. Roads and access context

Road rendering is spatial context.

It must not imply road-safety certification.

Preserve:

```text
Road Mapping != Road Safety
```

3D road presentation may communicate:

- location;
- relationship to terrain;
- relationship to Places;
- geometry;
- known access classification;
- freshness;
- source.

Do not visually imply:

- safe today;
- drivable;
- open;
- legal access;
- motorcycle suitability;

unless authoritative data explicitly supports those claims.

---

## 14. Place markers in 3D

Markers should support:

- position readability;
- category;
- selected state;
- cluster state;
- source/verification summary;
- focus/fly-to;
- detail access.

Marker visual style must not collapse semantic states.

For example:

```text
Published
!=
Verified

Official source
!=
Verified observation
```

Marker height/offset must not imply inaccurate elevation if the coordinate/elevation source does not support it.

---

## 15. Camera workflow

Camera behavior is product behavior, not decoration.

For every camera interaction define:

```text
entry view
target
distance
heading
pitch
transition
cancel behavior
selected-state behavior
mobile behavior
return/reset behavior
```

Typical Phase 1 camera modes may include:

```text
regional overview
Place fly-to
selected Place inspection
terrain overview
reset/home
```

Avoid excessive cinematic motion that harms orientation.

The user should always understand:

```text
where they are
what they are looking at
how to return
```

---

## 16. Camera quality checks

Inspect actual rendered views for:

- target visibility;
- horizon balance;
- terrain occlusion;
- camera collision;
- clipping;
- too-steep pitch;
- excessive empty sky;
- disorientation;
- unreadable marker density;
- mobile viewport cropping;
- awkward drawer/map competition.

Do not approve a camera preset from code values alone.

Look at the rendered frame.

---

## 17. Regional view versus hotspot view

LAND should avoid one-detail-level-for-everything.

Use:

```text
REGIONAL VIEW
= broad terrain context
= low/moderate detail
= efficient streaming

HOTSPOT VIEW
= selected important area
= higher detail where justified
= richer spatial content
```

High-detail assets should be bounded geographically.

Do not ship one monolithic high-detail 3D model for the whole region if streaming/LOD is more appropriate.

---

## 18. 3D Tiles boundary

Use Cesium 3D Tiles when appropriate for:

- photogrammetry;
- large model collections;
- high-detail hotspots;
- hierarchical spatial streaming;
- large 3D datasets.

Do not use 3D Tiles merely because the format is available.

Before introducing a tileset, confirm:

```text
source
rights
pipeline
release ownership
bounding region
coordinate/reference system
LOD strategy
public delivery
integrity
mobile cost
```

The tileset is a representation of authoritative/released spatial data, not authority itself.

---

## 19. External 3D assets

External assets may be used only when provenance and licensing are clear.

For each external model, track where applicable:

- source;
- license;
- creator/provider;
- original format;
- transformation pipeline;
- scale;
- coordinate frame;
- optimization;
- checksum;
- final release identity.

Do not download arbitrary assets into production merely because they improve appearance.

---

## 20. Blender use

Blender is optional.

Use it only when the subject requires authored modeling tasks such as:

- complex topology;
- sculpting;
- UV work;
- baking;
- rigging;
- hero asset optimization.

Do not add Blender to the workflow for simple Cesium primitives or ordinary map layers.

If Blender is used:

```text
source asset
→ authored transformation
→ export
→ validation
→ immutable released artifact
→ Cesium integration
```

Do not treat the `.blend` scene as production authority.

---

## 21. Materials and lighting

Visual design should support spatial understanding.

Use materials and lighting to improve:

- terrain form;
- object separation;
- focus;
- scale;
- selected state;
- day/night readability;
- contrast with UI.

Avoid:

- excessive bloom;
- fake cinematic fog that hides spatial context;
- dramatic lighting that misrepresents terrain;
- glossy materials on natural terrain without reason;
- visual effects that reduce marker readability.

Visual drama must not overpower spatial truth.

---

## 22. Atmosphere and fog

Atmospheric effects may support depth perception and Tà Xùa identity.

But fog/cloud visual treatment must distinguish between:

```text
decorative atmosphere
and
weather/visibility data
```

If atmosphere is decorative, do not imply it represents current meteorological conditions.

If it is driven by actual data, document:

- source;
- timestamp;
- freshness;
- mapping from data to visual state.

---

## 23. Animation and motion

Use motion to explain state or improve orientation.

Good uses:

- fly-to;
- layer reveal;
- selection transition;
- subtle marker emphasis;
- playback of an explicitly modeled sequence.

Avoid animation that:

- delays core interaction;
- causes motion sickness;
- hides loading problems;
- implies physical simulation without one;
- reduces mobile performance.

Honor reduced-motion preferences where relevant.

---

## 24. Performance-first 3D design

Performance is part of 3D correctness.

Track:

- initial map load;
- Cesium lazy loading;
- terrain loading;
- imagery loading;
- tileset payload;
- geometry count;
- marker count;
- clustering;
- memory behavior;
- mobile cost;
- interaction stability.

Prefer:

```text
progressive loading
lazy loading
bounded AOI
LOD
clustering
hotspot detail
```

over loading all possible detail at startup.

---

## 25. Mobile 3D profile

Mobile may reduce:

- render resolution;
- terrain detail;
- model detail;
- shadow/effect quality;
- simultaneous layers;
- marker density.

Mobile must not change:

- authoritative facts;
- verification semantics;
- publication semantics;
- source meaning;
- UNKNOWN state.

Responsive transformation should follow the project visual system.

Typical pattern:

```text
desktop:
map + drawer / side panel

mobile:
map + bottom sheet
```

Map interaction must remain usable with touch.

---

## 26. UI overlay discipline

3D map UI should not cover the map unnecessarily.

Prioritize:

```text
map understanding
→ selected context
→ controls
→ secondary metadata
```

Avoid permanent large UI surfaces if a drawer, sheet, popover, or progressive disclosure works better.

Public map remains:

```text
MAP FIRST
```

Place detail should remain spatially connected to the selected object.

---

## 27. Accessibility

3D content requires accessible non-3D support.

Where possible provide:

- textual Place names;
- searchable list;
- keyboard-accessible controls;
- focusable selected states;
- accessible buttons;
- meaningful labels;
- sufficient contrast;
- reduced-motion handling;
- fallback information when WebGL is unavailable.

Critical information must not exist only as a visual 3D cue.

---

## 28. WebGL failure and degraded mode

Define behavior for:

```text
WebGL unavailable
WebGL context lost
slow device
terrain unavailable
imagery unavailable
3D Tiles unavailable
network failure
partial layer failure
```

Degraded mode should preserve useful public-safe information.

Do not convert missing spatial data into fake substitute data.

If a layer is unavailable:

```text
UNAVAILABLE
or
UNKNOWN
```

is preferable to visual fabrication.

---

## 29. Loading states

3D loading is not binary.

Distinguish:

```text
application shell loaded
Cesium initialized
terrain loading
imagery loading
Places loading
tileset loading
selected object ready
```

Avoid showing a generic "ready" state before critical spatial layers are actually usable.

Where meaningful, expose partial/degraded loading honestly.

---

## 30. Observed-output requirement

A 3D task is not complete because:

```text
TypeScript compiles
tests pass
Cesium API calls exist
```

For user-visible 3D changes, inspect actual rendered output.

Required philosophy:

```text
BUILD IT
→ RUN IT
→ LOOK AT IT
→ REFINE IT
```

Do not describe a visual result that was not actually observed.

---

## 31. Visual verification views

Choose views based on the task.

Typical set:

```text
regional overview
selected Place
dense marker area
sparse marker area
high terrain relief
mobile portrait
desktop
loading state
degraded/error state
```

Do not automatically run every possible view.

Use the smallest set that proves the changed behavior.

---

## 32. Playwright verification

Use Playwright for browser-observable 3D behavior.

Verify where relevant:

- `/map` loads;
- Cesium initializes;
- expected layer appears;
- search works;
- fly-to works;
- selection works;
- drawer/bottom sheet works;
- layer toggles work;
- deep-link/focus state works;
- no private data leaks;
- no relevant console errors;
- mobile layout remains usable;
- WebGL/fallback behavior works.

Use bounded verification steps and reasonable timeouts.

Do not run one giant unbounded Node/browser script.

---

## 33. Visual capture discipline

When capturing screenshots or frames:

- record viewport;
- record route/state;
- identify selected object/layer;
- avoid including secrets/private evidence;
- distinguish authored fixture from real data;
- use captures for visual verification, not spatial-authority proof.

A screenshot proves what rendered in that browser session.

It does not prove source accuracy.

---

## 34. 3dviz reasoning checklist

When using `3dviz-pro-max`, ask it to reason explicitly about:

```text
silhouette
scale
proportions
scene hierarchy
camera
lighting
materials
depth
motion
interaction
LOD
visual focus
degraded state
```

Then reconcile its recommendation with:

```text
Cesium capabilities
existing code
approved source/release
mobile budgets
accessibility
Series 00
Series 01
repository architecture
```

Do not blindly implement every 3dviz suggestion.

---

## 35. Reuse hierarchy for 3D code

Ponytail applies.

Prefer:

```text
existing Cesium helper
→ existing LAND component
→ Cesium-native capability
→ installed dependency
→ minimal custom code
```

Avoid:

- custom scene frameworks;
- parallel render loops;
- redundant camera abstractions;
- duplicated layer managers;
- unnecessary shader systems;
- new asset pipelines without need.

---

## 36. Domain-to-visual mapping

Every visual state should have a known source.

Example:

```text
marker color
→ verification/publication/category state

marker position
→ authoritative public-safe geometry

terrain layer
→ published terrain release

road line
→ published road geometry

source badge
→ source authority field

verification badge
→ verification state

selected card
→ public-safe Place DTO
```

Do not derive domain truth from visual state.

---

## 37. Visual status semantics

Keep these independent:

```text
verification status
source authority
publication status
data availability
freshness
```

Do not compress them into one generic red/yellow/green state.

A visually clean interface must still preserve semantic distinctions.

---

## 38. Spatial query versus visual query

Do not make Cesium perform business/spatial authority calculations merely because the geometry is already in the browser.

Examples that should remain server/PostGIS/domain owned when authoritative:

- metric distance;
- spatial containment;
- authoritative nearest-neighbor;
- geometry validity;
- release selection;
- verification logic;
- access classification.

Client-side calculations may be used for presentation where explicitly non-authoritative.

Label accordingly.

---

## 39. Derived analytics

Future Phase 2 features such as:

- slope;
- aspect;
- elevation;
- viewshed;
- sun/shadow analysis;
- access metrics;

should be based on explicit deterministic inputs.

The 3D layer should visualize those results.

Do not make a color ramp or shader become the computation authority unless the architecture explicitly defines that result as presentation-only.

---

## 40. Viewshed warning

Preserve:

```text
Viewshed != Guaranteed Real-World View
```

A viewshed may depend on:

- terrain resolution;
- observer height;
- target height;
- vegetation/building omission;
- dataset date;
- line-of-sight assumptions.

The UI should expose limitations rather than present viewshed as guaranteed visual reality.

---

## 41. Property future boundary

Do not introduce Property-specific 3D behavior during Phase 1 merely because the public map board previews Property.

Future Property 3D may eventually include:

- Parcel geometry;
- building context;
- access;
- terrain;
- views;
- nearby Places.

But:

```text
Property != Parcel
Seller claim != verified fact
digitized parcel != legal cadastral boundary
```

These semantics must remain intact.

---

## 42. AI future boundary

Future AI may explain 3D/spatial data through typed tools.

It must not:

- move geometry;
- publish data;
- verify records;
- create authoritative 3D state;
- invent source facts;
- invent legal boundaries;
- invent valuations.

AI-generated visual suggestions must still pass the same architecture/data/release gates.

---

## 43. Research rule

When a 3D task depends on current Cesium/browser/provider behavior, research primary documentation as needed.

Prefer:

```text
Cesium official docs
provider official docs
browser/WebGL docs
project code/tests
```

over generic tutorials.

Do not introduce a new rendering technique based only on a blog/demo without checking compatibility with current LAND architecture.

---

## 44. Phase-aware use of 3dviz

### Phase 0.5

Normally:

```text
3dviz-pro-max
NOT NEEDED
```

unless Phase 0.5 specifically requires verifying existing 3D rendering behavior.

Focus on deployment/provider/evidence closure.

### Phase 1

3dviz becomes highly relevant for:

- public map composition;
- terrain readability;
- camera;
- Places in 3D;
- scene hierarchy;
- visual LOD;
- mobile 3D quality;
- degraded states.

### Phase 2

3dviz supports richer visualization of deterministic spatial analytics.

### Phase 3+

Use only within explicitly authorized Property/AI scope.

---

## 45. Implementation gates for a 3D feature

Before coding:

```text
requirements clear
authority clear
source/release clear
phase authorized
visual authority identified
```

During coding:

```text
Superpowers workflow
Ponytail constraint
3dviz specialist reasoning
reuse existing Cesium architecture
```

Before completion:

```text
targeted tests
typecheck/lint
repository checks as required
Playwright/browser observation
mobile verification where relevant
final code-review for substantial work
```

---

## 46. Required evidence for a user-visible 3D change

A completion report should distinguish:

```text
BUILT
what code/assets changed

TESTED
what automated checks passed

OBSERVED
what browser/rendered states were actually seen

PROVIDER-VERIFIED
what external delivery/runtime behavior was actually tested

NOT VERIFIED
what remains unknown
```

Do not merge these categories.

---

## 47. Stop conditions

Stop and request owner review if:

- 3dviz guidance implies replacing Cesium;
- a new core 3D engine is proposed;
- terrain / 3D Tiles strategy must change;
- source/licensing is unclear;
- a production spatial asset has no registered release path;
- spatial accuracy cannot be established but UI would imply certainty;
- authoritative geometry would be mutated without approved workflow;
- CRS/vertical datum is ambiguous;
- browser code would gain private/provider credentials;
- a future-phase Property/AI feature is required unexpectedly;
- provider/publication authority is unclear;
- destructive Git or production mutation would be required;
- the task requires an architecture decision not already approved.

Do not "solve" an architecture ambiguity inside a visual implementation.

---

## 48. Recommended Codex prompt posture for 3D tasks

For complex LAND 3D work:

```text
Model recommendation:
Astra 6 — High
```

Good fit for:

- Cesium architecture integration;
- complex camera/layer behavior;
- terrain/runtime debugging;
- multiple interacting spatial modules;
- long browser verification workflows;
- large Phase 1 tasks.

For bounded, already-specified visual implementation:

```text
Model recommendation:
Sol 5.6 — Medium or High
```

depending on complexity.

Model selection does not change spatial authority.

---

## 49. Final 3D implementation mantra

```text
DO NOT START FROM:
"What would look impressive?"

START FROM:
"What spatial truth do we have,
what user decision should this help,
and what is the most honest useful 3D representation?"
```

Then:

```text
SOURCE
→ AUTHORITY
→ RELEASE
→ CONTRACT
→ CESIUM
→ 3DVIZ REASONING
→ BUILD
→ RUN
→ LOOK
→ REFINE
→ VERIFY
```

For TÀ XÙA LAND:

**3D should make spatial truth easier to understand, never easier to misunderstand.**
