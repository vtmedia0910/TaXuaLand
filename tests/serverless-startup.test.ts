import { afterEach, expect, it, vi } from "vitest";
import { register } from "../apps/web/instrumentation";

const mocks = vi.hoisted(() => ({
  database: vi.fn(() => "runtime-pool"),
  ready: vi.fn(),
}));
vi.mock("../services/api/src/db", () => ({ database: mocks.database }));
vi.mock("../services/api/src/database-readiness", () => ({
  assertRuntimeDatabase: mocks.ready,
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("build has no database side effects", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-build");
  await register();
  expect(mocks.database).not.toHaveBeenCalled();
});
it("preview validates exact origin and rejects injected write credentials before connecting", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-server");
  vi.stubEnv("LAND_ENVIRONMENT", "PREVIEW");
  vi.stubEnv("LAND_PREVIEW_ENABLED", "true");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_URL", "land-qa.vercel.app");
  vi.stubEnv("SERVER_ORIGIN", "https://land-qa.vercel.app");
  vi.stubEnv("DATABASE_URL", undefined);
  await register();
  expect(mocks.database).not.toHaveBeenCalled();
  vi.stubEnv("DATABASE_URL", "postgresql://synthetic@localhost/land");
  await expect(register()).rejects.toThrow("configuration");
  expect(mocks.database).not.toHaveBeenCalled();
});
it("runtime awaits the database authority gate and propagates failure", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("NEXT_PHASE", "phase-production-server");
  vi.stubEnv("LAND_ENVIRONMENT", "LOCAL");
  vi.stubEnv("SERVER_ORIGIN", "http://127.0.0.1:3000");
  vi.stubEnv("DATABASE_URL", "postgresql://synthetic@localhost/land");
  await register();
  expect(mocks.ready).toHaveBeenCalledWith("runtime-pool");
  mocks.ready.mockRejectedValueOnce(new Error("readiness refused"));
  await expect(register()).rejects.toThrow("readiness refused");
});
