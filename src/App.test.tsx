import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the operations console shell", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/memories?")) {
        return new Response(JSON.stringify({ memories: [], page_count: 0 }), { status: 200 });
      }
      return new Response(JSON.stringify({
        schema_version: "openbrain.agent_memory.stats_response.v1",
        workspace_id: "agent-sam",
        total: 0,
        unconfirmed: 0,
        instruction_eligible: 0,
        evidence_eligible: 0,
        page_size_limit: 200,
        recall_limit: 50,
        by_memory_type: {},
        by_review_status: {},
        by_lifecycle_status: {}
      }), { status: 200 });
    }));

    render(<App />);

    expect(screen.getByText("0Brain Dashboard")).toBeInTheDocument();
    expect(screen.getAllByText("Sam").length).toBeGreaterThan(0);
    expect(screen.getByText("Semantic Recall")).toBeInTheDocument();
    expect(await screen.findByText("No memories in this result set.")).toBeInTheDocument();
  });
});
