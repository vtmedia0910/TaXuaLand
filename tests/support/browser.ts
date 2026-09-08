import { test as base, expect } from "@playwright/test";

export { expect };
export const test = base.extend({
  context: async ({ context, baseURL }, runWithContext) => {
    const external: string[] = [];
    if (process.env.E2E_CORE) {
      const origin = new URL(baseURL!).origin;
      await context.route(/^https?:\/\//, async (route) => {
        if (new URL(route.request().url()).origin === origin)
          await route.continue();
        else {
          external.push(new URL(route.request().url()).origin);
          await route.abort();
        }
      });
    }
    await runWithContext(context);
    expect(external, "Core E2E must not depend on external providers").toEqual(
      [],
    );
  },
});
