import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DeploymentConfig,
  deploymentConfig,
  deploymentOrigin,
} from "../packages/config/src/deployment";
import { checkOrigin, handle } from "../services/api/src/http";
import { database } from "../services/api/src/db";

const local = {
  SERVER_ORIGIN: "http://127.0.0.1:3000",
  DATABASE_URL: "postgresql://land_app:fixture@127.0.0.1/land",
};
const staging = {
  ...local,
  LAND_ENVIRONMENT: "STAGING",
  SERVER_ORIGIN: "https://staging.example.invalid",
  OBJECT_STORE_DRIVER: "s3",
  OBJECT_STORE_ENDPOINT: "https://storage.example.invalid",
  OBJECT_STORE_REGION: "test",
  OBJECT_STORE_ACCESS_KEY_ID: "synthetic-key",
  OBJECT_STORE_SECRET_ACCESS_KEY: "synthetic-secret",
  PRIVATE_BUCKET: "land-private",
  PUBLISHED_BUCKET: "land-published",
  PUBLIC_ASSET_BASE_URL: "https://assets.example.invalid",
};
const preview = {
  LAND_ENVIRONMENT: "PREVIEW",
  SERVER_ORIGIN: "https://land-123.vercel.app",
  VERCEL_ENV: "preview",
  VERCEL_URL: "land-123.vercel.app",
  LAND_PREVIEW_ENABLED: "true",
};
afterEach(() => vi.unstubAllEnvs());

describe("deployment authority and environment isolation", () => {
  it("supports local defaults and explicit staging/production without leaking unknown fields", () => {
    expect(deploymentConfig(local)).toMatchObject({
      LAND_ENVIRONMENT: "LOCAL",
      SIGNED_UPLOAD_TTL_SECONDS: 300,
      IMPORT_RETENTION_DAYS: 7,
    });
    expect(deploymentConfig(staging).LAND_ENVIRONMENT).toBe("STAGING");
    expect(
      deploymentConfig({
        ...staging,
        LAND_ENVIRONMENT: "PRODUCTION",
        VERCEL_ENV: "production",
      }).LAND_ENVIRONMENT,
    ).toBe("PRODUCTION");
    expect(
      deploymentConfig({ ...local, unexpected: "private" }),
    ).not.toHaveProperty("unexpected");
  });
  it.each([
    { ...staging, OBJECT_STORE_ENDPOINT: "malformed-private-value" },
    { ...staging, PUBLIC_ASSET_BASE_URL: "invalid-url" },
    { ...staging, SERVER_ORIGIN: "invalid-origin" },
    { ...local, SERVER_ORIGIN: "https://remote.example.invalid" },
    { ...local, VERCEL: "1" },
    { ...staging, SERVER_ORIGIN: "http://127.0.0.1:3000" },
    { ...staging, OBJECT_STORE_DRIVER: "local" },
    { ...staging, PRIVATE_BUCKET: "land-published" },
    { ...staging, OBJECT_STORE_SECRET_ACCESS_KEY: undefined },
    {
      ...staging,
      OBJECT_STORE_ENDPOINT: "https://user:pass@storage.example.invalid",
    },
    { ...staging, OBJECT_STORE_ENDPOINT: "http://storage.example.invalid" },
    { ...staging, SIGNED_UPLOAD_TTL_SECONDS: "601" },
    { ...staging, SIGNED_UPLOAD_TTL_SECONDS: "0" },
    { ...staging, IMPORT_RETENTION_DAYS: "8" },
    { ...staging, VERCEL_ENV: "preview" },
    { ...preview, LAND_PREVIEW_ENABLED: "false" },
    { ...preview, VERCEL_URL: "other.vercel.app" },
    { ...preview, DATABASE_URL: local.DATABASE_URL },
    { ...preview, OBJECT_STORE_SECRET_ACCESS_KEY: "synthetic" },
  ])("rejects unsafe environment combinations %#", (input) => {
    expect(DeploymentConfig.safeParse(input).success).toBe(false);
  });
  it("allows build/UI preview with no mutation credentials and denies DB access before pool creation", () => {
    expect(deploymentConfig(preview).DATABASE_URL).toBeUndefined();
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("DATABASE_URL", local.DATABASE_URL);
    expect(() => database()).toThrow("preview database access disabled");
  });
  it.each([
    "https://*.vercel.app",
    "https://user:pass@staging.example.invalid",
    "https://staging.example.invalid/path",
    "https://staging.example.invalid?x=1",
    "https://staging.example.invalid#x",
  ])("rejects non-exact configured origin %s", (origin) => {
    expect(() =>
      deploymentOrigin({ ...staging, SERVER_ORIGIN: origin }),
    ).toThrow("values suppressed");
  });
  it("accepts only the exact staging Origin regardless of Host/forwarded headers", () => {
    vi.stubEnv("LAND_ENVIRONMENT", "STAGING");
    vi.stubEnv("SERVER_ORIGIN", staging.SERVER_ORIGIN);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("LAND_PREVIEW_ENABLED", "false");
    expect(() =>
      checkOrigin(
        new Request(staging.SERVER_ORIGIN, {
          headers: { origin: staging.SERVER_ORIGIN },
        }),
      ),
    ).not.toThrow();
    for (const origin of [
      "https://evil.vercel.app",
      "https://staging.example.invalid.evil.invalid",
      "null",
      "",
    ]) {
      expect(() =>
        checkOrigin(
          new Request(staging.SERVER_ORIGIN, {
            headers: {
              origin,
              host: "staging.example.invalid",
              "x-forwarded-host": "staging.example.invalid",
            },
          }),
        ),
      ).toThrow("Nguồn yêu cầu");
    }
  });
  it("returns safe configuration failures without serializing secrets", async () => {
    vi.stubEnv("LAND_ENVIRONMENT", "STAGING");
    vi.stubEnv(
      "SERVER_ORIGIN",
      "https://secret-user:secret-password@host.invalid",
    );
    const request = new Request("https://host.invalid", { method: "POST" });
    const response = await handle(request, async () => {
      checkOrigin(request);
      return Response.json({ ok: true });
    });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret-password");
    expect(() =>
      deploymentConfig({
        ...staging,
        SIGNED_UPLOAD_TTL_SECONDS: "secret-password",
      }),
    ).toThrow("values suppressed");
  });
});
