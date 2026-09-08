import { z } from "zod";
import { AppError } from "./errors";

/** Never log driver messages, SQL, detail, workbook values or arbitrary error codes. */
export function errorCategory(error: unknown): string {
  if (error instanceof z.ZodError) return "INPUT_VALIDATION";
  if (error instanceof AppError) {
    if (error.status === 401 || error.status === 403) return "AUTHORIZATION";
    if (error.status === 409) return "CONFLICT";
    if (error.status === 429) return "RATE_LIMIT";
    return error.status < 500 ? "REQUEST_REJECTED" : "SERVICE_UNAVAILABLE";
  }
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : null;
  if (code === "23505" || code === "23503" || code === "23514")
    return "DATABASE_CONSTRAINT";
  if (code === "40001" || code === "40P01" || code === "55P03")
    return "DATABASE_CONCURRENCY";
  if (code === "57014") return "DATABASE_TIMEOUT";
  if (code === "ECONNREFUSED" || code === "08006" || code === "57P01")
    return "DATABASE_UNAVAILABLE";
  return "UNEXPECTED";
}
const routeWords = new Set([
  "api",
  "admin",
  "public",
  "auth",
  "places",
  "categories",
  "datasets",
  "diagnostics",
  "imports",
  "rows",
  "commit",
  "validate",
  "sources",
  "records",
  "session",
  "spatial",
  "publish",
  "verify",
  "bulk",
  "login",
  "logout",
  "layers",
  "search",
]);
export function safeRoute(url: string): string {
  return new URL(url).pathname
    .split("/")
    .slice(0, 10)
    .map((part) => (!part || routeWords.has(part) ? part : ":id"))
    .join("/");
}
