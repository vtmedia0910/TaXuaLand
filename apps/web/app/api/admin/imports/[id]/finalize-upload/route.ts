import { z } from "zod";
import { adminHandler, jsonInput } from "@land/api/http";
import { finalizeImportUpload } from "@land/api/import-uploads";
export const runtime = "nodejs";
export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "import", async (actor) => {
    z.object({})
      .strict()
      .parse(await jsonInput(request, 1024));
    return Response.json(
      await finalizeImportUpload(actor, (await context.params).id),
    );
  });
}
