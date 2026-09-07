import { adminHandler, jsonInput } from "@land/api/http";
import { bulkPlaces } from "@land/api/place-workflow";
export function POST(request: Request) {
  return adminHandler(request, "read", async (actor) => {
    await bulkPlaces(actor, await jsonInput(request));
    return Response.json({ ok: true });
  });
}
