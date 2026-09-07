import { handle } from "@land/api/http";
import { publicPlaces } from "@land/api/public-places";
export function GET(request: Request) {
  return handle(request, async () =>
    Response.json(
      await publicPlaces(Object.fromEntries(new URL(request.url).searchParams)),
    ),
  );
}
