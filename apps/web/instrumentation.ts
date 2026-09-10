export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  )
    return;
  const { deploymentConfig } =
    await import("../../packages/config/src/deployment");
  const config = deploymentConfig(process.env);
  if (config.LAND_ENVIRONMENT === "PREVIEW") return;
  const { database } = await import("../../services/api/src/db");
  const { assertRuntimeDatabase } =
    await import("../../services/api/src/database-readiness");
  await assertRuntimeDatabase(database());
}
