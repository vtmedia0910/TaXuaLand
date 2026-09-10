import { expect, test } from "../support/browser";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const fixtureUsers: string[] = [];
test.afterAll(async () => {
  if (fixtureUsers.length) {
    await pool.query(
      "DELETE FROM admin_sessions WHERE user_id=ANY($1::uuid[])",
      [fixtureUsers],
    );
    await pool.query(
      "UPDATE admin_users SET disabled=true WHERE id=ANY($1::uuid[])",
      [fixtureUsers],
    );
  }
  await pool.end();
});
test("all Admin routes require auth; role changes enforce narrow mutation permissions", async ({
  page,
  request,
  baseURL,
}) => {
  test.setTimeout(90000);
  const id = randomUUID();
  for (const path of [
    "session",
    "places",
    `places/${id}`,
    "sources",
    `sources/${id}/records`,
    "datasets",
    "diagnostics",
    "imports",
    `imports/${id}`,
  ]) {
    expect((await request.get(`/api/admin/${path}`)).status()).toBe(401);
  }
  const cases: [string, string][] = [
    ["places", "edit"],
    ["categories", "edit"],
    ["sources", "configure"],
    ["imports", "import"],
    ["imports/upload-session", "import"],
    [`imports/${id}/finalize-upload`, "import"],
    [`imports/${id}/validate`, "import"],
    [`imports/${id}/commit`, "import"],
    [`places/${id}/verify`, "verify"],
    [`places/${id}/publish`, "publish"],
    ["places/bulk", "edit"],
  ];
  const user = (
    await pool.query(
      "INSERT INTO admin_users(email,password_hash) VALUES($1,'unusable-test-hash') RETURNING id",
      [`qa-role-${randomUUID()}@example.invalid`],
    )
  ).rows[0].id as string;
  fixtureUsers.push(user);
  const token = randomBytes(32).toString("hex");
  await pool.query(
    "INSERT INTO admin_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '10 minutes')",
    [createHash("sha256").update(token).digest("hex"), user],
  );
  await page.context().addCookies([
    {
      name: "land_session",
      value: token,
      url: baseURL!,
      httpOnly: true,
      sameSite: "Strict",
    },
  ]);
  await page.goto("/");
  for (const role of ["DATA_VIEWER", "DATA_EDITOR", "VERIFIER", "PUBLISHER"]) {
    await pool.query("DELETE FROM admin_user_roles WHERE user_id=$1", [user]);
    await pool.query(
      "INSERT INTO admin_user_roles(user_id,role_code) VALUES($1,$2)",
      [user, role],
    );
    const permissions = new Set(
      (
        await pool.query(
          "SELECT permission FROM role_permissions WHERE role_code=$1",
          [role],
        )
      ).rows.map((r) => r.permission),
    );
    for (const [path, permission] of cases) {
      if (permissions.has(permission)) continue;
      const status = await page.evaluate(
        async ({ path, id }) =>
          (
            await fetch(`/api/admin/${path}`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body:
                path === "places/bulk"
                  ? JSON.stringify({
                      action: "ARCHIVE",
                      confirmed: true,
                      items: [{ id, version: 1 }],
                    })
                  : "{}",
            })
          ).status,
        { path, id },
      );
      expect(status, `${role}: ${path}`).toBe(403);
    }
    if (!permissions.has("import")) {
      expect(
        await page.evaluate(
          async (id) =>
            (
              await fetch(`/api/admin/imports/${id}/upload`, {
                method: "PUT",
                body: "not-xlsx",
              })
            ).status,
          id,
        ),
      ).toBe(403);
    }
  }
  await pool.query("UPDATE admin_users SET disabled=true WHERE id=$1", [user]);
  expect(
    await page.evaluate(async () => (await fetch("/api/admin/session")).status),
  ).toBe(401);
});
test("runtime role cannot change credentials or erase audit, and upload boundaries reject before parsing", async ({
  page,
}) => {
  test.setTimeout(60000);
  const role = (
    await pool.query(
      "SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=$1",
      [process.env.E2E_RUNTIME_ROLE ?? "land_app"],
    )
  ).rows[0];
  expect(role).toEqual({
    rolsuper: false,
    rolcreatedb: false,
    rolcreaterole: false,
  });
  const grants = (
    await pool.query(
      "SELECT has_table_privilege($1,'admin_users','UPDATE') AS credentials,has_table_privilege($1,'audit_events','DELETE') AS audit,has_table_privilege($1,'areas_of_interest','UPDATE') AS aoi",
      [process.env.E2E_RUNTIME_ROLE ?? "land_app"],
    )
  ).rows[0];
  expect(grants).toEqual({ credentials: false, audit: false, aoi: false });
  const credentials = JSON.parse(
    await readFile(
      process.env.E2E_CREDENTIALS_FILE ?? "work/local-admin.json",
      "utf8",
    ),
  );
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Mật khẩu").fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const cookies = await page.context().cookies();
  expect(
    cookies.find((cookie) => cookie.name === "land_session"),
  ).toMatchObject({ httpOnly: true, secure: true, sameSite: "Strict" });
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "land_session",
  );
  const status = await page.evaluate(
    async () =>
      (
        await fetch("/api/admin/imports", {
          method: "POST",
          headers: {
            "content-type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "x-file-name": "too-large.xlsx",
          },
          body: new Uint8Array(8 * 1024 * 1024 + 1),
        })
      ).status,
  );
  expect(status).toBe(413);
  const crossOrigin = await page.request.post("/api/admin/places", {
    headers: {
      Origin: "https://attacker.invalid",
      Cookie: `land_session=${cookies.find((cookie) => cookie.name === "land_session")!.value}`,
    },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
  for (const path of [
    "imports/upload-session",
    `imports/${randomUUID()}/finalize-upload`,
  ]) {
    expect(
      (
        await page.request.post(`/api/admin/${path}`, {
          headers: { Origin: "https://untrusted.vercel.app" },
          data: {},
        })
      ).status(),
    ).toBe(403);
  }
  expect(
    (
      await page.request.put(`/api/admin/imports/${randomUUID()}/upload`, {
        headers: { Origin: "https://attacker.invalid" },
        data: "invalid",
      })
    ).status(),
  ).toBe(403);
});
test("lazy engine download failure preserves public search and details", async ({
  page,
}) => {
  const manifest = JSON.parse(
    await readFile("apps/web/.next/react-loadable-manifest.json", "utf8"),
  ) as Record<string, { files: string[] }>;
  const file = Object.entries(manifest)
    .find(([key]) => key.includes("viewer-engine"))![1]
    .files.find((file) => file.endsWith(".js"))!;
  await page.route(`**/_next/${file}`, (route) => route.abort());
  await page.goto("/map");
  await expect(
    page.getByRole("heading", { name: "Không tải được bản đồ 3D" }),
  ).toBeVisible({ timeout: 30000 });
  await expect(
    page.getByRole("button", { name: "Tìm kiếm", exact: true }),
  ).toBeEnabled();
  await page.screenshot({ path: "work/qa-lazy-chunk-fallback.png" });
});
