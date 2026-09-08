import { adminHandler, jsonInput } from "@land/api/http";
import { createImportUploadSession } from "@land/api/import-uploads";
export const runtime = "nodejs";
export function POST(request: Request) {
  return adminHandler(request, "import", async (actor) =>
    Response.json(
      await createImportUploadSession(actor, await jsonInput(request, 4096)),
      { status: 201 },
    ),
  );
}
