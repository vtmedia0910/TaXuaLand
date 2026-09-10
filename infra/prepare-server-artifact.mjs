import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import ExcelJS from "exceljs";
import { importTrace } from "./import-trace.ts";
import { inspectWorkbookIsolated } from "../services/api/src/import-worker.ts";

const root = resolve(import.meta.dirname, "..");
const parser = await importTrace();
const forbidden = /(^|\/)(?:work|\.git|\.env[^/]*)(\/|$)|public\/spatial\//;
for (const route of ["imports", "imports/[id]/finalize-upload"]) {
  const path = resolve(
    root,
    `apps/web/.next/server/app/api/admin/${route}/route.js.nft.json`,
  );
  const trace = JSON.parse(await readFile(path, "utf8"));
  const files = new Set(
    trace.files.map((file) =>
      relative(root, resolve(dirname(path), file)).replaceAll("\\", "/"),
    ),
  );
  // Next's include glob omits directory symlinks. NFT consumers need those
  // pnpm links as well as their traced targets for native child resolution.
  for (const file of parser) {
    if (!files.has(file)) {
      assert(
        (await stat(resolve(root, file))).isDirectory(),
        `Missing parser dependency: ${file}`,
      );
      trace.files.push(
        relative(dirname(path), resolve(root, file)).replaceAll("\\", "/"),
      );
      files.add(file);
    }
  }
  for (const file of files)
    assert(!forbidden.test(file), "Private data in function trace");
  await writeFile(path, JSON.stringify(trace));
}

// Reconstruct only traced parser files, including pnpm links, in a fresh cold root.
const capsule = await mkdtemp(resolve(tmpdir(), "taxualand-parser-artifact-"));
const priorRoot = process.env.LAND_WORKSPACE_ROOT;
try {
  for (const file of parser) {
    const source = resolve(root, file),
      target = resolve(capsule, file);
    assert(target.startsWith(capsule + sep));
    await mkdir(dirname(target), { recursive: true });
    if ((await stat(source)).isDirectory()) {
      const canonical = await realpath(source);
      assert(canonical.startsWith(root + sep));
      const linked = resolve(capsule, relative(root, canonical));
      await mkdir(linked, { recursive: true });
      await symlink(
        process.platform === "win32"
          ? linked
          : relative(dirname(target), linked),
        target,
        process.platform === "win32" ? "junction" : "dir",
      );
    } else await copyFile(source, target);
  }
  process.env.LAND_WORKSPACE_ROOT = capsule;
  console.log(
    `Parser artifact reconstructed: ${parser.length} entries; starting bounded cold parse.`,
  );
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("Places").addRows([
    ["name", "latitude", "longitude"],
    ["Synthetic UNKNOWN", 21.26, 104.53],
  ]);
  const before = new Set(
    (await readdir(tmpdir())).filter((name) =>
      name.startsWith("taxualand-import-"),
    ),
  );
  const parseStarted = performance.now();
  const result = await inspectWorkbookIsolated(
    Buffer.from(await workbook.xlsx.writeBuffer()),
  );
  assert(result.sheets.length === 1);
  const after = (await readdir(tmpdir())).filter(
    (name) => name.startsWith("taxualand-import-") && !before.has(name),
  );
  assert.equal(after.length, 0, "Import scratch must be removed");
  console.log(
    `Server artifact PASS: ${parser.length} traced parser entries; cold isolated parse ${Math.round(performance.now() - parseStarted)} ms and scratch cleanup verified. Not cloud acceptance.`,
  );
} finally {
  if (priorRoot === undefined) delete process.env.LAND_WORKSPACE_ROOT;
  else process.env.LAND_WORKSPACE_ROOT = priorRoot;
  assert(capsule.startsWith(resolve(tmpdir(), "taxualand-parser-artifact-")));
  await rm(capsule, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
