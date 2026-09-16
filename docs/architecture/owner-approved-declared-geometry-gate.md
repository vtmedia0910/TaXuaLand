# Owner-approved declared geometry gate design

Status: `LOCALLY IMPLEMENTED / NOT DEPLOYED`
Decision authority: [ADR-010](../adr/ADR-010-separate-operational-source-acceptance-from-provider-rights-review.md)
Production mutations: `NONE`

## Model-fit result

The approved state cannot be represented truthfully by the current schema:

| Required concept       | Current field                                              | Why it does not fit                                                                                                         |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Source acceptance      | none                                                       | `sources.status` is operational availability/review (`ACTIVE`, `DISABLED`, `REVIEW_REQUIRED`), not owner/source acceptance. |
| Provider rights review | five `permission_status` fields                            | They contain only `ALLOWED`, `DENIED`, and `UNKNOWN`; they cannot retain the distinct `REVIEW_REQUIRED` state.              |
| Geometry role          | `place_geometries.location_role`                           | Already fits `DECLARED`, `OBSERVED`, and `VERIFIED`.                                                                        |
| Verification           | `place_geometries.verification_status` and evidence fields | Already fits; `UNKNOWN` is valid and independent.                                                                           |
| Accuracy               | `place_geometries.horizontal_accuracy_m`                   | Already fits; `NULL` truthfully means unknown.                                                                              |

Using `sources.notes`, `authority_level`, or an overloaded `status` would make an enforceable publication decision depend on the wrong concept or unstructured text. Migration 015 implements the approved independent fields without changing those existing meanings.

## Implemented schema

Add two structured Source fields:

- nullable `source_acceptance` with allowed values `OWNER_APPROVED`, `SOURCE_APPROVED`, and `REJECTED`; `NULL` means no recorded acceptance decision and is not a fourth approval state;
- non-null `provider_rights_status` with allowed values `ALLOWED`, `RESTRICTED`, `REVIEW_REQUIRED`, and `UNKNOWN`, initially `UNKNOWN` unless evidence supports a stronger value.

No owner/source approval is inferred for existing rows. A later evidence-based governed decision may record `RESTRICTED` from an applicable denied geometry right or `ALLOWED` from a complete applicable rights review, but it must not manufacture `REVIEW_REQUIRED` or approval decisions.

Geometry and content must use appropriately scoped Source records. Owner acceptance of a coordinate Source must not authorize names, descriptions, media, routes, access, or safety material stored under another Source.

## Implemented predicate change

Keep the existing centralized public Place predicate and split only its Source checks:

- Content Source and child media/content Sources: unchanged strict `public_display='ALLOWED'`, active/unarchived Source and record, and provider enabled/not killed.
- Current-geometry Source: retain active/unarchived Source and record plus provider checks; block `source_acceptance='REJECTED'` and `provider_rights_status='RESTRICTED'`; then accept either the existing strict `public_display='ALLOWED'` path or `source_acceptance IN ('OWNER_APPROVED','SOURCE_APPROVED')` with provider rights `ALLOWED`, `REVIEW_REQUIRED`, or `UNKNOWN`.

All publication, review, archive, category, current-geometry, finite-coordinate, AOI, provenance, and privacy conditions remain unchanged. Verification and accuracy do not become eligibility shortcuts.

Terrain, imagery, roads, Dataset/Release publication, export, redistribution, caching, descriptions, media, routes, access, and safety paths do not use this exception.

## Data and current-geometry handling

For the Google-origin geometry Source used by the approved cases, a governed record may state:

```text
source_acceptance = OWNER_APPROVED
provider_rights_status = REVIEW_REQUIRED
public_display = UNKNOWN
location_role = DECLARED
verification_status = UNKNOWN
horizontal_accuracy_m = NULL
```

`public_display` is not changed to `ALLOWED`. No verification or accuracy is inferred.

For Cây Cô Đơn Tà Xùa, retain both provenance paths. One current `place_geometries` row remains authoritative; the OSM evidence remains a governed replacement candidate until the owner explicitly selects it through the normal append-only geometry-history workflow. This task selects neither coordinate and performs no data mutation.

## Local disposable dry run

Assuming genuine finite coordinates, accepted Place identity, active/unarchived Source records, AOI pass, categories, review completion, and publication status:

| Candidate path                                                                                                           | Geometry-specific result                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Ten Google-origin cases: `OWNER_APPROVED`, `DECLARED`, verification `UNKNOWN`, accuracy `NULL`, rights `REVIEW_REQUIRED` | `10/10` eligible under the approved future gate                               |
| Cây Cô Đơn current owner-approved path                                                                                   | eligible if explicitly retained as current geometry                           |
| Cây Cô Đơn OSM `ALLOWED` path                                                                                            | eligible through the existing strict rights path if explicitly selected later |

The executable dry run used the eleven genuine coordinates in the ignored owner test packet and a disposable loopback PostGIS database. Ten Google-origin cases and the owner-approved current-coordinate path for Cây Cô Đơn used `OWNER_APPROVED` plus `REVIEW_REQUIRED`; Cây Cô Đơn's separate OSM SourceRecord remained present as an unselected replacement candidate. The run returned operational declared geometry `11/11`, verification `UNKNOWN` `11/11`, and horizontal accuracy `NULL` `11/11`. The temporary runner and disposable database were removed.

This is local test evidence, not a production publication count. Current production publication count was not inspected and remains `UNKNOWN`.

## Implementation verification

Disposable loopback PostGIS tests cover pre-015 upgrade compatibility, fresh schema defaults, owner/source-approved geometry paths, strict-path compatibility, rejection/restriction, current geometry, AOI, inactive/archive/review/publication gates, public DTO privacy, and unresolved content/media/access/safety/reference exclusion. Focused ADR-010 tests pass 36/36. The interrupted run recorded a full 196/196 pass; resumed full-suite attempts reached 195/196 before a test-shell configuration error and 192/196 before an unrelated parallel PostGIS hook timeout, with the affected serverless 3/3 and roads 4/4 suites passing in isolation. Lint, all TypeScript projects, targeted formatting, and secret scan pass.

The current Next production build, static generation, and 68 client-chunk syntax checks pass. The final 793-entry server-artifact cold parse hits the pre-existing import-worker `IMPORT_TIMEOUT` (`PRE_EXISTING_ENVIRONMENTAL`; ADR-010 causal: no). Two complete Core E2E runs each pass 13/14 and fail the public-place journey only under full-suite load (`ENVIRONMENT_RESOURCE_CONTENTION`; ADR-010 causal: no); its focused rerun passes 1/1. These checks are not reported as green, but both blockers are unrelated to ADR-010 and out of scope for this branch.
