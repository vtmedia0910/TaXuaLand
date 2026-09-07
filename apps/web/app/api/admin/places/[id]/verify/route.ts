import { adminHandler, jsonInput } from "@land/api/http";
import { verifyPlace } from "@land/api/place-workflow";
export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "verify", async (actor) => {
    await verifyPlace(
      actor,
      (await context.params).id,
      await jsonInput(request),
    );
    return Response.json({ ok: true });
  });
}
