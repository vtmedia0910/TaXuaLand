import { adminHandler, jsonInput } from "@land/api/http";
import { listCategories, saveCategory } from "@land/api/categories";
export function GET(request: Request) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await listCategories(actor)),
  );
}
export function POST(request: Request) {
  return adminHandler(request, "edit", async (actor) =>
    Response.json(await saveCategory(actor, await jsonInput(request)), {
      status: 201,
    }),
  );
}
