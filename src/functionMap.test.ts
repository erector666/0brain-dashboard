import { describe, expect, it } from "vitest";
import { FUNCTION_MAP } from "./functionMap";

describe("function map", () => {
  it("includes the core backend functions", () => {
    const paths = FUNCTION_MAP.map((fn) => fn.path);
    expect(paths).toContain("/writeback");
    expect(paths).toContain("/recall");
    expect(paths).toContain("/stats");
    expect(paths).toContain("/memories");
  });

  it("marks admin reembed as admin-only", () => {
    expect(FUNCTION_MAP.find((fn) => fn.path === "/admin/reembed")?.usedBy).toBe("Admin");
  });
});
