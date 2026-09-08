import { randomUUID } from "node:crypto";
import {
  link,
  lstat,
  mkdir,
  open,
  realpath,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
  checkedPut,
  descriptor,
  MAX_OBJECT_BYTES,
  ObjectStoreError,
  validateKey,
  verifyBytes,
  type ObjectStore,
  type PutObjectInput,
  type ReadableObject,
  type StoreZone,
} from "./object-store.ts";

/** Private local backing format: one atomic metadata+bytes file, never a web public directory. */
export class LocalFilesystemObjectStore implements ObjectStore {
  private readonly root: string;
  constructor(
    root: string,
    private readonly zone: StoreZone,
  ) {
    if (!isAbsolute(root)) throw new ObjectStoreError("INVALID_OBJECT");
    this.root = resolve(root);
  }
  private async path(key: string, create = false) {
    validateKey(this.zone, key);
    if (create) await mkdir(this.root, { recursive: true, mode: 0o700 });
    const base = await realpath(this.root);
    // Operator-owned root may not itself be a junction/symlink.
    if ((await lstat(this.root)).isSymbolicLink())
      throw new ObjectStoreError("INVALID_OBJECT");
    let current = base;
    const segments = key.split("/");
    for (const segment of segments.slice(0, -1)) {
      current = join(current, segment);
      if (create)
        await mkdir(current, { mode: 0o700 }).catch(
          (e: NodeJS.ErrnoException) => {
            if (e.code !== "EEXIST") throw e;
          },
        );
      if (
        (await lstat(current)).isSymbolicLink() ||
        !(await lstat(current)).isDirectory()
      )
        throw new ObjectStoreError("INVALID_OBJECT");
      const rel = relative(base, await realpath(current));
      if (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel))
        throw new ObjectStoreError("INVALID_OBJECT");
    }
    return join(current, segments.at(-1)!);
  }
  private async read(key: string): Promise<ReadableObject | null> {
    let file;
    try {
      const path = await this.path(key);
      if ((await lstat(path)).isSymbolicLink())
        throw new ObjectStoreError("INVALID_OBJECT");
      file = await open(path, "r");
      const size = (await file.stat()).size;
      if (size > MAX_OBJECT_BYTES + 2048)
        throw new ObjectStoreError("INTEGRITY");
      const data = Buffer.alloc(size);
      let offset = 0;
      while (offset < size) {
        const result = await file.read(data, offset, size - offset, offset);
        if (!result.bytesRead) throw new ObjectStoreError("INTEGRITY");
        offset += result.bytesRead;
      }
      const newline = data.indexOf(10);
      if (newline < 0 || newline > 2048)
        throw new ObjectStoreError("INTEGRITY");
      const object = descriptor(
        this.zone,
        JSON.parse(data.subarray(0, newline).toString("utf8")),
      );
      const bytes = data.subarray(newline + 1);
      if (object.key !== key) throw new ObjectStoreError("INTEGRITY");
      verifyBytes(object, bytes);
      return { ...object, bytes };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      if (error instanceof ObjectStoreError) throw error;
      throw new ObjectStoreError("UNAVAILABLE");
    } finally {
      await file?.close();
    }
  }
  async put(input: PutObjectInput) {
    const object = checkedPut(this.zone, input);
    let scratch: string | undefined;
    try {
      const path = await this.path(object.key, true);
      scratch = join(dirname(path), `.pending-${randomUUID()}`);
      await writeFile(
        scratch,
        Buffer.concat([
          Buffer.from(JSON.stringify(object) + "\n"),
          input.bytes,
        ]),
        { flag: "wx", mode: 0o600 },
      );
      // link is exclusive; readers never see a partial file, including competing writers.
      await link(scratch, path);
      return object;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST")
        throw new ObjectStoreError("CONFLICT");
      if (error instanceof ObjectStoreError) throw error;
      throw new ObjectStoreError("UNAVAILABLE");
    } finally {
      if (scratch)
        await unlink(scratch).catch(() => {
          throw new ObjectStoreError("UNAVAILABLE");
        });
    }
  }
  async get(key: string) {
    const object = await this.read(key);
    if (!object) throw new ObjectStoreError("NOT_FOUND");
    return object;
  }
  async head(key: string) {
    const object = await this.read(key);
    if (!object) return null;
    return {
      key: object.key,
      size: object.size,
      contentType: object.contentType,
      sha256: object.sha256,
    };
  }
  async delete(key: string) {
    validateKey(this.zone, key);
    if (this.zone === "published" && !key.startsWith("diagnostics/"))
      throw new ObjectStoreError("INVALID_OBJECT");
    try {
      await unlink(await this.path(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      if (error instanceof ObjectStoreError) throw error;
      throw new ObjectStoreError("UNAVAILABLE");
    }
  }
}
