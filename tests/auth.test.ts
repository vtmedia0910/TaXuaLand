import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  requirePermission,
} from "../services/api/src/auth";
import { checkOrigin, jsonInput } from "../services/api/src/http";
import { RuntimeEnvironment } from "../packages/config/src/runtime";
it("runtime accepts loopback QA but requires HTTPS and rejects URL credentials for remote origins", () => {
  const base = {
    DATABASE_URL: "postgresql://user:placeholder@localhost/land",
    SERVER_ORIGIN: "http://127.0.0.1:3000",
    LAND_WORKSPACE_ROOT: "/land",
  };
  expect(RuntimeEnvironment.safeParse(base).success).toBe(true);
  for (const origin of [
    "http://land.example",
    "https://user:secret@land.example",
    "https://land.example/path",
    "https://land.example?token=test",
  ])
    expect(
      RuntimeEnvironment.safeParse({ ...base, SERVER_ORIGIN: origin }).success,
    ).toBe(false);
});
it("hashes passwords with a random salt and rejects wrong credentials", async () => {
  const hash = await hashPassword("QA-only-long-password");
  expect(hash).not.toContain("QA-only");
  expect(await verifyPassword("QA-only-long-password", hash)).toBe(true);
  expect(await verifyPassword("incorrect", hash)).toBe(false);
  expect(await verifyPassword("incorrect", null)).toBe(false);
});
it("does not give editors verifier permissions", () => {
  expect(() =>
    requirePermission(
      {
        id: randomUUID(),
        email: "test@example.invalid",
        permissions: new Set(["read", "edit"]),
        correlationId: randomUUID(),
      },
      "verify",
    ),
  ).toThrow();
});
it("rejects cross-origin writes", () => {
  expect(() =>
    checkOrigin(
      new Request("http://localhost:3000/api/admin/places", {
        headers: { origin: "https://attacker.invalid" },
      }),
    ),
  ).toThrow();
});
it("enforces streamed request limits", async () => {
  await expect(
    jsonInput(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"value":"large"}',
      }),
      4,
    ),
  ).rejects.toThrow("giới hạn");
});
