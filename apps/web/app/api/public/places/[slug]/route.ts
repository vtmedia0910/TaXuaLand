import { handle } from "@land/api/http";
import { publicPlace } from "@land/api/public-places";
export function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  return handle(request, async () =>
    Response.json(await publicPlace((await context.params).slug)),
  );
}
