import { adminHandler } from "@land/api/http";
export function GET(request: Request) {
  return adminHandler(request, "read", async (actor) =>
    Response.json({ email: actor.email, permissions: [...actor.permissions] }),
  );
}
