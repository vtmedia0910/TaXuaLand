import { adminHandler, jsonInput } from "@land/api/http";
import { publishPlace } from "@land/api/place-workflow";
export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "publish", async (actor) => {
    await publishPlace(
      actor,
      (await context.params).id,
      await jsonInput(request),
    );
    return Response.json({ ok: true });
  });
}
