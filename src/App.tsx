import { useEffect, useState } from "react";
import { AGENTS } from "./agents";
import { fetchMemories, fetchMemoryDetail, fetchReviewQueue, fetchStats } from "./api";
import { AgentSidebar } from "./components/AgentSidebar";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { MemoryDetail } from "./components/MemoryDetail";
import { SearchPanel } from "./components/SearchPanel";
import { Tabs } from "./components/Tabs";
import { NeuralBackdrop } from "./components/NeuralBackdrop";
import { CommandBar } from "./components/CommandBar";
import { MetricOrb } from "./components/MetricOrb";
import { LifecycleRing } from "./components/LifecycleRing";
import { MemoryStream } from "./components/MemoryStream";
import { Auth } from "./Auth";
import type { AgentConfig, MemoryRecord, StatsResponse, TabId } from "./types";

const COLOR_STORAGE_KEY = "0brain-agent-colors";

function loadAgentColors(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

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

  // Inject CSS custom properties based on selected agent's color
  useEffect(() => {
    const customColors = loadAgentColors();
    const agentColor = customColors[selectedAgent.id] || selectedAgent.color || "#3b82f6";

    // Parse RGB for alpha usage
    const r = parseInt(agentColor.slice(1, 3), 16);
    const g = parseInt(agentColor.slice(3, 5), 16);
    const b = parseInt(agentColor.slice(5, 7), 16);
    const rgb = `${r}, ${g}, ${b}`;

    document.documentElement.style.setProperty("--agent-accent", agentColor);
    document.documentElement.style.setProperty("--agent-accent-rgb", rgb);
    document.documentElement.style.setProperty("--agent-accent-light", `${agentColor}1a`);
    document.documentElement.style.setProperty("--agent-accent-glow", `rgba(${rgb}, 0.12)`);
  }, [selectedAgent]);

  // Listen for color changes from sidebar (storage event fires in other tabs)
  useEffect(() => {
    const handler = () => {
      setRefreshToken((v) => v + 1);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

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

  function refresh() {
    setRefreshToken((value) => value + 1);
  }

  return (
    <Auth>
    <NeuralBackdrop />
    <div className="app">
      <CommandBar agent={selectedAgent} stats={selectedStats} onRefresh={refresh} />

      <main className="main-layout">
        <AgentSidebar agents={AGENTS} selected={selectedAgent} stats={stats} open={sidebarOpen} onSelect={(agent) => {
          setSelectedAgent(agent);
          setActiveTab("memories");
          setSidebarOpen(false);
        }} />

        <section className="workspace-panel">
          <div className="workspace-head">
            <div>
              <h2>{selectedAgent.name}</h2>
              <p>{selectedAgent.family} / {selectedAgent.provider}</p>
            </div>
          </div>

          <div className="ops-grid">
            <div className="metric-orb-row">
              <MetricOrb label="Total memory" value={selectedStats?.total} detail={selectedAgent.workspaceId} tone="info" />
              <MetricOrb label="Review pressure" value={selectedStats?.unconfirmed} detail="unconfirmed" tone={(selectedStats?.unconfirmed || 0) > 0 ? "warn" : "good"} />
              <MetricOrb label="Instruction ready" value={selectedStats?.instruction_eligible} detail="usable as instruction" tone="good" />
              <MetricOrb label="Evidence ready" value={selectedStats?.evidence_eligible} detail="usable as evidence" tone="neutral" />
            </div>

            <LifecycleRing lifecycle={selectedStats?.by_lifecycle_status} review={selectedStats?.by_review_status} />
          </div>

          <Tabs active={activeTab} onChange={setActiveTab} />
          {error ? <div className="error">{error}</div> : null}
          {loading ? <div className="loading">Loading workspace memories...</div> : null}

          {activeTab === "memories" ? (
            <MemoryStream memories={memories} selectedId={selectedMemory?.memory_id} onSelect={setSelectedMemory} />
          ) : null}
          {activeTab === "review" ? (
            <MemoryStream memories={memories} selectedId={selectedMemory?.memory_id} onSelect={setSelectedMemory} />
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

function isAbortLike(error: unknown) {
  return error instanceof Error && /abort|aborted/i.test(error.message);
}
