import { z } from "zod";

const loopback = (host: string) =>
  ["localhost", "127.0.0.1", "[::1]"].includes(host);
export const ExactOrigin = z
  .string()
  .url()
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/" &&
      !url.hostname.includes("*") &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" && loopback(url.hostname)))
    );
  });

export const DeploymentEnvironment = z.enum([
  "LOCAL",
  "PREVIEW",
  "STAGING",
  "PRODUCTION",
]);
const OriginEnvironment = z
  .object({
    LAND_ENVIRONMENT: DeploymentEnvironment.default("LOCAL"),
    SERVER_ORIGIN: ExactOrigin,
    LAND_PREVIEW_ENABLED: z.enum(["true", "false"]).default("false"),
    VERCEL: z.string().optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_URL: z.string().optional(),
  })
  .strip()
  .superRefine((env, ctx) => {
    const fail = () =>
      ctx.addIssue({
        code: "custom",
        message: "Invalid deployment origin policy",
      });
    if (!URL.canParse(env.SERVER_ORIGIN)) return fail();
    const url = new URL(env.SERVER_ORIGIN);
    if (env.LAND_ENVIRONMENT === "LOCAL") {
      if (
        !loopback(url.hostname) ||
        env.VERCEL === "1" ||
        (env.VERCEL_ENV && env.VERCEL_ENV !== "development")
      )
        fail();
    } else if (url.protocol !== "https:" || loopback(url.hostname)) fail();
    if (env.VERCEL_ENV === "preview" && env.LAND_ENVIRONMENT !== "PREVIEW")
      fail();
    if (env.LAND_ENVIRONMENT === "PREVIEW") {
      if (
        env.LAND_PREVIEW_ENABLED !== "true" ||
        env.VERCEL_ENV !== "preview" ||
        !env.VERCEL_URL ||
        !/^[a-z0-9-]+\.vercel\.app$/.test(env.VERCEL_URL) ||
        url.origin !== `https://${env.VERCEL_URL}`
      )
        fail();
    } else if (env.LAND_PREVIEW_ENABLED !== "false") fail();
  });

/** Read only explicit deployment configuration; never derive trust from request headers. */
export function deploymentOrigin(input: Record<string, string | undefined>) {
  const result = OriginEnvironment.safeParse(input);
  if (!result.success)
    throw new Error(
      "LAND deployment origin configuration invalid (values suppressed)",
    );
  return new URL(result.data.SERVER_ORIGIN).origin;
}

export const DeploymentConfig = z
  .object({
    LAND_ENVIRONMENT: DeploymentEnvironment.default("LOCAL"),
    SERVER_ORIGIN: ExactOrigin,
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => /^postgres(ql)?:/.test(v))
      .optional(),
    OBJECT_STORE_DRIVER: z.enum(["local", "s3"]).default("local"),
    OBJECT_STORE_ENDPOINT: z.url().optional(),
    OBJECT_STORE_REGION: z.string().min(1).optional(),
    OBJECT_STORE_ACCESS_KEY_ID: z.string().min(1).optional(),
    OBJECT_STORE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    PRIVATE_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)
      .optional(),
    PUBLISHED_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)
      .optional(),
    PUBLIC_ASSET_BASE_URL: ExactOrigin.optional(),
    SIGNED_UPLOAD_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(30)
      .max(600)
      .default(300),
    IMPORT_RETENTION_DAYS: z.coerce.number().int().min(1).max(7).default(7),
    LAND_PREVIEW_ENABLED: z.enum(["true", "false"]).default("false"),
    VERCEL: z.string().optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_URL: z.string().optional(),
  })
  .strip()
  .superRefine((env, ctx) => {
    const fail = () =>
      ctx.addIssue({
        code: "custom",
        message: "Invalid deployment configuration",
      });
    if (!OriginEnvironment.safeParse(env).success) fail();
    if (env.LAND_ENVIRONMENT === "PREVIEW") {
      if (
        env.DATABASE_URL ||
        env.OBJECT_STORE_ACCESS_KEY_ID ||
        env.OBJECT_STORE_SECRET_ACCESS_KEY ||
        env.OBJECT_STORE_DRIVER !== "local"
      )
        fail();
      return;
    }
    if (!env.DATABASE_URL) fail();
    if (
      ["STAGING", "PRODUCTION"].includes(env.LAND_ENVIRONMENT) &&
      env.OBJECT_STORE_DRIVER !== "s3"
    )
      fail();
    if (env.OBJECT_STORE_DRIVER === "s3") {
      if (
        !env.OBJECT_STORE_ENDPOINT ||
        !env.OBJECT_STORE_REGION ||
        !env.OBJECT_STORE_ACCESS_KEY_ID ||
        !env.OBJECT_STORE_SECRET_ACCESS_KEY ||
        !env.PRIVATE_BUCKET ||
        !env.PUBLISHED_BUCKET ||
        env.PRIVATE_BUCKET === env.PUBLISHED_BUCKET ||
        !env.PUBLIC_ASSET_BASE_URL
      )
        fail();
      if (env.OBJECT_STORE_ENDPOINT) {
        if (!URL.canParse(env.OBJECT_STORE_ENDPOINT)) return fail();
        const endpoint = new URL(env.OBJECT_STORE_ENDPOINT);
        if (
          endpoint.username ||
          endpoint.password ||
          endpoint.search ||
          endpoint.hash ||
          endpoint.pathname !== "/" ||
          endpoint.hostname.includes("*") ||
          (endpoint.protocol !== "https:" &&
            !(
              env.LAND_ENVIRONMENT === "LOCAL" &&
              endpoint.protocol === "http:" &&
              loopback(endpoint.hostname)
            ))
        )
          fail();
      }
      if (
        env.PUBLIC_ASSET_BASE_URL &&
        (!URL.canParse(env.PUBLIC_ASSET_BASE_URL) ||
          new URL(env.PUBLIC_ASSET_BASE_URL).protocol !== "https:")
      )
        fail();
    }
  });

export function deploymentConfig(input: Record<string, string | undefined>) {
  const result = DeploymentConfig.safeParse(input);
  if (!result.success)
    throw new Error(
      "LAND deployment configuration invalid (values suppressed)",
    );
  return result.data;
}

/** Previews have no database authority, including when credentials were accidentally injected. */
export function assertDatabaseEnabled(
  input: Record<string, string | undefined>,
) {
  if (input.LAND_ENVIRONMENT === "PREVIEW" || input.VERCEL_ENV === "preview")
    throw new Error("LAND preview database access disabled");
}
