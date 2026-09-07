import { logout, SESSION_COOKIE } from "@land/api/auth";
import { adminHandler, cookieToken } from "@land/api/http";
export function POST(request: Request) {
  return adminHandler(request, "read", async (actor) => {
    await logout(cookieToken(request)!, actor);
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
        },
      },
    );
  });
}
