import { useEffect, useState } from "react";
import { fetchHealth, fetchMemories, fetchStats, runRecall } from "../api";
import { FUNCTION_MAP } from "../functionMap";
import { BrainMap } from "./BrainMap";
import type { AgentConfig } from "../types";

type CheckState = Record<string, string>;

export function DiagnosticsPanel({ agent }: { agent: AgentConfig }) {
  const [checks, setChecks] = useState<CheckState>({});

  useEffect(() => {
    let cancelled = false;
    async function runChecks() {
      const next: CheckState = {};
      try {
        const health = await fetchHealth();
        next["/health"] = health.ok ? "ok" : "failed";
      } catch {
        next["/health"] = "failed";
      }
      try {
        const stats = await fetchStats(agent.workspaceId);
        next["/stats"] = `${stats.total} memories`;
      } catch {
        next["/stats"] = "failed";
      }
      try {
        const memories = await fetchMemories(agent.workspaceId, 2);
        next["/memories"] = `${memories.page_count} returned`;
      } catch {
        next["/memories"] = "failed";
      }
      try {
        const recall = await runRecall(agent.workspaceId, "recent work session", 2, true);
        next["/recall"] = `${recall.memories.length} ${recall.memories[0]?.retrieval?.strategy || "results"}`;
      } catch {
        next["/recall"] = "failed";
      }
      try {
        const reviewParams = new URLSearchParams({ workspace_id: agent.workspaceId });
        const reviewResponse = await fetch(`/api/ob1/memories/review?${reviewParams}`);
        const reviewData = await reviewResponse.json();
        next["/memories/review"] = reviewData.memories ? `${reviewData.memories.length} pending` : "ok";
      } catch {
        next["/memories/review"] = "failed";
      }
      if (!cancelled) setChecks(next);
    }
    runChecks();
    return () => {
      cancelled = true;
    };
  }, [agent.workspaceId]);

  return (
    <div className="diagnostics-layout">
      <BrainMap checks={checks} />
      <div className="function-grid">
        {FUNCTION_MAP.map((fn) => (
          <div className="function-card" key={`${fn.method}-${fn.path}`}>
            <div className="function-head">
              <div className="function-head-left">
                <strong>{fn.method} {fn.path}</strong>
              </div>
              <span className="function-used-by">{fn.usedBy}</span>
            </div>
            <p className="function-purpose">{fn.purpose}</p>
            <div className={`function-check ${fn.safeCheck ? "check-ok" : "check-muted"}`}>
              <span className="check-icon">{fn.safeCheck ? "✓" : "○"}</span>
              <span>{fn.safeCheck ? checks[fn.path] || "checking..." : "manual/safe-action only"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
