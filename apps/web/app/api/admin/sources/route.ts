import { adminHandler, jsonInput } from "@land/api/http";
import { listSources, registerSource } from "@land/api/registry";
export function GET(request: Request) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await listSources(actor)),
  );
}
export function POST(request: Request) {
  return adminHandler(request, "configure", async (actor) =>
    Response.json(await registerSource(actor, await jsonInput(request)), {
      status: 201,
    }),
  );
}
