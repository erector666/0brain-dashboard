import { useRef, useState } from "react";
import { motion } from "motion/react";
import { warningForAgent } from "../agents";
import { useCustomAvatars } from "../hooks/useCustomAvatars";
import type { AgentConfig, StatsResponse } from "../types";

const DEFAULT_COLORS: Record<string, string> = {
  sam: "#7c7ee0",
  tank: "#c9953a",
  lucifer: "#d96262",
  dean: "#5d8fe0",
  cass: "#2ea077",
  crowley: "#957ae0",
  bobby: "#d9863e",
};

function getRuntimeIcon(agent: AgentConfig): string {
  if (agent.family === "OpenClaw") return "⛧";
  if (agent.family === "Hermes") return "🪶";
  return "◆";
}

function groupAgentsByFamily(agents: AgentConfig[]) {
  const groups: { family: string; agents: AgentConfig[] }[] = [];
  let currentFamily = "";
  let currentGroup: AgentConfig[] = [];

  for (const agent of agents) {
    if (agent.family !== currentFamily) {
      if (currentGroup.length > 0) {
        groups.push({ family: currentFamily, agents: currentGroup });
      }
      currentFamily = agent.family;
      currentGroup = [agent];
    } else {
      currentGroup.push(agent);
    }
  }
  if (currentGroup.length > 0) {
    groups.push({ family: currentFamily, agents: currentGroup });
  }
  return groups;
}

export function AgentSidebar({
  agents,
  agentIds,
  selected,
  stats,
  open,
  onSelect,
  onClose,
  onAvatarChange
}: {
  agents: AgentConfig[];
  agentIds: string[];
  selected: AgentConfig;
  stats: Record<string, StatsResponse | undefined>;
  open: boolean;
  onSelect: (agent: AgentConfig) => void;
  onClose: () => void;
  onAvatarChange?: () => void;
}) {
  const [showAvatars, setShowAvatars] = useState(true);
  const { getCustomAvatar, setCustomAvatar, getAgentColor, setAgentColor, avatarError, setAvatarError } =
    useCustomAvatars(DEFAULT_COLORS, agentIds);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const colorInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAvatarClick = (agentId: string) => {
    fileInputs.current[agentId]?.click();
  };

  const handleFileChange = async (agentId: string, file: File | null) => {
    if (!file) return;
    await setCustomAvatar(agentId, file);
    const input = fileInputs.current[agentId];
    if (input) input.value = "";
    onAvatarChange?.();
  };

  const handleColorClick = (agentId: string) => {
    colorInputs.current[agentId]?.click();
  };

  const handleColorChange = (agentId: string, color: string) => {
    setAgentColor(agentId, color);
  };

  return (
    <>
      {open ? <div className="sidebar-overlay" onClick={onClose} /> : null}
      <aside className={`sidebar-panel${open ? " open" : ""}`} aria-label="Agent sidebar">
        <div className="sidebar-title">
          <span>Agents</span>
          <label className="avatar-toggle">
            <input type="checkbox" checked={showAvatars} onChange={(e) => setShowAvatars(e.target.checked)} />
            <span>Avatars</span>
          </label>
        </div>

        {avatarError ? (
          <div className="sidebar-error">
            {avatarError}
            <button className="sidebar-error-dismiss" onClick={() => setAvatarError("")} aria-label="Dismiss">✕</button>
          </div>
        ) : null}

        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">✕</button>

        {groupAgentsByFamily(agents).map((group) => (
          <div key={group.family} className="agent-group">
            <div className="agent-group-label">{group.family}</div>
            {group.agents.map((agent) => {
              const agentStats = stats[agent.workspaceId];
              const warning = warningForAgent(agent, agentStats?.total);
              const customAvatar = getCustomAvatar(agent.id);
              const avatarSrc = customAvatar || agent.avatar;
              const agentColor = getAgentColor(agent.id) || DEFAULT_COLORS[agent.id] || "#6366f1";
              const isSelected = selected.workspaceId === agent.workspaceId;
              const runtimeIcon = getRuntimeIcon(agent);

              return (
                <motion.button
                  key={agent.workspaceId}
                  className={`agent-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelect(agent)}
                  style={{
                    "--agent-color": agentColor,
                    "--agent-color-rgb": hexToRgb(agentColor),
                  } as React.CSSProperties}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                >
                  <div className="agent-card-header">
                    {showAvatars ? (
                      <>
                        <div
                          className="agent-avatar-wrapper"
                          onClick={(e) => { e.stopPropagation(); handleAvatarClick(agent.id); }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              handleAvatarClick(agent.id);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          title="Click to change avatar"
                        >
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={agent.name}
                              loading="lazy"
                              className={`agent-avatar-img ${customAvatar ? "agent-avatar-custom" : ""}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                const fb = (e.target as HTMLImageElement).parentElement?.querySelector(".agent-avatar-fallback");
                                if (fb) (fb as HTMLElement).style.display = "grid";
                              }}
                            />
                          ) : null}
                          <div className="agent-avatar-fallback" style={{ display: avatarSrc ? "none" : "grid" }}>
                            {agent.name.charAt(0)}
                          </div>
                          <div className="agent-avatar-ring" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => { fileInputs.current[agent.id] = el; }}
                          style={{ display: "none" }}
                          onChange={(e) => handleFileChange(agent.id, e.target.files?.[0] ?? null)}
                        />
                      </>
                    ) : null}
                    <div className="agent-card-info">
                      <div className="agent-card-name-row">
                        <span className="agent-name">{agent.name}</span>
                        <span className="agent-runtime-icon" title={agent.family}>{runtimeIcon}</span>
                      </div>
                      <span className="agent-meta">{agent.family} / {agent.provider}</span>
                    </div>
                    <div
                      className="agent-color-swatch"
                      onClick={(e) => { e.stopPropagation(); handleColorClick(agent.id); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          handleColorClick(agent.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title="Change accent color"
                    />
                    <input
                      type="color"
                      value={agentColor}
                      ref={(el) => { colorInputs.current[agent.id] = el; }}
                      style={{ display: "none" }}
                      onChange={(e) => handleColorChange(agent.id, e.target.value)}
                    />
                  </div>
                  <div className="agent-card-footer">
                    <span className="agent-count">{agentStats ? agentStats.total : "..."}</span>
                    <span className="agent-count-label">memories</span>
                    {warning ? <span className="badge warn">{warning}</span> : null}
                  </div>
                </motion.button>
              );
            })}
          </div>
        ))}
      </aside>
    </>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
