import pg from "pg";
const ownerUrl = process.env.DATABASE_URL,
  password = process.env.DATABASE_APP_PASSWORD;
if (!ownerUrl || !password || password.length < 32)
  throw new Error(
    "Owner URL and a new LAND-only app password (32+ characters) required",
  );
const client = new pg.Client({ connectionString: ownerUrl });
try {
  await client.connect();
  const identity = await client.query(
    "SELECT product FROM product_identity WHERE id=true",
  );
  if (identity.rows[0]?.product !== "TAXUA_LAND")
    throw new Error("Not a LAND database");
  await client.query(
    `CREATE ROLE land_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD ${pg.escapeLiteral(password)}`,
  );
  await client.query("GRANT USAGE ON SCHEMA public TO land_app");
  await client.query("GRANT SELECT ON ALL TABLES IN SCHEMA public TO land_app");
  await client.query(
    "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO land_app",
  );
  await client.query(
    "GRANT INSERT,UPDATE,DELETE ON admin_sessions,login_attempts TO land_app",
  );
  await client.query(
    "GRANT INSERT ON audit_events,source_records,import_row_actions TO land_app",
  );
  await client.query(
    "GRANT INSERT,UPDATE ON places,place_categories,import_batches,import_rows,sources,datasets,dataset_releases,dataset_assets,pipeline_runs,integration_providers,integration_health_checks TO land_app",
  );
  await client.query("GRANT INSERT ON place_geometries TO land_app");
  await client.query("GRANT UPDATE(valid_to) ON place_geometries TO land_app");
  await client.query(
    "GRANT INSERT,UPDATE,DELETE ON place_category_links,place_visit_contexts,place_access_contexts,place_safety_notes,place_media,external_references,import_row_errors TO land_app",
  );
  console.log(
    "LAND runtime role created without ownership or role-management privileges.",
  );
} finally {
  await client.end();
}
