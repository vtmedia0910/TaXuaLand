import { describe, expect, it } from "vitest";
import { PHASE, PRODUCT_ID } from "../packages/config/src/index";
describe("product boundary", () => {
  it("identifies its independent product and phase", () => {
    expect(PRODUCT_ID).toBe("TAXUA_LAND");
    expect(PHASE).toBe(0);
  });
});
