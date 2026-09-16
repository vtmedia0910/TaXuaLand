import { it, expect } from "vitest";
import { ProviderDiagnostic } from "../services/api/src/registry";
import { SourceSchema } from "../packages/provenance/src/index";
it("removes provider credentials and payloads from diagnostics", () => {
  const safe = ProviderDiagnostic.parse({
    id: "terrain",
    type: "TERRAIN",
    enabled: true,
    credentialStatus: "CONFIGURED",
    healthStatus: "UNKNOWN",
    lastCheckedAt: null,
    killSwitch: false,
    apiKey: "must-not-leak",
    rawProviderBody: { secret: "must-not-leak" },
  });
  expect(JSON.stringify(safe)).not.toContain("must-not-leak");
});
it("does not accept source registration without explicit license permissions", () => {
  expect(
    SourceSchema.safeParse({
      id: crypto.randomUUID(),
      name: "Some source",
      authorityLevel: "OFFICIAL",
    }).success,
  ).toBe(false);
});
it("defaults unreviewed Source governance without fabricating approval", () => {
  const source = SourceSchema.parse({
    id: crypto.randomUUID(),
    name: "Unreviewed source",
    providerId: null,
    category: "PLACES",
    authorityLevel: "UNKNOWN",
    licenseName: null,
    licenseReference: null,
    commercialUse: "UNKNOWN",
    publicDisplay: "UNKNOWN",
    caching: "UNKNOWN",
    derivatives: "UNKNOWN",
    redistribution: "UNKNOWN",
    legalReviewedAt: null,
    sourceCrs: "UNKNOWN",
    freshnessClass: "UNKNOWN",
    status: "REVIEW_REQUIRED",
    lastCheckedAt: null,
  });
  expect(source.sourceAcceptance).toBeNull();
  expect(source.providerRightsStatus).toBe("UNKNOWN");
  expect(
    SourceSchema.parse({
      ...source,
      sourceAcceptance: "OWNER_APPROVED",
      providerRightsStatus: "REVIEW_REQUIRED",
    }),
  ).toMatchObject({
    sourceAcceptance: "OWNER_APPROVED",
    providerRightsStatus: "REVIEW_REQUIRED",
  });
});
