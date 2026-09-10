# TÀ XÙA LAND — SKILL & PLUGIN ROUTING

Status: Agent orchestration policy
Purpose: Define which Skill / Plugin owns each phase of work so Codex can coordinate tools without overlap
Repository: `vtmedia0910/TaXuaLand`

> Codex is the central coordinator.
>
> Skills and plugins are specialist workflows and capabilities. They do not replace project architecture, repository contracts, or each other.
>
> The core rule is:
>
> ```text
> ONE PHASE
> → ONE PRIMARY OWNER
> ```
>
> Supporting skills may contribute only within their own clearly bounded responsibility.

---

## 1. Read order before choosing a Skill

For substantial work, Codex should first read:

```text
AGENTS.md
CONTEXT.md
docs/status/CURRENT.md
```

Then read only the task-relevant:

```text
spec
ADR
handoff
architecture document
visual specification
tests
GitHub Issue / PR
```

Do not choose a workflow from the prompt alone if the repository already defines the intended behavior.

Do not use a Skill to override:

- the Phase 0 architecture freeze;
- approved ADRs;
- repository contracts;
- migrations;
- tests;
- security boundaries;
- spatial truth semantics;
- phase gates.

---

## 2. Central coordinator model

The intended orchestration model is:

```text
USER
  ↓
CODEX
  ↓
READ REPO AUTHORITY
  ↓
CLASSIFY THE TASK
  ↓
SELECT ONE OWNER PER PHASE
  ↓
IMPLEMENT / VERIFY / REVIEW
  ↓
UPDATE PROJECT MEMORY
  ↓
COMMIT / PUSH / PR
```

Codex remains responsible for:

- understanding current repository state;
- respecting phase gates;
- deciding which specialist is relevant;
- preventing duplicate/competing workflows;
- integrating outputs;
- running repository validation;
- reporting verified versus unverified results;
- Git delivery.

---

## 3. Default ownership matrix

| Work phase | Primary owner | Supporting capability |
|---|---|---|
| Requirements clarification | Matt Pocock skills | repository docs/tests |
| Domain modeling | Matt `domain-modeling` | `CONTEXT.md`, architecture docs |
| Research | Matt `research` | primary documentation |
| Architecture reasoning | Matt `codebase-design` | existing ADRs/freeze |
| Architecture improvement | `$improve-codebase-architecture` only when explicitly requested | approved ADR workflow |
| Major requirement interrogation | `$grill-with-docs` only when explicitly requested | current repo/docs |
| Spec authoring | `$to-spec` only when explicitly requested | current requirements |
| Ticket decomposition | `$to-tickets` only when explicitly requested | approved spec |
| Implementation planning | Superpowers | existing code/tests |
| TDD | Superpowers | repository test stack |
| Implementation | Superpowers | specialist frontend/3D guidance where relevant |
| Systematic debugging | Superpowers | Playwright/runtime tools |
| Minimalism / anti-overengineering | Ponytail | applies throughout implementation |
| Frontend engineering | Build Web Apps | Superpowers owns implementation flow |
| Responsive / forms / touch / accessibility | `frontend-design-pro` | Build Web Apps |
| Visual polish | Designer Skill | Series 00 + task visual board |
| Spatial/3D visual reasoning | `3dviz-pro-max` | Cesium/PostGIS architecture remains authoritative |
| Browser verification | Playwright | repository E2E where applicable |
| Final substantial review | Matt `code-review` | architecture/security checklist |
| Merge conflict resolution | `resolving-merge-conflicts` | only when a real conflict exists |

---

## 4. Requirements and domain work — Matt Pocock skills

Use Matt skills when the intended behavior is genuinely unclear or when a task changes domain meaning.

Typical triggers:

```text
What should this feature mean?
Which entity owns this fact?
Is this Place, Property, Parcel, Dataset, or Release?
What is the authoritative state?
What does UNKNOWN mean here?
What user decision is required?
What are the invariants?
```

Appropriate helpers include:

```text
domain-modeling
grilling
research
codebase-design
```

Do not invoke requirement/domain workflows merely to restate an already approved spec.

