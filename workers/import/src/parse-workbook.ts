import { parseWorkbook } from "../../../packages/import/src/workbook-parser.ts";
process.once("message", async (message: unknown) => {
  try {
    if (!Buffer.isBuffer(message)) throw Error("INVALID_WORKER_INPUT");
    const workbook = await parseWorkbook(message);
    process.send?.({ ok: true, workbook }, () => process.disconnect());
  } catch {
    process.send?.({ ok: false, error: "WORKBOOK_REJECTED" }, () =>
      process.disconnect(),
    );
  }
});
