import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { sessionActor, SESSION_COOKIE } from "@land/api/auth";
export async function currentAdmin() {
  return sessionActor(
    (await cookies()).get(SESSION_COOKIE)?.value,
    randomUUID(),
  );
}
