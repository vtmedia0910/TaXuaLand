import { adminHandler } from "@land/api/http";
import { listDatasets } from "@land/api/registry";
export function GET(request: Request) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await listDatasets(actor)),
  );
}
