import { adminHandler } from "@land/api/http";
import { evidenceRecords } from "@land/api/place-workflow";
export function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await evidenceRecords(actor, (await context.params).id)),
  );
}
