import { adminHandler, jsonInput } from "@land/api/http";
import { database } from "@land/api/db";
import { spatialWarnings } from "@land/api/places";
import { Wgs84Position } from "../../../../../../../packages/spatial-types/src/index";
export function POST(request: Request) {
  return adminHandler(request, "read", async () =>
    Response.json(
      await spatialWarnings(
        database(),
        Wgs84Position.nullable().parse(await jsonInput(request)),
      ),
    ),
  );
}
