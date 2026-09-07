# Public place read boundary

Public routes call `public-places.ts`, never administrative read services. Parameterized SQL projects an explicit field allowlist and Zod validates every response. Both content and geometry sources must be active, unarchived and explicitly allow public display. Child media, references, access and safety sections are separately filtered by their own source rights. Drafts, archived places, pending review and missing geometry/categories fail closed.

Content source authority does not verify coordinates. Location trust includes its own source, verification, accuracy and freshness; content with no evidence stays UNKNOWN. Expired recorded verification is exposed as EXPIRED without rewriting history. Public query pagination is bounded; wildcard input is escaped and Vietnamese names are normalized by PostgreSQL unaccent.

The client uses cancellable TanStack Query requests. List/detail state remains separate from Cesium lifecycle. Selection flies to a bounding sphere around the actual point, highlights its marker, opens the detail panel and updates a shareable query parameter. Standalone detail pages use the same public service. WebGL failure leaves search and detail available.

Browser QA creates an explicitly authored synthetic fixture in the isolated LAND database and archives it afterward. These tests establish application behavior, never factual verification of a real location.
