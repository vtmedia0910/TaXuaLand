import { mkdir, writeFile } from "node:fs/promises";
import { appendFileSync } from "node:fs";
import { relative } from "node:path";
import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

// Explicit allowlist: no error bodies, stack dumps, attachments, cookies,
// credentials, workbook contents or browser snapshots enter CI artifacts.
export default class CoreReporter implements Reporter {
  private rows: {
    test: string;
    file: string;
    line: number;
    status: string;
    durationMs: number;
  }[] = [];
  onTestEnd(test: TestCase, result: TestResult) {
    if (!process.env.CI && result.errors.length)
      appendFileSync(
        "work/core-errors.private.jsonl",
        JSON.stringify({ test: test.title, errors: result.errors }) + "\n",
        { mode: 0o600 },
      );
    const row = {
      test: test.title,
      file: relative(process.cwd(), test.location.file).replaceAll("\\", "/"),
      line: test.location.line,
      status: result.status,
      durationMs: result.duration,
    };
    this.rows.push(row);
    console.log(
      `${row.status}: ${row.file}:${row.line} — ${row.test} (${row.durationMs} ms)`,
    );
  }
  onError() {
    console.error(
      "Playwright infrastructure error; raw details excluded from public CI logs.",
    );
  }
  async onEnd(result: FullResult) {
    const report = {
      status: result.status,
      durationMs: result.duration,
      tests: this.rows,
    };
    await mkdir("test-results/core-safe", { recursive: true });
    await writeFile(
      "test-results/core-safe/summary.json",
      JSON.stringify(report, null, 2),
    );
    const escape = (text: string) =>
      text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    await writeFile(
      "test-results/core-safe/summary.html",
      `<!doctype html><html lang="en"><meta charset="utf-8"><title>LAND Core E2E</title><h1>LAND Core E2E: ${escape(result.status)}</h1><p>Production server · disposable PostGIS · synthetic fixtures only. Private diagnostics excluded.</p><table><thead><tr><th>Test / source</th><th>Status</th><th>Duration (ms)</th></tr></thead><tbody>${this.rows.map((row) => `<tr><td>${escape(row.test)}<br>${escape(row.file)}:${row.line}</td><td>${escape(row.status)}</td><td>${row.durationMs}</td></tr>`).join("")}</tbody></table></html>`,
    );
    console.log(
      `Core E2E ${result.status}: ${this.rows.length} browser tests.`,
    );
  }
}
