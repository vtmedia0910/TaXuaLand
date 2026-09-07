import { z } from "zod";
import { adminHandler, jsonInput } from "@land/api/http";
import { getPlace, savePlace, archivePlace } from "@land/api/places";
import { SavePlaceInput } from "@land/api/place-input";
type Context = { params: Promise<{ id: string }> };
export function GET(request: Request, context: Context) {
  return adminHandler(request, "read", async (actor) =>
    Response.json(await getPlace(actor, (await context.params).id)),
  );
}
export function PATCH(request: Request, context: Context) {
  return adminHandler(request, "edit", async (actor) => {
    const input = SavePlaceInput.parse(await jsonInput(request));
    return Response.json({
      id: await savePlace(actor, input.data, {
        id: z.uuid().parse((await context.params).id),
        version: input.version,
      }),
    });
  });
}
export function DELETE(request: Request, context: Context) {
  return adminHandler(request, "edit", async (actor) => {
    const input = z
      .object({ version: z.number().int().positive() })
      .strict()
      .parse(await jsonInput(request));
    await archivePlace(actor, (await context.params).id, input.version);
    return Response.json({ ok: true });
  });
}