### Explicit-only Matt workflows

The following should not be started automatically:

```text
$grill-with-docs
$to-spec
$to-tickets
$improve-codebase-architecture
$setup-matt-pocock-skills
```

Use them only when the repository owner explicitly asks for them.

If Matt skills are already set up for this repository, do not repeat setup.

---

## 5. Primary implementation workflow — Superpowers

Once requirements and intended behavior are sufficiently clear, Superpowers becomes the primary implementation owner.

Expected flow:

```text
understand current implementation
→ identify smallest coherent change
→ write/adjust failing test
→ implement
→ debug systematically
→ verify
→ refactor only if justified
```

Superpowers owns:

- implementation planning;
- TDD;
- implementation sequencing;
- bug isolation;
- systematic debugging;
- regression verification.

Do not run another full implementation workflow in parallel for the same task.

A specialist Skill may advise one part of the implementation, but Superpowers remains the overall implementation workflow owner.

---

## 6. Minimalism constraint — Ponytail

Ponytail applies throughout implementation.

Priority order:

```text
1. existing project code and abstractions
2. standard library
3. platform-native capability
4. dependency already installed
5. minimal new implementation
```

Ponytail should actively discourage:

- duplicate abstractions;
- unnecessary helpers;
- speculative frameworks;
- premature generalized systems;
- unnecessary dependencies;
- broad refactors unrelated to the task.

Ponytail must never reduce code by sacrificing:

- correctness;
- security;
- accessibility;
- data integrity;
- auditability;
- required validation;
- required error handling;
- spatial truth semantics.

Ponytail is a constraint, not an implementation owner.

---

## 7. Frontend engineering — Build Web Apps

Use Build Web Apps when a task materially changes frontend application behavior.

Good use cases:

- Next.js component implementation;
- stateful UI flows;
- data-driven frontend behavior;
- client/server boundary decisions;
- navigation interactions;
- map/drawer/list integration;
- application shell behavior.

Build Web Apps must respect:

```text
existing Next.js architecture
existing design tokens
Series 00 visual system
Series 02 global Admin IA
domain-specific visual authority
```

Do not use a frontend Skill to move authoritative domain logic into React for convenience.

---

## 8. Responsive, forms, touch, and accessibility — frontend-design-pro

Use `frontend-design-pro` when work affects:

- mobile layouts;
- tablet layouts;
- responsive transformations;
- forms;
- touch targets;
- keyboard interaction;
- focus states;
- accessible labels;
- error presentation;
- drawers/bottom sheets;
- map controls on touch devices.

Canonical responsive direction from the visual system includes patterns such as:

```text
Desktop Drawer
→ Tablet Side Panel
→ Mobile Bottom Sheet

Desktop Table
→ Mobile Cards
```

This Skill supports implementation quality; it does not redefine product semantics.

---

## 9. Visual polish — Designer Skill

Use Designer Skill for:

- visual hierarchy;
- spacing polish;
- typography;
- density;
- component composition;
- high-quality presentation;
- visual consistency;
- refinement against approved boards.

Designer Skill must use:

```text
Series 00
→ highest visual/component authority
```

and the task-specific visual board.

Designer Skill must not:

- treat AI-generated example numbers as database facts;
- merge semantic status families because they look visually similar;
- override accessibility;
- invent unsupported product behavior;
- override repository architecture.

Visual quality is important, but semantic correctness wins.

---

## 10. Spatial and 3D specialist — 3dviz-pro-max

Use `3dviz-pro-max` only when the task has meaningful 3D / spatial-presentation content.

Examples:

- terrain readability;
- regional 3D composition;
- camera behavior;
- scene hierarchy;
- lighting;
- material direction;
- landmark/object representation;
- spatial interaction;
- 3D motion;
- visual LOD strategy;
- hotspot presentation;
- 3D degraded/fallback states;
- evaluating actual rendered frames.

### 3Dviz is not the architecture authority

The LAND architecture remains:

```text
PostGIS
→ authoritative spatial truth

approved/versioned spatial releases
→ artifact authority

CesiumJS
→ primary 3D geospatial client
```

