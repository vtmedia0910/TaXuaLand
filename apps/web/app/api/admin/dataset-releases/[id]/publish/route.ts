import { adminHandler } from "@land/api/http";
import { publishRelease } from "@land/api/registry";

export function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "configure", async (actor) => {
    await publishRelease(actor, (await context.params).id);
    return Response.json({ ok: true });
  });
}
