import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Script } from "node:vm";
const root = resolve(import.meta.dirname, "../apps/web/.next/static/chunks");
let count = 0;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await inspect(path);
    else if (entry.name.endsWith(".js")) {
      try {
        new Script(await readFile(path, "utf8"));
      } catch {
        throw new Error(`Invalid production JavaScript: ${entry.name}`);
      }
      count++;
    }
  }
}
await inspect(root);
console.info(
  `Validated syntax of ${count} production client chunks (no code executed).`,
);