`3dviz-pro-max` is a specialist for reasoning and presentation.

It must not silently:

- replace Cesium with Three.js;
- introduce a parallel Vite app;
- replace PostGIS with scene state;
- bypass Dataset/Release lifecycle;
- create spatial facts from a visual;
- claim accuracy from rendered appearance;
- change terrain / 3D Tiles strategy without an approved ADR.

If a 3Dviz recipe is Three.js-specific, Codex should extract the reusable design/interaction principle and translate it into the existing Cesium architecture where appropriate.

### Correct 3D authority chain

```text
SOURCE
→ POSTGIS / DATASET / RELEASE
→ PUBLIC-SAFE CONTRACT
→ CESIUM
→ 3DVIZ PRESENTATION REASONING
→ OBSERVED BROWSER OUTPUT
```

Never reverse this chain.

### Representation honesty

3Dviz should preserve distinctions between:

```text
illustration
discrete state
playback
simulation
```

Motion does not prove simulation.

A beautiful terrain render does not prove spatial accuracy.

A camera animation does not establish a geographic fact.

---

## 11. Browser verification — Playwright

Use Playwright for affected user-facing flows.

Playwright owns browser verification, not implementation.

Typical verification:

- route loads;
- interactions work;
- map controls work;
- selected state works;
- drawer/bottom-sheet behavior works;
- forms submit safely;
- mobile/desktop layout is usable;
- console has no relevant runtime errors;
- downloads/headers work when applicable;
- WebGL/fallback behavior works when applicable.

Prefer focused browser verification over broad unrelated matrices.

Use bounded steps and reasonable timeouts.

Do not leave a single Node/browser verification command running indefinitely.

### Persistent LAND QA browser

When a dedicated authenticated browser profile is configured, prefer:

```text
session:
taxualand-qa

profile:
C:\Users\ADMIN\.playwright-profiles\taxualand-qa
```

The profile must remain outside the repository.

Do not:

- commit the profile;
- inspect cookies/tokens as normal task data;
- print secrets;
- delete the profile casually;
- create unnecessary ephemeral sessions when authenticated verification needs the persistent one.

---

## 12. Repository E2E versus Playwright specialist verification

LAND already has repository-owned deterministic browser E2E.

Repository-required checks remain authoritative.

Use:

```text
pnpm test:e2e:core
```

when required by repository policy.

The repository E2E suite and interactive Playwright verification serve different purposes:

```text
repository E2E
= deterministic regression gate

focused Playwright session
= task-specific observed browser verification
```

Do not replace required repository E2E with ad hoc browser clicking.

Do not claim interactive browser verification happened merely because E2E passed.

---

## 13. Final substantial review — Matt code-review

For substantial changes, run Matt `code-review` after implementation and verification.

The review should focus on material risks, not style churn.

LAND-specific review targets include:

- architecture freeze drift;
- source/provenance loss;
- UNKNOWN converted to default/zero;
- Declared/Observed/Verified collapse;
- Published/Verified collapse;
- Import Commit/Publish collapse;
- Dataset/Release collapse;
- immutable release violations;
- public/private leakage;
- credential-boundary regressions;
- geometry-history regressions;
- CRS/coordinate mistakes;
- browser secrets;
- provider-specific coupling leaking into domain code;
- Cesium becoming source of truth;
- visual data being mistaken for authoritative data;
- unsupported Phase 1/Property/AI scope creep;
- unnecessary complexity.

Resolve P0/P1 findings before merge readiness.

Resolve material P2 findings where required for safe delivery.

---

## 14. Merge conflict specialist

Use `resolving-merge-conflicts` only when an actual merge/rebase conflict exists.

Do not invoke it for:

- ordinary code review;
- branch synchronization without conflicts;
- normal diff inspection;
- architecture disagreement.

Never allow conflict resolution to silently change domain semantics.

If a conflict requires a product or architecture decision, stop for owner review.

---

## 15. Task classification before Skill selection

Codex should classify a task before invoking specialists.

### Type A — Documentation / status only

Examples:

