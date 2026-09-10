import { randomUUID } from "node:crypto";
import {
  mkdtemp,
  readFile,
  rm,
  symlink,
  mkdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalFilesystemObjectStore } from "../services/api/src/storage/local-object-store";
import { S3CompatibleObjectStore } from "../services/api/src/storage/s3-object-store";
import {
  importObjectKey,
  publishedObjectKey,
  diagnosticObjectKey,
  sha256,
  XLSX_TYPE,
  MAX_OBJECT_BYTES,
  type ObjectStore,
  type PutObjectInput,
} from "../services/api/src/storage/object-store";

const bytes = Buffer.from(
  "synthetic storage transport fixture; parser validation belongs to finalize",
);
const input = (): PutObjectInput => ({
  key: importObjectKey(randomUUID(), "raw"),
  bytes,
  size: bytes.length,
  sha256: sha256(bytes),
  contentType: XLSX_TYPE,
});
let root: string, server: Server, endpoint: string;
const objects = new Map<
  string,
  { bytes: Buffer; type: string; hash: string; cache: string }
>();
let mode: "normal" | "unavailable" | "corrupt" | "oversized" = "normal";
const requests: Array<{
  method: string;
  path: string;
  conditional: string | undefined;
}> = [];
// A deterministic S3 HTTP protocol fixture, not a cloud provider or an IAM/SigV4 verifier.
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "land-storage-test-"));
  server = createServer(async (req, res) => {
    const url = new URL(req.url!, "http://fixture.invalid");
    requests.push({
      method: req.method!,
      path: url.pathname,
      conditional: req.headers["if-none-match"],
    });
    if (mode === "unavailable") {
      res.writeHead(403);
      res.end("provider-secret-signature-do-not-leak");
      return;
    }
    if (
      !req.headers.authorization &&
      !url.searchParams.has("X-Amz-Signature")
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    const prior = objects.get(url.pathname);
    if (req.method === "PUT") {
      if (prior && req.headers["if-none-match"] === "*") {
        res.writeHead(412);
        res.end();
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      objects.set(url.pathname, {
        bytes: Buffer.concat(chunks),
        type: String(req.headers["content-type"]),
        hash: String(req.headers["x-amz-meta-sha256"]),
        cache: String(req.headers["cache-control"]),
      });
      res.writeHead(200, { etag: '"fixture-etag"' });
      res.end();
      return;
    }
    if (req.method === "DELETE") {
      objects.delete(url.pathname);
      res.writeHead(204);
      res.end();
      return;
    }
    if (!prior) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      "content-length":
        mode === "oversized" ? MAX_OBJECT_BYTES + 1 : prior.bytes.length,
      "content-type": prior.type,
      "x-amz-meta-sha256": prior.hash,
    });
    res.end(
      req.method === "HEAD"
        ? undefined
        : mode === "corrupt"
          ? Buffer.alloc(prior.bytes.length)
          : prior.bytes,
    );
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  endpoint = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(async () => {
  server?.closeAllConnections();
  await new Promise<void>((done) => server?.close(() => done()));
  // Only the unique directory created by this suite is removed.
  if (root && resolve(root).startsWith(resolve(tmpdir()) + requireSeparator()))
    await rm(root, { recursive: true, force: true });
});
function requireSeparator() {
  return process.platform === "win32" ? "\\" : "/";
}
const env = () => ({
  LAND_ENVIRONMENT: "LOCAL",
  SERVER_ORIGIN: "http://127.0.0.1:3000",
  DATABASE_URL: "postgresql://qa:synthetic@127.0.0.1/land",
  OBJECT_STORE_DRIVER: "s3",
  OBJECT_STORE_ENDPOINT: endpoint,
  OBJECT_STORE_REGION: "auto",
  OBJECT_STORE_ACCESS_KEY_ID: "synthetic-access-key",
  OBJECT_STORE_SECRET_ACCESS_KEY: "synthetic-secret-key",
  PRIVATE_BUCKET: "land-private",
  PUBLISHED_BUCKET: "land-published",
  PUBLIC_ASSET_BASE_URL: "https://assets.example.invalid",
});

for (const driver of ["local", "s3"] as const)
  describe(`${driver} object store contract`, () => {
    let store: ObjectStore;
    beforeAll(() => {
      store =
        driver === "local"
          ? new LocalFilesystemObjectStore(join(root, "private"), "private")
          : new S3CompatibleObjectStore(env(), "private");
    });
    afterAll(() => {
      if (store instanceof S3CompatibleObjectStore) store.close();
    });
    it("writes, heads, reads, refuses replacement and deletes idempotently", async () => {
      const object = input();
      expect(await store.head(object.key)).toBeNull();
      await expect(store.get(object.key)).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
      const { bytes: unused, ...metadata } = object;
      void unused;
      expect(await store.put(object)).toEqual(metadata);
      expect(await store.head(object.key)).toEqual(metadata);
      expect((await store.get(object.key)).bytes).toEqual(bytes);
      await expect(store.put(object)).rejects.toMatchObject({
        code: "CONFLICT",
      });
      await store.delete(object.key);
      await store.delete(object.key);
      expect(await store.head(object.key)).toBeNull();
    });
    it("permits exactly one concurrent writer", async () => {
      const object = input();
      const results = await Promise.allSettled([
        store.put(object),
        store.put(object),
      ]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect((await store.get(object.key)).sha256).toBe(object.sha256);
    });
    it.each([
      "../outside.xlsx",
      "%2e%2e/private.xlsx",
      "imports/raw/../../outside.xlsx",
      "C:\\secret.xlsx",
      "https://evil.invalid/file.xlsx",
      "imports/raw/arbitrary.xlsx",
      "imports/raw/a/../../a",
      "diagnostics/CON.json",
    ])("rejects unsafe/arbitrary keys: %s", async (key) => {
      await expect(store.put({ ...input(), key })).rejects.toMatchObject({
        code: "INVALID_OBJECT",
      });
      await expect(store.get(key)).rejects.toMatchObject({
        code: "INVALID_OBJECT",
      });
      await expect(store.head(key)).rejects.toMatchObject({
        code: "INVALID_OBJECT",
      });
      await expect(store.delete(key)).rejects.toMatchObject({
        code: "INVALID_OBJECT",
      });
    });
    it("rejects extra bucket authority, wrong type, oversized data and dishonest integrity", async () => {
      await expect(
        store.put({ ...input(), bucket: "another-bucket" } as PutObjectInput),
      ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
      await expect(
        store.put({ ...input(), contentType: "text/html" }),
      ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
      await expect(
        store.put({ ...input(), size: 8 * 1024 * 1024 + 1 }),
      ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
      await expect(
        store.put({ ...input(), sha256: "0".repeat(64) }),
      ).rejects.toMatchObject({ code: "INTEGRITY" });
      await expect(store.put({ ...input(), size: 1 })).rejects.toMatchObject({
        code: "INTEGRITY",
      });
      await expect(
        store.put({
          ...input(),
          key: publishedObjectKey(
            "roads",
            randomUUID(),
            randomUUID(),
            "roads.geojson",
          ),
        }),
      ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
    });
  });

it("local bytes survive adapter recreation and tampering is detected", async () => {
  const localRoot = join(root, "persistence"),
    object = input();
  await new LocalFilesystemObjectStore(localRoot, "private").put(object);
  const next = new LocalFilesystemObjectStore(localRoot, "private");
  expect((await next.get(object.key)).bytes).toEqual(bytes);
  const file = join(localRoot, object.key),
    original = await readFile(file);
  original[original.length - 1] = original[original.length - 1]! ^ 1;
  await writeFile(file, original);
  await expect(next.get(object.key)).rejects.toMatchObject({
    code: "INTEGRITY",
  });
});
it("rejects a symlink/junction inside the local namespace", async () => {
  const localRoot = join(root, "symlink"),
    outside = join(root, "outside");
  await mkdir(localRoot);
  await mkdir(outside);
  await symlink(
    outside,
    join(localRoot, "imports"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await expect(
    new LocalFilesystemObjectStore(localRoot, "private").put(input()),
  ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
});
it("published assets are immutable and only diagnostics may be deleted", async () => {
  for (const store of [
    new LocalFilesystemObjectStore(join(root, "published"), "published"),
    new S3CompatibleObjectStore(env(), "published"),
  ]) {
    try {
      const object = {
        ...input(),
        key: publishedObjectKey(
          "roads",
          randomUUID(),
          randomUUID(),
          "roads.geojson",
        ),
        contentType: "application/geo+json",
      };
      await store.put(object);
      await expect(store.put(object)).rejects.toMatchObject({
        code: "CONFLICT",
      });
      await expect(store.delete(object.key)).rejects.toMatchObject({
        code: "INVALID_OBJECT",
      });
      const diagnostic = {
        ...object,
        key: diagnosticObjectKey(),
        contentType: "application/json",
      };
      await store.put(diagnostic);
      await store.delete(diagnostic.key);
      expect(await store.head(diagnostic.key)).toBeNull();
    } finally {
      if (store instanceof S3CompatibleObjectStore) store.close();
    }
  }
  expect(
    [...objects.values()].some(
      (o) => o.cache === "public, max-age=31536000, immutable",
    ),
  ).toBe(true);
});
it("S3 rehashes received bytes, rejects oversized replies and suppresses provider errors", async () => {
  const store = new S3CompatibleObjectStore(env(), "private"),
    object = input();
  try {
    await store.put(object);
    mode = "corrupt";
    await expect(store.get(object.key)).rejects.toMatchObject({
      code: "INTEGRITY",
    });
    mode = "oversized";
    await expect(store.get(object.key)).rejects.toMatchObject({
      code: "INVALID_OBJECT",
    });
    mode = "unavailable";
    await expect(store.head(object.key)).rejects.toThrow(
      /^LAND object storage: UNAVAILABLE$/,
    );
  } finally {
    mode = "normal";
    store.close();
  }
});
it("signs only the designated private XLSX with bounded expiry, length, type, hash and create-only headers", async () => {
  const store = new S3CompatibleObjectStore(env(), "private");
  try {
    const { bytes: body, ...object } = input();
    const signed = await store.createUploadUrl(object, 60),
      url = new URL(signed.url);
    expect(url.pathname).toBe(`/land-private/${object.key}`);
    expect(url.searchParams.get("X-Amz-Expires")).toBe("60");
    for (const header of [
      "content-length",
      "content-type",
      "x-amz-meta-sha256",
      "if-none-match",
      "cache-control",
    ])
      expect(url.searchParams.get("X-Amz-SignedHeaders")?.split(";")).toContain(
        header,
      );
    expect(JSON.stringify(signed)).not.toContain("synthetic-secret-key");
    expect(signed.headers).not.toHaveProperty("content-length");
    expect(
      await fetch(signed.url, {
        method: signed.method,
        headers: signed.headers,
        body: Uint8Array.from(body),
      }),
    ).toMatchObject({ status: 200 });
    expect((await store.get(object.key)).bytes).toEqual(body);
    expect(
      await fetch(signed.url, {
        method: signed.method,
        headers: signed.headers,
        body: Uint8Array.from(body),
      }),
    ).toMatchObject({ status: 412 });
    const download = await store.createDownloadUrl(object.key, 60);
    expect(new URL(download.url).pathname).toBe(url.pathname);
    expect(download.method).toBe("GET");
    for (const ttl of [0, 29, 601, Infinity, 30.5]) {
      await expect(store.createUploadUrl(object, ttl)).rejects.toMatchObject({
        code: "INVALID_OBJECT",
      });
      await expect(
        store.createDownloadUrl(object.key, ttl),
      ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
    }
    await expect(
      store.createUploadUrl({ ...object, bucket: "evil" } as typeof object, 60),
    ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
    await expect(
      store.createUploadUrl(
        {
          ...object,
          key: importObjectKey(randomUUID(), "inspection"),
          contentType: "application/json",
        },
        60,
      ),
    ).rejects.toMatchObject({ code: "INVALID_OBJECT" });
    expect(
      requests
        .filter((r) => r.method === "PUT")
        .every((r) => r.conditional === "*"),
    ).toBe(true);
    expect(await fetch(`${endpoint}/land-private/${object.key}`)).toMatchObject(
      { status: 403 },
    );
  } finally {
    store.close();
  }
});
it("refuses preview credentials and non-S3 configuration", () => {
  expect(
    () =>
      new S3CompatibleObjectStore(
        { ...env(), VERCEL_ENV: "preview" },
        "private",
      ),
  ).toThrow("disabled");
  expect(
    () =>
      new S3CompatibleObjectStore(
        { ...env(), OBJECT_STORE_DRIVER: "local" },
        "private",
      ),
  ).toThrow("INVALID_OBJECT");
});
