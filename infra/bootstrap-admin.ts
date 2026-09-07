import pg from "pg";
import { hashPassword } from "../services/api/src/auth.ts";
import { z } from "zod";
const env = z
  .object({
    DATABASE_URL: z.string().url(),
    SERVER_BOOTSTRAP_EMAIL: z.email(),
    SERVER_BOOTSTRAP_PASSWORD: z.string().min(14).max(256),
    SERVER_BOOTSTRAP_ROLE: z.enum([
      "DATA_VIEWER",
      "DATA_EDITOR",
      "VERIFIER",
      "PUBLISHER",
      "SYSTEM_ADMIN",
    ]),
  })
  .parse(process.env);
const client = new pg.Client({ connectionString: env.DATABASE_URL });
try {
  await client.connect();
  const identity = await client.query(
    "SELECT product FROM product_identity WHERE id=true",
  );
  if (identity.rows[0]?.product !== "TAXUA_LAND")
    throw new Error("Not a LAND database");
  const hash = await hashPassword(env.SERVER_BOOTSTRAP_PASSWORD);
  await client.query("BEGIN");
  const user = await client.query<{ id: string }>(
    "INSERT INTO admin_users(email,password_hash) VALUES($1,$2) RETURNING id",
    [env.SERVER_BOOTSTRAP_EMAIL.toLowerCase(), hash],
  );
  await client.query(
    "INSERT INTO admin_user_roles(user_id,role_code) VALUES($1,$2)",
    [user.rows[0]!.id, env.SERVER_BOOTSTRAP_ROLE],
  );
  await client.query("COMMIT");
  console.log(
    "LAND administrator created. Existing accounts were not changed.",
  );
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
