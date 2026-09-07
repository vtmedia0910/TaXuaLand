import { adminHandler, jsonInput } from "@land/api/http";
import { listPlaces, savePlace } from "@land/api/places";
export function GET(request: Request) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(
      await listPlaces(
        actor,
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    ),
  );
}
export function POST(request: Request) {
  return adminHandler(request, "edit", async (actor) =>
    Response.json(
      { id: await savePlace(actor, await jsonInput(request), null) },
      { status: 201 },
    ),
  );
}
