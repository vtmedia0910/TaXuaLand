import { adminHandler } from "@land/api/http";
import { importBatch } from "@land/api/imports";
export function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await importBatch(actor, (await context.params).id)),
  );
}
