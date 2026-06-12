import { describe, expect, it } from "vitest";
import { Ob1Client } from "./ob1Client.js";

describe("Ob1Client", () => {
  it("sends x-brain-key only to the backend request", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = (async (url: URL, init: RequestInit) => {
      calls.push({ url: url.toString(), init });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as typeof fetch;

    const client = new Ob1Client("https://example.test/functions/v1/agent-memory-api", "secret-key", fetchImpl);
    const result = await client.get("/memories", { workspace_id: "agent-tank", limit: 3 });

    expect(result).toEqual({ ok: true });
    expect(calls[0].url).toBe("https://example.test/functions/v1/agent-memory-api/memories?workspace_id=agent-tank&limit=3");
    expect((calls[0].init.headers as Record<string, string>)["x-brain-key"]).toBe("secret-key");
    expect(JSON.stringify(result)).not.toContain("secret-key");
  });
});
