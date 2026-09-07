import {
  LoginInput,
  login,
  SESSION_COOKIE,
  SESSION_SECONDS,
} from "@land/api/auth";
import { checkOrigin, handle, jsonInput } from "@land/api/http";
export const runtime = "nodejs";
export function POST(request: Request) {
  return handle(request, async (correlationId) => {
    checkOrigin(request);
    const token = await login(
      LoginInput.parse(await jsonInput(request, 4096)),
      correlationId,
    );
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secure}`,
        },
      },
    );
  });
}
