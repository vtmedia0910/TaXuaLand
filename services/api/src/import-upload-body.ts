import { IMPORT_LIMITS } from "../../../packages/contracts/src/import";
import { AppError } from "./errors";
export async function readWorkbookBody(request: Request) {
  const max = IMPORT_LIMITS.uploadBytes;
  if (Number(request.headers.get("content-length") ?? 0) > max)
    throw new AppError("UPLOAD_TOO_LARGE", 413, "Workbook vượt 8 MiB.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("EMPTY_UPLOAD", 400, "Thiếu workbook.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  const timer = setTimeout(() => {
    void reader.cancel();
  }, 20000);
  const started = Date.now();
  try {
    for (;;) {
      const result = await reader.read();
      if (Date.now() - started >= 20000)
        throw new AppError("UPLOAD_TIMEOUT", 408, "Upload hết thời gian.");
      if (result.done) break;
      size += result.value.length;
      if (size > max) {
        await reader.cancel();
        throw new AppError("UPLOAD_TOO_LARGE", 413, "Workbook vượt 8 MiB.");
      }
      chunks.push(result.value);
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
