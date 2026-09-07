import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { database, transaction } from "./db.ts";
import { AppError } from "./errors.ts";
export const SESSION_COOKIE = "land_session";
export const SESSION_SECONDS = 8 * 60 * 60;
export interface Actor {
  id: string;
  email: string;
  permissions: ReadonlySet<string>;
  correlationId: string;
}
export const LoginInput = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(256),
  })
  .strict();
const digest = (value: string): string =>
  createHash("sha256").update(value).digest("hex");
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 14 || password.length > 256)
    throw new AppError(
      "PASSWORD_POLICY",
      400,
      "Mật khẩu cần từ 14 đến 256 ký tự.",
    );
  const salt = randomBytes(16);
  return `scrypt-131072-8-1$${salt.toString("hex")}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(
  password: string,
  encoded: string | null,
): Promise<boolean> {
  const parts = encoded?.split("$");
  const valid =
    parts?.[0] === "scrypt-131072-8-1" &&
    /^[a-f0-9]{32}$/.test(parts[1] ?? "") &&
    /^[a-f0-9]{128}$/.test(parts[2] ?? "");
  const salt = valid ? Buffer.from(parts![1]!, "hex") : Buffer.alloc(16);
  const expected = valid ? Buffer.from(parts![2]!, "hex") : Buffer.alloc(64);
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected) && Boolean(valid);
}
export function requirePermission(actor: Actor, permission: string): void {
  if (!actor.permissions.has(permission))
    throw new AppError(
      "FORBIDDEN",
      403,
      "Bạn không có quyền thực hiện thao tác này.",
    );
}
export async function audit(
  client: PoolClient,
  actor: Actor,
  action: string,
  subjectType: string,
  subjectId: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  await client.query(
    "INSERT INTO audit_events(actor_id,action,subject_type,subject_id,correlation_id,details) VALUES($1,$2,$3,$4,$5,$6)",
    [
      actor.id,
      action,
      subjectType,
      subjectId,
      actor.correlationId,
      JSON.stringify(details),
    ],
  );
}
export async function sessionActor(
  token: string | undefined,
  correlationId: string,
  connection = database(),
): Promise<Actor> {
  if (!token || !/^[a-f0-9]{64}$/.test(token))
    throw new AppError("UNAUTHENTICATED", 401, "Vui lòng đăng nhập Admin.");
  const result = await connection.query<{
    id: string;
    email: string;
    permissions: string[];
  }>(
    `SELECT u.id,u.email,coalesce(array_agg(DISTINCT rp.permission) FILTER(WHERE rp.permission IS NOT NULL),'{}') AS permissions FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id LEFT JOIN admin_user_roles ur ON ur.user_id=u.id LEFT JOIN role_permissions rp ON rp.role_code=ur.role_code WHERE s.token_hash=$1 AND s.expires_at>now() AND NOT u.disabled GROUP BY u.id,u.email`,
    [digest(token)],
  );
  const row = result.rows[0];
  if (!row)
    throw new AppError("UNAUTHENTICATED", 401, "Phiên đăng nhập đã hết hạn.");
  return {
    id: row.id,
    email: row.email,
    permissions: new Set(row.permissions),
    correlationId,
  };
}
export async function login(
  input: z.infer<typeof LoginInput>,
  correlationId: string,
  connection = database(),
): Promise<string> {
  // A database lock serializes the bounded password work across all app instances.
  // Persist failed attempts outside a rollback so failures cannot reset the limit.
  const outcome = await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(73571001)");
    const key = digest(input.email);
    await client.query(
      "INSERT INTO login_attempts(key_hash) VALUES($1) ON CONFLICT DO NOTHING",
      [key],
    );
    const attempt = (
      await client.query<{
        failures: number;
        blocked_until: Date | null;
        window_start: Date;
      }>(
        "SELECT failures,blocked_until,window_start FROM login_attempts WHERE key_hash=$1 FOR UPDATE",
        [key],
      )
    ).rows[0]!;
    if (attempt.blocked_until && attempt.blocked_until.getTime() > Date.now())
      return { error: "RATE_LIMITED" } as const;
    if (Date.now() - attempt.window_start.getTime() > 15 * 60 * 1000)
      await client.query(
        "UPDATE login_attempts SET failures=0,window_start=now(),blocked_until=NULL WHERE key_hash=$1",
        [key],
      );
    const user = (
      await client.query<{
        id: string;
        password_hash: string;
        disabled: boolean;
      }>("SELECT id,password_hash,disabled FROM admin_users WHERE email=$1", [
        input.email,
      ])
    ).rows[0];
    const valid = await verifyPassword(
      input.password,
      user?.password_hash ?? null,
    );
    if (!valid || !user || user.disabled) {
      await client.query(
        "UPDATE login_attempts SET failures=failures+1,blocked_until=CASE WHEN failures+1>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE key_hash=$1",
        [key],
      );
      return { error: "INVALID_LOGIN" } as const;
    }
    await client.query("DELETE FROM login_attempts WHERE key_hash=$1", [key]);
    await client.query("DELETE FROM admin_sessions WHERE expires_at<=now()");
    const token = randomBytes(32).toString("hex");
    await client.query(
      "INSERT INTO admin_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",
      [digest(token), user.id],
    );
    await audit(
      client,
      {
        id: user.id,
        email: input.email,
        permissions: new Set(),
        correlationId,
      },
      "LOGIN",
      "ADMIN_USER",
      user.id,
    );
    return { token } as const;
  }, connection);
  if ("error" in outcome)
    throw new AppError(
      outcome.error,
      outcome.error === "RATE_LIMITED" ? 429 : 401,
      outcome.error === "RATE_LIMITED"
        ? "Tạm khóa đăng nhập. Thử lại sau 15 phút."
        : "Email hoặc mật khẩu không đúng.",
    );
  return outcome.token;
}
export async function logout(token: string, actor: Actor): Promise<void> {
  await transaction(async (client) => {
    await client.query("DELETE FROM admin_sessions WHERE token_hash=$1", [
      digest(token),
    ]);
    await audit(client, actor, "LOGOUT", "ADMIN_USER", actor.id);
  });
}
