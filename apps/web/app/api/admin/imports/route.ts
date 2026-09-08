import { adminHandler } from "@land/api/http";
import { uploadImport, listImports } from "@land/api/imports";
import { AppError } from "@land/api/errors";
export function GET(request: Request) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await listImports(actor)),
  );
}
export function POST(request: Request) {
  return adminHandler(request, "import", async (actor) => {
    const max = 8 * 1024 * 1024;
    if (Number(request.headers.get("content-length") ?? 0) > max)
      throw new AppError("UPLOAD_TOO_LARGE", 413, "Workbook vượt 8 MiB.");
    const reader = request.body?.getReader();
    if (!reader) throw new AppError("EMPTY_UPLOAD", 400, "Thiếu workbook.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const result = await reader.read();
        if (result.done) break;
        size += result.value.length;
        if (size > max) {
          await reader.cancel();
          throw new AppError("UPLOAD_TOO_LARGE", 413, "Workbook vượt 8 MiB.");
        }
        chunks.push(result.value);
      }
    } finally {
      reader.releaseLock();
    }
    let name: string;
    try {
      name = decodeURIComponent(request.headers.get("x-file-name") ?? "");
    } catch {
      throw new AppError("INVALID_FILE_NAME", 400, "Tên file không hợp lệ.");
    }
    return Response.json(
      await uploadImport(actor, {
        name,
        mime: request.headers.get("content-type") ?? "",
        sourceId: new URL(request.url).searchParams.get("sourceId") ?? "",
        bytes: Buffer.concat(chunks),
      }),
      { status: 201 },
    );
  });
}
