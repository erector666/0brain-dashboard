import { useEffect, useMemo, useState } from "react";
import { AGENTS, warningForAgent } from "./agents";
import { fetchMemories, fetchMemoryDetail, fetchReviewQueue, fetchStats } from "./api";
import { AgentSidebar } from "./components/AgentSidebar";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { MemoryDetail } from "./components/MemoryDetail";
import { MemoryTable } from "./components/MemoryTable";
import { SearchPanel } from "./components/SearchPanel";
import { Tabs } from "./components/Tabs";
import { Auth } from "./Auth";
import type { AgentConfig, MemoryRecord, StatsResponse, TabId } from "./types";

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0]);
  const [activeTab, setActiveTab] = useState<TabId>("memories");
  const [stats, setStats] = useState<Record<string, StatsResponse | undefined>>({});
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryRecord | null>(null);
  const [detailMemory, setDetailMemory] = useState<MemoryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      AGENTS.map(async (agent) => {
        try {
          return [agent.workspaceId, await fetchStats(agent.workspaceId, controller.signal)] as const;
        } catch {
          return [agent.workspaceId, undefined] as const;
        }
      })
    ).then((entries) => {
      if (!controller.signal.aborted) setStats(Object.fromEntries(entries));
    });
    return () => controller.abort();
  }, [refreshToken]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const request = activeTab === "review"
      ? fetchReviewQueue(selectedAgent.workspaceId, controller.signal)
      : fetchMemories(selectedAgent.workspaceId, 50, {}, controller.signal);
    request
      .then((result) => {
        if (controller.signal.aborted) return;
        setMemories(result.memories || []);
        setSelectedMemory(result.memories?.[0] || null);
      })
      .catch((err) => {
        if (!controller.signal.aborted && !isAbortLike(err)) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedAgent.workspaceId, activeTab, refreshToken]);

  useEffect(() => {
    if (!selectedMemory?.memory_id) {
      setDetailMemory(null);
      return;
    }

    const controller = new AbortController();
    setDetailMemory(selectedMemory);
    fetchMemoryDetail(selectedMemory.memory_id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDetailMemory(result.memory);
      })
      .catch((err) => {
        if (!controller.signal.aborted && !isAbortLike(err)) setDetailMemory(selectedMemory);
      });
    return () => controller.abort();
  }, [selectedMemory]);

  const selectedStats = stats[selectedAgent.workspaceId];
  const typeSummary = useMemo(() => {
    if (!selectedStats) return [];
    return Object.entries(selectedStats.by_memory_type).filter(([, count]) => count > 0);
  }, [selectedStats]);

  function refresh() {
    setRefreshToken((value) => value + 1);
  }

  return (
    <Auth>
    <div className="app">
      <header>
        <div>
          <h1>0Brain Dashboard</h1>
          <p>Inspect Hermes and OpenClaw agent memories through the shared OB1 backend.</p>
        </div>
        <div className="header-stats">
          <button className="menu-btn" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle agents">☰</button>
          <strong>{selectedAgent.name}</strong>
          <span>{selectedAgent.workspaceId}</span>
          <span>{selectedStats ? `${selectedStats.total} memories` : "loading"}</span>
        </div>
      </header>

      <main>
        <AgentSidebar agents={AGENTS} selected={selectedAgent} stats={stats} open={sidebarOpen} onSelect={(agent) => {
          setSelectedAgent(agent);
          setActiveTab("memories");
          setSidebarOpen(false);
        }} />

        <section className="workspace">
          <div className="workspace-head">
            <div>
              <h2>{selectedAgent.name}</h2>
              <p>{selectedAgent.family} / {selectedAgent.provider}</p>
            </div>
            <button onClick={refresh}>Refresh</button>
          </div>

          <div className="metric-row">
            <Metric label="Total" value={selectedStats?.total ?? "..."} />
            <Metric label="Unconfirmed" value={selectedStats?.unconfirmed ?? "..."} />
            <Metric label="Instruction" value={selectedStats?.instruction_eligible ?? "..."} />
            <Metric label="Types" value={typeSummary.map(([type, count]) => `${type}:${count}`).join(" / ") || "-"} />
          </div>

          <Tabs active={activeTab} onChange={setActiveTab} />
          {error ? <div className="error">{error}</div> : null}
          {loading ? <div className="loading">Loading workspace memories...</div> : null}

          {activeTab === "memories" ? (
            <MemoryTable memories={memories} selectedId={selectedMemory?.memory_id} onSelect={setSelectedMemory} />
          ) : null}
          {activeTab === "review" ? (
            <MemoryTable memories={memories} selectedId={selectedMemory?.memory_id} onSelect={setSelectedMemory} />
          ) : null}
          {activeTab === "recall" ? (
            <SearchPanel agent={selectedAgent} onSelect={setSelectedMemory} />
          ) : null}
          {activeTab === "diagnostics" ? (
            <DiagnosticsPanel agent={selectedAgent} />
          ) : null}
        </section>

        <MemoryDetail agent={selectedAgent} memory={detailMemory || selectedMemory} onChanged={refresh} />
      </main>
    </div>
    </Auth>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isAbortLike(error: unknown) {
  return error instanceof Error && /abort|aborted/i.test(error.message);
}
