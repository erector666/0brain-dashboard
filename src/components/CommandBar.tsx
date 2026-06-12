import { Activity, BrainCircuit, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import type { AgentConfig, StatsResponse } from "../types";
import { compactNumber } from "../lib/ui";

export function CommandBar({
  agent,
  stats,
  onRefresh
}: {
  agent: AgentConfig;
  stats?: StatsResponse;
  onRefresh: () => void;
}) {
  const hasPressure = Boolean(stats && stats.unconfirmed > 0);

  return (
    <motion.header
      className="command-bar"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <div className="brand-lockup">
        <div className="brand-mark">
          <BrainCircuit size={22} />
          <span className="brand-pulse" />
        </div>
        <div>
          <h1>OB1 NeuroOps</h1>
          <p>Agent memory observability console</p>
        </div>
      </div>

      <div className="command-status">
        <div className="command-chip">
          <Activity size={15} />
          <span>{agent.name}</span>
          <strong>{agent.workspaceId}</strong>
        </div>

        <div className="command-chip">
          <ShieldCheck size={15} />
          <span>{compactNumber(stats?.total)} memories</span>
        </div>

        <div className={`command-chip ${hasPressure ? "chip-warn" : ""}`}>
          <TriangleAlert size={15} />
          <span>{compactNumber(stats?.unconfirmed)} review</span>
        </div>

        <button className="btn-primary command-refresh" onClick={onRefresh}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
    </motion.header>
  );
}
