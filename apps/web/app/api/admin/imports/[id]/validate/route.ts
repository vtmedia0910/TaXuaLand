import { adminHandler, jsonInput } from "@land/api/http";
import { validateImport } from "@land/api/imports";
export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "import", async (actor) =>
    Response.json(
      await validateImport(
        actor,
        (await context.params).id,
        await jsonInput(request),
      ),
    ),
  );
}
