import { adminHandler } from "@land/api/http";
import { uploadImport, listImports } from "@land/api/imports";
import { AppError } from "@land/api/errors";
import { readWorkbookBody } from "@land/api/import-upload-body";
export function GET(request: Request) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await listImports(actor)),
  );
}
export function POST(request: Request) {
  return adminHandler(request, "import", async (actor) => {
    const bytes = await readWorkbookBody(request);
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
        bytes,
      }),
      { status: 201 },
    );
  });
}
