import { adminHandler, jsonInput } from "@land/api/http";
import { commitImport } from "@land/api/import-commit";
export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "import", async (actor) =>
    Response.json(
      await commitImport(
        actor,
        (await context.params).id,
        await jsonInput(request),
      ),
    ),
  );
}