- update CURRENT;
- fix stale handoff wording;
- record verification evidence.

Likely routing:

```text
Codex
→ no specialist unless interpretation is ambiguous
```

### Type B — Simple, well-specified implementation

Examples:

- small UI fix;
- test addition;
- validation fix;
- contained refactor.

Routing:

```text
Superpowers
+ Ponytail
+ affected specialist only if needed
```

### Type C — Frontend UX feature

Routing:

```text
Superpowers
+ Ponytail
+ Build Web Apps
+ frontend-design-pro if responsive/forms/a11y
+ Designer Skill if visual polish matters
+ Playwright
```

### Type D — Spatial / 3D feature

Routing:

```text
Matt/domain reasoning if semantics unclear
→ Superpowers
→ Ponytail
→ 3dviz-pro-max for 3D specialist reasoning
→ Build Web Apps if frontend integration
→ frontend-design-pro for responsive/touch
→ Playwright
→ code-review
```

### Type E — Architecture change

Routing:

```text
Matt codebase-design / research
→ inspect freeze + ADRs
→ propose ADR
→ STOP for owner approval
→ implementation only after approval
```

### Type F — Security / data-authority bug

Routing:

```text
Matt/domain reasoning if authority unclear
→ Superpowers TDD/debugging
→ Ponytail
→ focused security tests
→ Playwright only if browser behavior affected
→ code-review
```

---

## 16. Phase-aware routing

Skills must respect the product roadmap.

### Phase 0.5

Primary work is deployment/provider/evidence hardening.

Usually relevant:

```text
Superpowers
Ponytail
research when provider docs are genuinely needed
Playwright for affected deployed/browser verification
code-review
```

Usually not relevant:

```text
3dviz-pro-max
Designer Skill
large frontend redesign
Property skills
AI product work
```

unless the actual Phase 0.5 task directly affects those areas.

### Phase 1 — Tà Xùa 3D

After Phase 0.5 is closed, a dedicated Phase 1 spec exists, and the owner approves implementation:

```text
Superpowers
Ponytail
3dviz-pro-max
Build Web Apps
frontend-design-pro
Designer Skill
Playwright
code-review
```

become much more relevant.

But 3Dviz still does not replace Cesium/PostGIS/release authority.

### Future Property / AI phases

Do not activate specialized future workflows merely because Series 09/10 exist.

Visual presence is not phase authorization.

---

## 17. Skill invocation discipline

Before invoking a Skill, Codex should be able to answer:

```text
What phase am I in?
What problem does this Skill own?
Is another Skill already primary owner of this phase?
Will this Skill add information/capability that the repo does not already provide?
Could invoking it broaden scope unnecessarily?
```

If the answer is unclear, prefer fewer Skills.

More Skills do not automatically produce better code.

The goal is:

```text
minimum sufficient specialist set
```

---

## 18. Preventing duplicated workflows

Do not do this:

```text
Superpowers planning
+
another full planning methodology
+
another TDD workflow
+
another implementation agent
```

for one implementation phase.

Do this instead:

```text
Superpowers
= primary implementation workflow

Ponytail
= minimalism constraint

3dviz
= 3D specialist

frontend-design-pro
= responsive/a11y specialist

Playwright
= verification specialist
```

Each tool has a distinct responsibility.

---

## 19. Architecture escalation rule

A Skill recommendation does not authorize an architecture change.

If any Skill proposes changing:

- database/domain ownership;
- CRS strategy;
- verification semantics;
- publication lifecycle;
- public DTO trust boundary;
- geometry history;
- provider/secrets boundary;
- cross-product sharing;
- AI tool authority;
- core 3D engine;
- terrain / 3D Tiles strategy;

Codex must:

```text
STOP
→ identify the conflict
→ inspect current ADRs
→ propose the smallest architecture decision
→ document migration/security/rollback impact
→ request explicit owner approval
```

Only after approval may implementation continue.

---

## 20. Visual authority routing

For visual tasks, use this order:

```text
Series 00
→ general visual/component system

Series 02 v2
→ global Admin IA

domain-specific board
→ workflow/layout authority

Series 08
→ responsive transformation

Designer/frontend skills
→ implementation/refinement
```

