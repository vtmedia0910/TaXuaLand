import { adminHandler } from "@land/api/http";
import { readWorkbookBody } from "@land/api/import-upload-body";
import { uploadLocalImport } from "@land/api/import-uploads";
export const runtime = "nodejs";
export function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "import", async (actor) =>
    Response.json(
      await uploadLocalImport(
        actor,
        (await context.params).id,
        await readWorkbookBody(request),
        request.headers.get("content-type") ?? "",
      ),
    ),
  );
}
