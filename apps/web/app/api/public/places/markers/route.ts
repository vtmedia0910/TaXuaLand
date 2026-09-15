import { handle } from "@land/api/http";
import { publicPlaceMarkers } from "@land/api/public-places";

export function GET(request: Request) {
  return handle(request, async () =>
    Response.json(
      await publicPlaceMarkers(
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    ),
  );
}
