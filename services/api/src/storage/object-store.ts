import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { IMPORT_LIMITS } from "../../../../packages/contracts/src/import.ts";

export const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const MAX_OBJECT_BYTES = 32 * 1024 * 1024;
export type StoreZone = "private" | "published";
const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const rawPattern = new RegExp(`^imports/raw/${uuid}/${uuid}\\.xlsx$`);
const inspectionPattern = new RegExp(
  `^imports/inspection/${uuid}/${uuid}\\.json$`,
);
const spatialPattern = new RegExp(
  `^spatial/(terrain|roads|imagery|3d)/${uuid}/${uuid}/(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_-]+\\.(json|geojson|bin|terrain|png|jpg|webp|glb|b3dm)$`,
);
const diagnosticPattern = new RegExp(`^diagnostics/${uuid}\\.json$`);
const Key = z.string().min(1).max(512);
export class ObjectStoreError extends Error {
  constructor(
    public readonly code:
      "INVALID_OBJECT" | "NOT_FOUND" | "CONFLICT" | "INTEGRITY" | "UNAVAILABLE",
  ) {
    super(`LAND object storage: ${code}`);
  }
}
export function validateKey(zone: StoreZone, value: string): string {
  if (
    !["private", "published"].includes(zone) ||
    !Key.safeParse(value).success ||
    value
      .split("/")
      .some((segment) =>
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment),
      ) ||
    !(
      diagnosticPattern.test(value) ||
      (zone === "private"
        ? rawPattern.test(value) || inspectionPattern.test(value)
        : spatialPattern.test(value))
    )
  )
    throw new ObjectStoreError("INVALID_OBJECT");
  return value;
}
export function importObjectKey(batchId: string, kind: "raw" | "inspection") {
  z.uuid().parse(batchId);
  return `imports/${kind}/${batchId}/${randomUUID()}.${kind === "raw" ? "xlsx" : "json"}`;
}
export function publishedObjectKey(
  kind: "terrain" | "roads" | "imagery" | "3d",
  datasetId: string,
  releaseId: string,
  file: string,
) {
  z.uuid().parse(datasetId);
  z.uuid().parse(releaseId);
  return validateKey(
    "published",
    `spatial/${kind}/${datasetId}/${releaseId}/${file}`,
  );
}
export const diagnosticObjectKey = () => `diagnostics/${randomUUID()}.json`;
export const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
export const ObjectDescriptor = z
  .object({
    key: Key,
    size: z.number().int().positive().max(MAX_OBJECT_BYTES),
    contentType: z.string(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type ObjectDescriptor = z.infer<typeof ObjectDescriptor>;
export interface ReadableObject extends ObjectDescriptor {
  bytes: Buffer;
}
export interface PutObjectInput extends ObjectDescriptor {
  bytes: Buffer;
}
export interface ObjectStore {
  put(input: PutObjectInput): Promise<ObjectDescriptor>;
  get(key: string): Promise<ReadableObject>;
  head(key: string): Promise<ObjectDescriptor | null>;
  delete(key: string): Promise<void>;
}
export interface SignedObjectUrl {
  url: string;
  method: "PUT" | "GET";
  headers: Record<string, string>;
  expiresAt: string;
}
export interface ObjectStoreSigner {
  createUploadUrl(
    input: ObjectDescriptor,
    ttlSeconds: number,
  ): Promise<SignedObjectUrl>;
  createDownloadUrl(key: string, ttlSeconds: number): Promise<SignedObjectUrl>;
}
const types: Record<string, string[]> = {
  xlsx: [XLSX_TYPE],
  json: ["application/json", "application/vnd.land.terrain+json"],
  geojson: ["application/geo+json"],
  bin: ["application/octet-stream"],
  terrain: ["application/octet-stream"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  webp: ["image/webp"],
  glb: ["model/gltf-binary"],
  b3dm: ["application/octet-stream"],
};
export function descriptor(zone: StoreZone, input: unknown): ObjectDescriptor {
  const parsed = ObjectDescriptor.safeParse(input);
  if (!parsed.success) throw new ObjectStoreError("INVALID_OBJECT");
  const object = parsed.data;
  validateKey(zone, object.key);
  if (
    !types[object.key.split(".").at(-1)!]?.includes(object.contentType) ||
    (rawPattern.test(object.key) && object.size > IMPORT_LIMITS.uploadBytes)
  )
    throw new ObjectStoreError("INVALID_OBJECT");
  return object;
}
export function checkedPut(zone: StoreZone, input: PutObjectInput) {
  const { bytes, ...metadata } = input;
  const object = descriptor(zone, metadata);
  verifyBytes(object, bytes);
  return object;
}
export function verifyBytes(object: ObjectDescriptor, bytes: Buffer) {
  if (
    !Buffer.isBuffer(bytes) ||
    bytes.length !== object.size ||
    sha256(bytes) !== object.sha256
  )
    throw new ObjectStoreError("INTEGRITY");
}
export function uploadDescriptor(
  zone: StoreZone,
  input: ObjectDescriptor,
  ttlSeconds: number,
) {
  const object = descriptor(zone, input);
  validateTtl(ttlSeconds);
  if (zone !== "private" || !rawPattern.test(object.key))
    throw new ObjectStoreError("INVALID_OBJECT");
  return object;
}
export function validateTtl(seconds: number) {
  if (!Number.isInteger(seconds) || seconds < 30 || seconds > 600)
    throw new ObjectStoreError("INVALID_OBJECT");
}
