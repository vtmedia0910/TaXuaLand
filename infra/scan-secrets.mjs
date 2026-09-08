import { spawnSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
const root = resolve(import.meta.dirname, "..");
const tracked = spawnSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { cwd: root, encoding: "utf8", windowsHide: true },
);
if (tracked.status !== 0)
  throw Error("Cannot enumerate repository files for scanning");
const paths = [...new Set(tracked.stdout.split("\0").filter(Boolean))];
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/,
  /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\b/,
];
const localSecrets = [];
for (const path of [".env.local", "apps/web/.env.local"]) {
  try {
    const env = parseEnv(await readFile(resolve(root, path), "utf8"));
    for (const [key, value] of Object.entries(env)) {
      if (
        /(PASSWORD|SECRET|TOKEN|PRIVATE_KEY|SERVICE_ROLE)/.test(key) &&
        value.length >= 12
      )
        localSecrets.push(value);
      if (key.includes("DATABASE") && /^postgres/.test(value)) {
        localSecrets.push(value);
        const password = decodeURIComponent(new URL(value).password);
        if (password.length >= 12) localSecrets.push(password);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT")
      throw Error("Unable to inspect private configuration safely");
  }
}
try {
  localSecrets.push(
    JSON.parse(await readFile(resolve(root, "work/local-admin.json"), "utf8"))
      .password,
  );
} catch (error) {
  if (error.code !== "ENOENT")
    throw Error("Unable to inspect QA configuration safely");
}
async function check(path) {
  let content;
  try {
    content = await readFile(resolve(root, path), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  if (
    patterns.some((pattern) => pattern.test(content)) ||
    localSecrets.some((secret) => content.includes(secret))
  )
    throw Error(`Potential secret in ${path}; value intentionally suppressed`);
}
for (const path of paths) {
  if (/(^|\/)\.env(?!\.example$)/.test(path))
    throw Error(`Private env file included: ${path}`);
  await check(path);
}
let chunks = 0;
async function walk(path) {
  for (const entry of await readdir(resolve(root, path), {
    withFileTypes: true,
  })) {
    const target = `${path}/${entry.name}`;
    if (entry.isDirectory()) await walk(target);
    else if (/\.(js|json|html)$/.test(entry.name)) {
      await check(target);
      chunks++;
    }
  }
}
await walk("apps/web/.next/static");
await walk("apps/web/public/cesium");
console.info(
  `Secret scan passed: ${paths.length} repository files and ${chunks} public artifacts; values never printed.`,
);
