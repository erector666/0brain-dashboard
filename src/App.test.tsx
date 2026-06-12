import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

// Mock supabase to avoid needing real auth in test environment
vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { email: "kango666@gmail.com" } } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

const STATS_RESPONSE = {
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
};

describe("App", () => {
  it("renders the operations console shell", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/memories?")) {
        return new Response(JSON.stringify({ memories: [], page_count: 0 }), { status: 200 });
      }
      return new Response(JSON.stringify(STATS_RESPONSE), { status: 200 });
    }));

    render(<App />);

    expect(await screen.findByText("OB1 NeuroOps", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getAllByText("Sam").length).toBeGreaterThan(0);
    expect(screen.getByText("Semantic Recall")).toBeInTheDocument();
    expect(await screen.findByText("No memories in this result set.")).toBeInTheDocument();
  });
});
