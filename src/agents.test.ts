import { describe, expect, it } from "vitest";
import { AGENTS, warningForAgent } from "./agents";

describe("agents", () => {
  it("labels Hermes and OpenClaw workspaces", () => {
    expect(AGENTS.find((agent) => agent.workspaceId === "agent-sam")?.family).toBe("Hermes");
    expect(AGENTS.find((agent) => agent.workspaceId === "agent-cass")?.family).toBe("OpenClaw");
  });

  it("warns on agent-main and empty expected agents", () => {
    const main = AGENTS.find((agent) => agent.workspaceId === "agent-main")!;
    const dean = AGENTS.find((agent) => agent.workspaceId === "agent-dean")!;

    expect(warningForAgent(main, 33)).toBe("fallback bucket");
    expect(warningForAgent(dean, 0)).toBe("empty");
  });
});
