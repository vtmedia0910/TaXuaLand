# Phase 0.5-H provider acceptance

Final provider conclusion: **PASS**

The deployed LAND application checks, independent Linux R2 lifecycle checks, public delivery integrity, cleanup, and deployed credential-separation gate passed. No Phase 1 work or authoritative dataset, release, Place, verification, Property, or business-data mutation was performed.

## Acceptance identity

- Evidence recorded: 2026-09-11 (Asia/Bangkok, UTC+07:00).
- Tested branch: `feat/phase-0-5-production-deployment`.
- Tested source SHA: `fb81e012c59d880a2b4b2e48e035c6cf6332f053`.
- Deployed LAND project: `ta-xua-land-web`.
- Independent execution environment: ephemeral Linux Docker container, `node:24-bookworm`, removed with `--rm`.
- Diagnostic scope: one synthetic object under `diagnostics/<uuid>.json`; the exact UUID was not retained in the sanitized owner evidence.
- TLS certificate verification remained enabled.
- No credentials, credential hashes, signed URLs, authorization headers, or secret values were included in the evidence or this report.

The provider acceptance supplements the already recorded Vercel homepage, Admin authentication, authenticated diagnostics, LAND database access, logout, and session-invalidation PASS evidence gathered against the same source SHA.

## Independent Linux Docker R2 acceptance

| Gate | Result | Evidence |
| --- | --- | --- |
| Private PUT | PASS | Synthetic diagnostic object only |
| Private HEAD | PASS | Object metadata/readability confirmed |
| Private GET | PASS | Authenticated readback completed |
| Private exact bytes | PASS | Download matched uploaded bytes |
| Private SHA-256 | PASS | Download digest matched expected digest |
| Private DELETE | PASS | Diagnostic object deleted |
| Private cleanup | PASS | Post-delete absence confirmed |
| Published operator PUT | PASS | Separate scoped operator credential used |
| Published operator HEAD | PASS | Object readability confirmed |
| Published operator GET | PASS | Authenticated readback completed |
| Published operator exact bytes | PASS | Download matched uploaded bytes |
| Published operator SHA-256 | PASS | Download digest matched expected digest |
| Anonymous public GET | PASS | Published object fetched without credentials |
| Public HTTP status | PASS | HTTP 200 |
| Public exact bytes | PASS | Public response matched uploaded bytes |
| Public SHA-256 | PASS | Public response digest matched expected digest |
| Published DELETE | PASS | Diagnostic object deleted |
| Published cleanup | PASS | Post-delete absence confirmed |

The private and published credentials were separate scoped pairs. Each pair was mapped to the repository's generic `OBJECT_STORE_ACCESS_KEY_ID` and `OBJECT_STORE_SECRET_ACCESS_KEY` names only in its corresponding diagnostic process. Environment forwarding did not place secret values literally in Docker command arguments, generated files, logs, or source.

## Historical Windows transport evidence

The earlier Windows client path remains recorded as a TLS negotiation failure before any R2 S3 HTTP response:

- S3 SDK probes returned transport-level TLS errors for private and published diagnostic paths.
- An unsigned Node endpoint probe returned an SSL/TLS handshake failure.
- An independent Windows native HTTPS probe also failed TLS negotiation.
- Published public delivery remained reachable on that Windows path, but returned HTTP 404 because the preceding authenticated upload had not succeeded.

This is historical client/network-path evidence, not an unresolved provider blocker. The independent Linux Docker run completed both authenticated R2 lifecycles and anonymous public byte-integrity verification with normal TLS verification.

Two diagnostic keys from the failed Windows attempt were previously recorded:

- `diagnostics/a2cc8ff1-fe2e-4f35-bb06-e3e62bc8037e.json`
- `diagnostics/ae590a7b-bfde-485a-9058-a3bf44b8d110.json`

The failed Windows path could not authenticate their absence. It also observed no successful creation, and public delivery returned 404. That historical limitation does not alter the successful cleanup evidence for the later Linux diagnostic object.

## Deployed credential separation

Result: **PASS**

Evidence source: **OWNER PROVIDER-CONFIGURATION ATTESTATION**, supplied 2026-09-11 after checking the deployed provider configuration.

The owner attested that:

- the deployed LAND project is `ta-xua-land-web`;
- web-runtime `OBJECT_STORE_ACCESS_KEY_ID` and `OBJECT_STORE_SECRET_ACCESS_KEY` correspond only to the scoped private R2 runtime credential;
- the published R2 operator credential is absent from the web runtime;
- the database owner/bootstrap credential is absent from the web runtime;
- the provider/account master credential is absent from the web runtime; and
- the attestation contains no secret values.

This is configuration attestation, not disclosure of credential values. Published operator authority remains separate from the deployed web runtime.

## Scope and conclusion

Provider configuration was not changed. No source/runtime code was changed for this closeout. PostGIS remains spatial authority; object storage remains artifact storage; Dataset and Release authority boundaries remain intact. The Linux result closes the earlier transport-dependent R2 gap, and the owner attestation closes the deployed credential-separation gate.

All mandatory Phase 0.5-H provider acceptance gates are satisfied. Final provider conclusion: **PASS**.
