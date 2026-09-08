import { adminHandler, jsonInput } from "@land/api/http";
import { reviewImportRow } from "@land/api/import-review";
export function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; rowId: string }> },
) {
  return adminHandler(request, "import", async (actor) => {
    const p = await context.params;
    return Response.json(
      await reviewImportRow(actor, p.id, p.rowId, await jsonInput(request)),
    );
  });
}
