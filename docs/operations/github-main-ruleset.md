# Main protection

Actual GitHub ruleset: [protect-main / 22535774](https://github.com/vtmedia0910/TaXuaLand/rules/22535774). Created and re-read through the repository rulesets API on 2026-09-08. The effective `/rules/branches/main` endpoint independently returned all four rules below with this ruleset ID.

| Setting | Effective configuration |
| --- | --- |
| Enforcement / target | `active` / branch `refs/heads/main`, no exclusions |
| Force push | Blocked by `non_fast_forward` |
| Branch deletion | Blocked by `deletion` |
| Pull request | Required; 0 approving reviews for practical solo-owner operation |
| Review conversations | Must be resolved; stale approvals dismissed on push |
| Required checks | `check`, `e2e-core` |
| Check producer | GitHub Actions application ID `15368` for both checks |
| Up-to-date checks | Strict; PR must be tested with current base |
| Bypass actors | Empty; no normal Codex/admin always-bypass |

Normal workflow: branch → logical commits → push → PR → both checks pass → merge. No force update or direct-main API workaround is permitted for normal delivery. Rule maintenance is an explicit owner governance action, not an implicit exception to CI or PR requirements. Architectural changes additionally require the [freeze ADR approval gate](phase-0-architecture-freeze.md); zero required PR reviews does not waive it.

Exact check names and producer IDs were read from GitHub check runs after [push CI](https://github.com/vtmedia0910/TaXuaLand/actions/runs/34220866121) and [PR CI](https://github.com/vtmedia0910/TaXuaLand/actions/runs/34220891895) passed on `d40f8e87fb9b53d3d85f1c99d0361f90138343da`. Browser logs confirm nine actual Core tests and disposable resource cleanup. Failure summary upload is skipped on success by design.

Verification uses read-only API inspection of active effective rules; no destructive force-push or deletion probe against `main` was attempted. See [GitHub rules API](https://docs.github.com/en/rest/repos/rules) for the configuration model.
