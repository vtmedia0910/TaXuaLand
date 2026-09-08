import { z } from "zod";
export const RuntimeEnvironment = z
  .object({
    DATABASE_URL: z
      .string()
      .url()
      .refine((value) => /^postgres(ql)?:/.test(value)),
    SERVER_ORIGIN: z
      .string()
      .url()
      .refine((value) => {
        const url = new URL(value);
        return (
          !url.username &&
          !url.password &&
          url.pathname === "/" &&
          !url.search &&
          !url.hash &&
          (url.protocol === "https:" ||
            (url.protocol === "http:" &&
              ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
        );
      }),
    LAND_WORKSPACE_ROOT: z.string().min(1),
  })
  .strip();
