import { describe, expect, it } from "vitest";
import { makeSlug, SafeUrl } from "../packages/domain/src/index";
import {
  AoiSchema,
  parseCoordinates,
} from "../packages/spatial-types/src/index";
import {
  assertVerificationTransition,
  effectiveVerification,
  publicationErrors,
  unknownVerification,
  VerificationSchema,
} from "../packages/verification/src/index";
const aoi = AoiSchema.parse({
  name: "Test AOI",
  version: "test-1",
  source: "Synthetic test boundary",
  updatedAt: "2026-01-01T00:00:00Z",
  outsidePolicy: "WARNING",
  vertices: [
    { longitude: 104, latitude: 21 },
    { longitude: 105, latitude: 21 },
    { longitude: 105, latitude: 22 },
    { longitude: 104, latitude: 22 },
    { longitude: 104, latitude: 21 },
  ],
});
describe("coordinate accuracy boundaries", () => {
  it("preserves named latitude and longitude at supplied precision", () => {
    expect(
      parseCoordinates(" 21.26254175667024 , 104.53036202410956 ", aoi),
    ).toMatchObject({
      position: { latitude: 21.26254175667024, longitude: 104.53036202410956 },
      issues: [],
    });
  });
  it.each(["", null, "bad", "21,104,12", "NaN, 104", "91, 181"])(
    "rejects invalid coordinate %s",
    (input) =>
      expect(parseCoordinates(input).issues[0]?.severity).toBe("INVALID"),
  );
  it("does not swap reversed coordinates", () =>
    expect(parseCoordinates("104.53,21.26", aoi)).toMatchObject({
      position: null,
      candidate: { latitude: 21.26, longitude: 104.53 },
      issues: [{ code: "AMBIGUOUS_COORDINATE_ORDER" }],
    }));
  it("flags two valid coordinate orders", () =>
    expect(parseCoordinates("21,22").issues[0]?.code).toBe(
      "AMBIGUOUS_COORDINATE_ORDER",
    ));
  it("honors outside AOI policy", () =>
    expect(
      parseCoordinates("20,104", { ...aoi, outsidePolicy: "INVALID" })
        .issues[0],
    ).toMatchObject({ code: "OUTSIDE_AOI", severity: "INVALID" }));
});
describe("trust and publication", () => {
  it("does not upgrade unknown on read", () =>
    expect(effectiveVerification(unknownVerification(), new Date())).toBe(
      "UNKNOWN",
    ));
  it("rejects verification without evidence", () =>
    expect(
      VerificationSchema.safeParse({
        ...unknownVerification(),
        status: "VERIFIED",
      }).success,
    ).toBe(false));
  it("requires a verifier permission", () =>
    expect(() =>
      assertVerificationTransition(
        unknownVerification(),
        new Set(["edit"]),
        new Date(),
      ),
    ).toThrow("FORBIDDEN"));
  it("preserves expiry", () =>
    expect(
      effectiveVerification(
        {
          ...unknownVerification(),
          status: "DECLARED",
          expiresAt: "2025-01-01T00:00:00Z",
          freshnessPolicy: "EXPIRES",
        },
        new Date("2026-01-01"),
      ),
    ).toBe("EXPIRED"));
  it("allows explicitly reviewed UNKNOWN under the documented policy", () =>
    expect(
      publicationErrors({
        name: "A",
        slug: "a",
        hasGeometry: true,
        categoryCount: 1,
        sourceRecordId: "s",
        verificationStatus: "UNKNOWN",
        sourceDisplayAllowed: true,
        blockingErrors: 0,
        reviewed: true,
      }),
    ).toEqual([]));
  it("blocks absent geometry and implicit review", () =>
    expect(
      publicationErrors({
        name: "A",
        slug: "a",
        hasGeometry: false,
        categoryCount: 0,
        sourceRecordId: null,
        verificationStatus: "UNKNOWN",
        sourceDisplayAllowed: false,
        blockingErrors: 1,
        reviewed: false,
      }),
    ).toContain("GEOMETRY_REQUIRED"));
  it("normalizes Vietnamese search without guessing data", () =>
    expect(makeSlug("Đỉnh Tà Xùa")).toBe("dinh-ta-xua"));
  it.each([
    "javascript:alert(1)",
    "http://example.com",
    "https://user:pass@example.com",
  ])("rejects unsafe URL %s", (url) =>
    expect(SafeUrl.safeParse(url).success).toBe(false),
  );
});