Important examples:

```text
Public Map / 3D
→ Series 01 v2

Admin global shell
→ Series 02 v2

Spatial Verification
→ Series 03 v2
  but Series 02 wins for global sidebar

Place / POI
→ Series 04

Excel Import / QA
→ Series 05

Dataset / Release
→ Series 06

Operations / Diagnostics
→ Series 07

Responsive
→ Series 08

Property
→ Series 09 only in authorized future phase

AI
→ Series 10 only in authorized future phase
```

Generated numbers, dates, coordinates, and records remain illustrative.

---

## 21. Source-of-truth rule for Skill outputs

A Skill output is advisory until reconciled with repository truth.

Authority hierarchy:

```text
1. explicit owner instruction
2. approved architecture / ADR / semantic rules
3. current repository contracts / migrations / tests
4. current approved specification
5. canonical visual authority
6. specialist Skill recommendation
7. generic best practice
```

A Skill may identify a likely improvement.

It may not silently overrule higher authority.

---

## 22. Project-memory update after substantial work

After substantial implementation, update:

```text
docs/status/CURRENT.md
```

with:

- what changed;
- actual verification;
- remaining blocker;
- exact next action.

Update/create:

```text
docs/handoffs/
```

only when continuation context materially benefits from it.

Create an ADR only for a genuinely durable architectural decision.

Do not rewrite archived historical handoffs merely to make them look current.

---

## 23. Git and delivery responsibility

Skills do not own Git history.

Codex coordinates delivery.

Before delivery:

```text
inspect status
inspect diff
run required checks
run appropriate review
stage exact paths
inspect staged diff
commit focused changes
push branch
create/update PR
```

Avoid broad staging commands such as:

```text
git add .
git add -A
```

Do not perform destructive Git operations on uncertain local work.

Never treat successful push/deploy as sufficient verification.

---

## 24. Model recommendation convention for Codex prompts

When producing a prompt for Codex, include a model recommendation.

### Astra 6 — High

Prefer for:

- difficult architecture reasoning;
- security/data-authority work;
- migrations;
- complex spatial logic;
- large refactors;
- difficult debugging;
- long multi-step workflows;
- Phase 1 3D integration;
- Cesium/runtime/browser debugging;
- complex reconciliation across many docs/files.

### Sol 5.6 — Medium

Prefer for:

- well-specified feature implementation;
- normal UI/component work;
- tests;
- small refactors;
- type/lint fixes;
- documentation;
- bounded browser verification;
- bookkeeping/status updates.

### Sol 5.6 — High

Prefer when a task is still implementation-focused but has moderately difficult logic, broader test impact, or several interacting files.

Model choice does not change repository authority or Skill routing.

---

## 25. Recommended opening statement for substantial Codex tasks

At the beginning of a substantial task, Codex should briefly state:

```text
Primary workflow:
<skill>

Supporting specialists:
<skills>

Not needed:
<skills>

Reason:
<one concise explanation>
```

Example for a Phase 1 public terrain/map task:

```text
Primary workflow:
Superpowers

Supporting specialists:
Ponytail
3dviz-pro-max
Build Web Apps
frontend-design-pro
Playwright

Final review:
Matt code-review

Not needed:
to-spec / to-tickets / improve-codebase-architecture
unless explicitly requested or an architecture conflict appears.
```

This keeps orchestration visible without producing unnecessary ceremony.

---

## 26. Final routing rule

Use the fewest Skills that fully cover the task.

```text
REPO AUTHORITY FIRST
→ ONE PRIMARY OWNER PER PHASE
→ SPECIALISTS ONLY WHERE THEY ADD VALUE
→ VERIFY THE ACTUAL RESULT
→ UPDATE PROJECT MEMORY
```

For TÀ XÙA LAND specifically:

```text
SPATIAL TRUTH
always outranks
VISUAL CONVENIENCE

ARCHITECTURE
always outranks
SKILL DEFAULTS

VERIFIED EVIDENCE
always outranks
CLAIMED SUCCESS
```
