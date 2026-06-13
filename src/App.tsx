import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AGENTS } from "./agents";
import { fetchHealth, fetchMemories, fetchMemoryDetail, fetchReviewQueue, fetchStats } from "./api";
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

const COLOR_STORAGE_KEY = "0brain…lors";

function loadAgentColors(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(COLOR_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Minimal focus trap: auto-focuses first focusable child on mount,
 *  then traps Tab/Shift+Tab within the container. */
function FocusTrap({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const focusable = el.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // Defer focus to avoid layout shift
    requestAnimationFrame(() => focusable?.focus());
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const el = root.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return (
    <div ref={root} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0]);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("memories");
  const [stats, setStats] = useState<Record<string, StatsResponse | undefined>>({});
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryRecord | null>(null);
  const [detailMemory, setDetailMemory] = useState<MemoryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [healthOnline, setHealthOnline] = useState<boolean | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [, forceRender] = useState(0);
  const agentIds = AGENTS.map((a) => a.id);

  useEffect(() => {
    const customColors = loadAgentColors();
    const agentColor = customColors[selectedAgent.id] || selectedAgent.color || "#3b82f6";
    const r = parseInt(agentColor.slice(1, 3), 16);
    const g = parseInt(agentColor.slice(3, 5), 16);
    const b = parseInt(agentColor.slice(5, 7), 16);
    const rgb = `${r}, ${g}, ${b}`;
    document.documentElement.style.setProperty("--agent-accent", agentColor);
    document.documentElement.style.setProperty("--agent-accent-rgb", rgb);
    document.documentElement.style.setProperty("--agent-accent-light", `${agentColor}1a`);
    document.documentElement.style.setProperty("--agent-accent-glow", `rgba(${rgb}, 0.12)`);
  }, [selectedAgent]);

  useEffect(() => {
    const handler = () => { setRefreshToken((v) => v + 1); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Stats effect: batch fetch ALL agents.
  // Depends on selectedAgent so switching agents triggers a fresh fetch.
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
      if (!controller.signal.aborted) {
        setStats(Object.fromEntries(entries));
        setLastRefresh(new Date());
      }
    });
    return () => controller.abort();
  }, [selectedAgent, refreshToken]);

  // Health check — uses AbortController for proper cancellation.
  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((h) => { if (!controller.signal.aborted) setHealthOnline(h.ok); })
      .catch(() => { if (!controller.signal.aborted) setHealthOnline(false); });
    return () => controller.abort();
  }, [refreshToken]);

  // Fetch memories or review queue for the active tab.
  // Preserves existing selectedMemory if it still exists in new data.
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
        const incoming = result.memories || [];
        setMemories(incoming);
        // Preserve existing selection if it still exists in new data
        if (selectedMemory) {
          const stillPresent = incoming.find(m => m.memory_id === selectedMemory.memory_id);
          if (!stillPresent) setSelectedMemory(incoming[0] || null);
        } else {
          setSelectedMemory(incoming[0] || null);
        }
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

  // Fetch memory detail for selected memory.
  // Clears detailMemory immediately so portal shows list-level fallback during fetch.
  useEffect(() => {
    if (!selectedMemory?.memory_id) {
      setDetailMemory(null);
      return;
    }
    // Clear stale detail from previous memory to avoid flash of wrong data
    setDetailMemory(null);
    const controller = new AbortController();
    fetchMemoryDetail(selectedMemory.memory_id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDetailMemory(result.memory);
      })
      .catch((err) => {
        if (!controller.signal.aborted && !isAbortLike(err)) {
          // Fall back to list-level object on error
          setDetailMemory(selectedMemory);
        }
      });
    return () => controller.abort();
  }, [selectedMemory]);

  const selectedStats = stats[selectedAgent.workspaceId];

  function refresh() {
    setRefreshToken((value) => value + 1);
  }

  function handleSelectAgent(agent: AgentConfig) {
    setSelectedAgent(agent);
    setActiveTab("memories");
    setSidebarOpen(false);
  }

  function handleSelectMemory(memory: MemoryRecord) {
    setSelectedMemory(memory);
    lastFocusRef.current = document.activeElement as HTMLElement;
    setDetailOpen(true);
  }

  function closeDetail() {
    setDetailOpen(false);
    // Restore focus to the element that triggered the portal
    requestAnimationFrame(() => lastFocusRef.current?.focus());
  }

  return (
    <Auth>
    <a href="#workspace-panel" className="skip-link">Skip to main content</a>
    <NeuralBackdrop />
    <div className="app">
      <CommandBar
        agent={selectedAgent}
        stats={selectedStats}
        healthOnline={healthOnline}
        lastRefresh={lastRefresh}
        onRefresh={refresh}
        onMenuToggle={() => setSidebarOpen(true)}
      />

      <main className="main-layout">
        <AgentSidebar
          agents={AGENTS}
          agentIds={agentIds}
          selected={selectedAgent}
          stats={stats}
          open={sidebarOpen}
          onSelect={handleSelectAgent}
          onClose={() => setSidebarOpen(false)}
          onAvatarChange={() => forceRender((v) => v + 1)}
        />

        <section id="workspace-panel" className="workspace-panel" role="tabpanel" aria-label={`Showing ${activeTab} view`}>
          <div className="workspace-head">
            <h2>{selectedAgent.name}</h2>
            <p>{selectedAgent.workspaceId} · {selectedAgent.family} · {selectedAgent.provider}</p>
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
          {error ? <div className="error" role="alert">{error}</div> : null}
          {loading && !error ? <div className="loading" aria-busy="true">Loading workspace memories...</div> : null}
          {!loading || error ? (
            <>
              {activeTab === "memories" ? (
                <MemoryStream memories={memories} selectedId={selectedMemory?.memory_id} onSelect={handleSelectMemory} />
              ) : null}
              {activeTab === "review" ? (
                <MemoryStream memories={memories} selectedId={selectedMemory?.memory_id} onSelect={handleSelectMemory} />
              ) : null}
              {activeTab === "recall" ? (
                <SearchPanel agent={selectedAgent} selectedId={selectedMemory?.memory_id} onSelect={handleSelectMemory} />
              ) : null}
              {activeTab === "diagnostics" ? (
                <DiagnosticsPanel agent={selectedAgent} />
              ) : null}
            </>
          ) : null}
        </section>
      </main>

      {detailOpen
        ? createPortal(
            <FocusTrap>
              <div className="detail-overlay" onClick={closeDetail} role="dialog" aria-modal="true" aria-label="Memory detail">
                <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
                  <button className="detail-drawer-close" onClick={closeDetail} aria-label="Close detail">×</button>
                  <MemoryDetail agent={selectedAgent} memory={detailMemory || selectedMemory} onChanged={refresh} />
                </div>
              </div>
            </FocusTrap>,
            document.body
          )
        : null}
    </div>
    </Auth>
  );
}

function isAbortLike(error: unknown) {
  return error instanceof Error && /abort|aborted/i.test(error.message);
}
