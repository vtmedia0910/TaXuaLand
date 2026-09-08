import { parseWorkbook } from "../../../packages/import/src/workbook-parser.ts";
import { readFile } from "node:fs/promises";
process.once("message", async (message: unknown) => {
  try {
    if (typeof message !== "string") throw Error("INVALID_WORKER_INPUT");
    const workbook = await parseWorkbook(await readFile(message));
    process.send?.({ ok: true, workbook }, () => process.disconnect());
  } catch {
    process.send?.({ ok: false, error: "WORKBOOK_REJECTED" }, () =>
      process.disconnect(),
    );
  }
});
