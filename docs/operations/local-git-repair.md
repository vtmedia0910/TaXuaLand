# Local Git ACL diagnosis — blocked

Workspace inspected on 2026-09-08: `C:\Users\ADMIN\Documents\Codex\TaXuaLand`, Windows, running as `CodexSandboxOffline`. Both the workspace and `.git` are owned by that sandbox account. Parent workspace ACL permits modification, while `.git` contains explicit Deny entries for sandbox security principals covering writes/deletes and inherited child metadata. No stale `.git/*.lock` was found in the recursive inspection. Antivirus involvement has not been established; it must not be inferred.

The session granted write access to the repo and directly to `.git`. The owner also confirmed reopening the repo and authorized writes. Nevertheless the actual sandbox continued to reject:

```text
git update-ref refs/heads/acl-write-test HEAD
Unable to create .../.git/refs/heads/acl-write-test.lock: Permission denied

git fetch origin --prune
error: cannot open '.git/FETCH_HEAD': Permission denied
```

No temporary ref was created. No ACL Deny was removed from inside the sandbox, ownership was not taken over, and no world-writable access was granted. No `.git` deletion, re-clone over the worktree or destructive reset was performed. Source files were not changed for ACL repair.

## Preserved state

At hardening start, GitHub `main` was `a93d0db9045181c9a972891f8d9d4fc7707ae6cb`, exactly the audited baseline. All 230 baseline file contents matched GitHub after the repository's LF normalization. Local `HEAD` and cached `origin/main` remained `978bd9f633e094f29d6f5af4aa517991513cfc79`; apparent changes include previously delivered Phase 0 commits plus the explicitly reviewed hardening work.

Hardening commits use parent-checked, non-force Git Data API updates to `chore/pre-phase-1-hardening`, followed by a PR. This preserves delivery without pretending local Git was repaired. The accepted normal local branch/commit/fetch workflow remains **BLOCKED** until actual writes succeed. Do not start Phase 1 on the strength of this workaround.

## Smallest owner/environment action

Restore the Codex workspace's effective `.git` write permission from outside the affected sandbox, with TaXuaLand itself selected as the task workspace. Reopening a folder or a textual authorization alone is insufficient unless the active permission profile/ACL actually changes. Preserve existing files and ACL evidence; do not broadly clear ACLs or grant Everyone write access. If the sandbox reapplies Deny, resolve its workspace policy rather than repeatedly deleting its enforcement entries.

Then run the temporary-ref create/delete test, fetch and inspect status/HEAD/origin-main. Only mark PASS after both ref writes and fetch succeed.

Before reconciling metadata, compare every local delivered file against the fetched remote tree, including untracked files, and preserve any local-only changes. Prove the local main is an ancestor of remote main. A clean behind-only tree can fast-forward normally. If the files already contain the delivered commits but metadata lags, reconcile only index/ref metadata under a reviewed, non-destructive procedure; never use `reset --hard` to conceal differences. Stop if any content comparison is ambiguous.

Finally record local HEAD, fetched origin/main, working-tree status, the narrow permission change and a successful normal branch/commit/push operation. Documentation and API delivery do not satisfy this acceptance gate.
