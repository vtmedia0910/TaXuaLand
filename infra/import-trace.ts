import { readFile } from "node:fs/promises";
import { createRequire, stripTypeScriptTypes } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(
  new URL("../apps/web/package.json", import.meta.url),
);

/** Trace the existing isolated child, which a dynamic fork cannot expose to Next. */
export async function importTrace(): Promise<string[]> {
  const { nodeFileTrace } = require("next/dist/compiled/@vercel/nft");
  const trace = await nodeFileTrace(
    [resolve(root, "workers/import/src/parse-workbook.ts")],
    {
      base: root,
      readFile: async (path: string) => {
        try {
          const source = await readFile(path, "utf8");
          return path.endsWith(".ts") ? stripTypeScriptTypes(source) : source;
        } catch (error) {
          if (
            ["ENOENT", "EISDIR"].includes(
              (error as NodeJS.ErrnoException).code ?? "",
            )
          )
            return null;
          throw error;
        }
      },
    },
  );
  if (trace.warnings.size) throw Error("Isolated parser file tracing failed");
  return [...(trace.fileList as Set<string>)]
    .map((path) => path.replaceAll("\\", "/"))
    .sort();
}
