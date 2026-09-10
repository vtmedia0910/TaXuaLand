import type pg from "pg";

/** Read-only gate shared by the local launcher and serverless startup. */
export async function assertRuntimeDatabase(
  pool: InstanceType<typeof pg.Pool>,
): Promise<void> {
  try {
    const product = await pool.query(
      "SELECT product FROM product_identity WHERE id=true",
    );
    await pool.query("SELECT PostGIS_Full_Version()");
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_roles r WHERE pg_has_role(current_user,r.oid,'MEMBER')
        AND (r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolbypassrls)
      ) OR EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND pg_has_role(current_user,c.relowner,'MEMBER')
      ) OR has_schema_privilege(current_user,'public','CREATE')
        OR has_table_privilege(current_user,'admin_users','UPDATE')
        OR has_table_privilege(current_user,'admin_user_roles','INSERT')
        OR has_table_privilege(current_user,'audit_events','DELETE')
        OR has_table_privilege(current_user,'spatial_object_deliveries','INSERT')
        AS unsafe`);
    if (
      product.rows[0]?.product !== "TAXUA_LAND" ||
      result.rows[0]?.unsafe !== false
    )
      throw new Error("Unsafe runtime");
  } catch {
    throw new Error(
      "LAND database readiness failed: identity, PostGIS or runtime privileges (values suppressed)",
    );
  }
}
