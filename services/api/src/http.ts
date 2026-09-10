import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "./errors";
import { errorCategory, safeRoute } from "./observability";
import { deploymentOrigin } from "../../../packages/config/src/deployment";
import {
  SESSION_COOKIE,
  sessionActor,
  requirePermission,
  type Actor,
} from "./auth";
export function cookieToken(request: Request): string | undefined {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
}
export function checkOrigin(request: Request): void {
  let configured: string;
  try {
    configured = deploymentOrigin(process.env);
  } catch {
    throw new AppError(
      "CONFIGURATION_REQUIRED",
      503,
      "Dịch vụ chưa được cấu hình.",
    );
  }
  if (request.headers.get("origin") !== configured)
    throw new AppError("INVALID_ORIGIN", 403, "Nguồn yêu cầu không hợp lệ.");
}
export async function jsonInput(
  request: Request,
  maxBytes = 256_000,
): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError("UNSUPPORTED_CONTENT_TYPE", 415, "Cần dữ liệu JSON.");
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
    throw new AppError("PAYLOAD_TOO_LARGE", 413, "Dữ liệu vượt giới hạn.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("INVALID_INPUT", 400, "Thiếu dữ liệu.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new AppError("PAYLOAD_TOO_LARGE", 413, "Dữ liệu vượt giới hạn.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError("INVALID_JSON", 400, "JSON không hợp lệ.");
  }
}
export async function handle(
  request: Request,
  action: (correlationId: string) => Promise<Response>,
): Promise<Response> {
  const correlationId = randomUUID(),
    start = performance.now();
  let status = 500;
  let category: string | null = null;
  try {
    const response = await action(correlationId);
    status = response.status;
    response.headers.set("X-Correlation-ID", correlationId);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    category = errorCategory(error);
    const safe =
      error instanceof AppError
        ? error
        : error instanceof z.ZodError
          ? new AppError(
              "INVALID_INPUT",
              400,
              "Dữ liệu không hợp lệ. Kiểm tra các trường nhập.",
            )
          : new AppError("INTERNAL_ERROR", 500, "Không thể hoàn tất yêu cầu.");
    status = safe.status;
    return Response.json(
      { error: { code: safe.code, message: safe.message, correlationId } },
      {
        status,
        headers: {
          "X-Correlation-ID": correlationId,
          "Cache-Control": "no-store",
        },
      },
    );
  } finally {
    console.info(
      JSON.stringify({
        event: "http_request",
        method: request.method,
        path: safeRoute(request.url),
        status,
        errorCategory: category,
        durationMs: Math.round(performance.now() - start),
        correlationId,
      }),
    );
  }
}
export function adminHandler(
  request: Request,
  permission: string,
  action: (actor: Actor) => Promise<Response>,
): Promise<Response> {
  return handle(request, async (correlationId) => {
    if (!["GET", "HEAD"].includes(request.method)) checkOrigin(request);
    const actor = await sessionActor(cookieToken(request), correlationId);
    requirePermission(actor, permission);
    return action(actor);
  });
}
