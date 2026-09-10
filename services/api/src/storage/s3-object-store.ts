import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  deploymentConfig,
  assertDatabaseEnabled,
} from "../../../../packages/config/src/deployment.ts";
import {
  checkedPut,
  descriptor,
  ObjectStoreError,
  uploadDescriptor,
  validateKey,
  validateTtl,
  verifyBytes,
  type ObjectDescriptor,
  type ObjectStore,
  type ObjectStoreSigner,
  type PutObjectInput,
  type StoreZone,
} from "./object-store.ts";

function storageError(error: unknown): never {
  if (error instanceof ObjectStoreError) throw error;
  const status = (error as { $metadata?: { httpStatusCode?: number } })
    ?.$metadata?.httpStatusCode;
  throw new ObjectStoreError(
    status === 404
      ? "NOT_FOUND"
      : status === 412 || status === 409
        ? "CONFLICT"
        : "UNAVAILABLE",
  );
}

/** AWS types and credentials stay inside this infrastructure adapter. */
export class S3CompatibleObjectStore implements ObjectStore, ObjectStoreSigner {
  private readonly client: S3Client;
  private readonly bucket: string;
  constructor(
    env: Record<string, string | undefined>,
    private readonly zone: StoreZone,
  ) {
    assertDatabaseEnabled(env);
    const config = deploymentConfig(env);
    if (config.OBJECT_STORE_DRIVER !== "s3")
      throw new ObjectStoreError("INVALID_OBJECT");
    this.bucket = (
      zone === "private" ? config.PRIVATE_BUCKET : config.PUBLISHED_BUCKET
    )!;
    this.client = new S3Client({
      endpoint: config.OBJECT_STORE_ENDPOINT!,
      region: config.OBJECT_STORE_REGION!,
      credentials: {
        accessKeyId: config.OBJECT_STORE_ACCESS_KEY_ID!,
        secretAccessKey: config.OBJECT_STORE_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      followRegionRedirects: false,
      maxAttempts: 2,
      // R2/S3-compatible providers differ in native checksum support. Always hash downloaded bytes.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      requestHandler: { connectionTimeout: 5000, requestTimeout: 20000 },
    });
  }
  close() {
    this.client.destroy();
  }
  private putCommand(object: ObjectDescriptor, bytes?: Buffer) {
    return new PutObjectCommand({
      Bucket: this.bucket,
      Key: object.key,
      ...(bytes ? { Body: bytes } : {}),
      ContentLength: object.size,
      ContentType: object.contentType,
      Metadata: { sha256: object.sha256 },
      IfNoneMatch: "*",
      CacheControl:
        this.zone === "published" && !object.key.startsWith("diagnostics/")
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
    });
  }
  async put(input: PutObjectInput) {
    const object = checkedPut(this.zone, input);
    try {
      await this.client.send(this.putCommand(object, input.bytes), {
        abortSignal: AbortSignal.timeout(20000),
      });
      // Acknowledgment/metadata alone is not proof of byte integrity.
      const uploaded = await this.get(object.key);
      if (
        uploaded.sha256 !== object.sha256 ||
        uploaded.size !== object.size ||
        uploaded.contentType !== object.contentType
      )
        throw new ObjectStoreError("INTEGRITY");
      return object;
    } catch (error) {
      storageError(error);
    }
  }
  async head(key: string) {
    validateKey(this.zone, key);
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
        { abortSignal: AbortSignal.timeout(20000) },
      );
      return descriptor(this.zone, {
        key,
        size: result.ContentLength,
        contentType: result.ContentType,
        sha256: result.Metadata?.sha256,
      });
    } catch (error) {
      if (
        (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
          ?.httpStatusCode === 404
      )
        return null;
      storageError(error);
    }
  }
  async get(key: string) {
    validateKey(this.zone, key);
    let body: Readable | undefined;
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { abortSignal: AbortSignal.timeout(20000) },
      );
      if (!(result.Body instanceof Readable))
        throw new ObjectStoreError("UNAVAILABLE");
      body = result.Body;
      const object = descriptor(this.zone, {
        key,
        size: result.ContentLength,
        contentType: result.ContentType,
        sha256: result.Metadata?.sha256,
      });
      const chunks: Buffer[] = [];
      let length = 0;
      for await (const chunk of body) {
        const bytes = Buffer.from(chunk);
        length += bytes.length;
        if (length > object.size) throw new ObjectStoreError("INTEGRITY");
        chunks.push(bytes);
      }
      const bytes = Buffer.concat(chunks);
      verifyBytes(object, bytes);
      return { ...object, bytes };
    } catch (error) {
      storageError(error);
    } finally {
      body?.destroy();
    }
  }
  async delete(key: string) {
    validateKey(this.zone, key);
    if (this.zone === "published" && !key.startsWith("diagnostics/"))
      throw new ObjectStoreError("INVALID_OBJECT");
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
        { abortSignal: AbortSignal.timeout(20000) },
      );
    } catch (error) {
      if (
        (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
          ?.httpStatusCode === 404
      )
        return;
      storageError(error);
    }
  }
  async createUploadUrl(input: ObjectDescriptor, ttlSeconds: number) {
    const object = uploadDescriptor(this.zone, input, ttlSeconds);
    try {
      const headers = {
        "content-type": object.contentType,
        "x-amz-meta-sha256": object.sha256,
        "if-none-match": "*",
        "cache-control": "private, no-store",
      };
      const url = await getSignedUrl(this.client, this.putCommand(object), {
        expiresIn: ttlSeconds,
        signableHeaders: new Set([...Object.keys(headers), "content-length"]),
        unhoistableHeaders: new Set(["x-amz-meta-sha256"]),
      });
      // Browser supplies Content-Length from the File body; JS must not set this forbidden header.
      return {
        url,
        method: "PUT" as const,
        headers,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      };
    } catch (error) {
      storageError(error);
    }
  }
  async createDownloadUrl(key: string, ttlSeconds: number) {
    validateKey(this.zone, key);
    validateTtl(ttlSeconds);
    if (this.zone !== "private") throw new ObjectStoreError("INVALID_OBJECT");
    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ResponseCacheControl: "private, no-store",
          ResponseContentDisposition: "attachment",
        }),
        { expiresIn: ttlSeconds },
      );
      return {
        url,
        method: "GET" as const,
        headers: {},
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      };
    } catch (error) {
      storageError(error);
    }
  }
}
