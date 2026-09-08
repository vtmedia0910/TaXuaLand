# Pre-Phase 1 hardening evidence

Starting GitHub SHA: `a93d0db9045181c9a972891f8d9d4fc7707ae6cb`. Remote matched the audited Phase 0 baseline; all 230 local baseline files matched remote contents. The complete 822-line `PRE_PHASE_1_HARDENING.md`, original Phase 0 specification and required existing documentation/tests were read before implementation.

Overall status: **PARTIAL — local Git ACL remains BLOCKED**. Do not start Phase 1 until effective local Git permissions and metadata reconciliation pass, or the owner explicitly approves proceeding despite that blocker.

| Item | Evidence / status |
| --- | --- |
| Core E2E in CI | PASS on implementation commit `d40f8e8`: both push and PR runs green, nine real production Chromium tests, fresh isolated PostGIS/least-privileged runtime, no production secrets or GIS/live provider dependencies. [Harness and coverage](core-e2e.md). Final delivered commit must also have green checks. |
| Main ruleset | PASS: active `protect-main` / `22535774`, effective main rules read back from GitHub; force-push/deletion blocked, PR required, exact `check` + `e2e-core` checks from GitHub Actions, no bypass. [Configuration](github-main-ruleset.md). |
| Local `.git` | BLOCKED: ref lock and FETCH_HEAD writes still fail despite workspace and direct `.git` write grants and owner authorization. No destructive repair or discarded work. Local HEAD/cached origin-main remain `978bd9f633e094f29d6f5af4aa517991513cfc79`. [Diagnosis and owner action](local-git-repair.md). |
| Architecture freeze | PASS: [freeze](phase-0-architecture-freeze.md) committed as `f0a7008`; root [AGENTS](../../AGENTS.md) and [CONTRIBUTING](../../CONTRIBUTING.md) reference it. |

Local validation: frozen install, lint, strict application **and E2E** typecheck, 53 unit/PostGIS tests, production build, syntax validation of 63 emitted client chunks, secret scan and nine Core E2E tests pass. Logout replay after invalidation also passes a focused rerun. Viewer/Admin/import/public desktop/mobile screenshots were inspected directly. Local cleanup removes the unique QA database, runtime role and owned private import files, and terminates the QA server; Windows process-enumeration restrictions required a test-harness-only cleanup fallback.

Core reuses the release spec files. Pixel-precise marker dragging remains in release QA; deterministic Core uses numeric geometry correction with explicit confirmation and real Cesium focus. It still proves VERIFIED synthetic history becomes a new UNKNOWN observation. Core does not claim real terrain/field accuracy; the no-release neutral-grid state is truthful. Full terrain/OSM/performance acceptance remains separately documented.

GitHub evidence: [implementation push](https://github.com/vtmedia0910/TaXuaLand/actions/runs/34220866121), [implementation PR run](https://github.com/vtmedia0910/TaXuaLand/actions/runs/34220891895), [delivery PR #1](https://github.com/vtmedia0910/TaXuaLand/pull/1). Logical commits are delivered to the feature branch through parent-checked non-force Git Data API updates while local metadata remains blocked; this is not a successful normal local Git commit/push workflow. Main delivery uses the protected PR path.

Architecture drift audit against the actual remote baseline found no changes to `apps/`, `services/`, `packages/`, workers, GIS pipelines or migrations. New files are test harness/configuration and governance documentation. No runtime/domain exception was needed. UNKNOWN, CRS/provenance, verification, immutable geometry/releases, publication, public DTOs, database isolation and security boundaries remain unchanged.

Phase 0 runtime/domain architecture changed? **NO**.

Phase 1 started? **NO**. This handoff authorizes no Phase 1 features or marketplace work.
