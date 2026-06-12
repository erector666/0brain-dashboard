import { useRef, useState } from "react";
import { warningForAgent } from "../agents";
import { useCustomAvatars } from "../hooks/useCustomAvatars";
import type { AgentConfig, StatsResponse } from "../types";

const DEFAULT_COLORS: Record<string, string> = {
  sam: "#6366f1",
  tank: "#f59e0b",
  lucifer: "#ef4444",
  dean: "#3b82f6",
  cass: "#10b981",
  crowley: "#8b5cf6",
  bobby: "#f97316",
};

function getRuntimeIcon(agent: AgentConfig): string {
  if (agent.family === "OpenClaw") return "⛧";
  if (agent.family === "Hermes") return "🪶";
  return "◆";
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a2e" : "#ffffff";
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
  selected,
  stats,
  open,
  onSelect
}: {
  agents: AgentConfig[];
  selected: AgentConfig;
  stats: Record<string, StatsResponse | undefined>;
  open: boolean;
  onSelect: (agent: AgentConfig) => void;
}) {
  const [showAvatars, setShowAvatars] = useState(true);
  const { getCustomAvatar, setCustomAvatar, getAgentColor, setAgentColor } = useCustomAvatars(DEFAULT_COLORS);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const colorInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAvatarClick = (agentId: string) => {
    fileInputs.current[agentId]?.click();
  };

  const handleFileChange = async (agentId: string, file: File | null) => {
    if (!file) return;
    await setCustomAvatar(agentId, file);
  };

  const handleColorClick = (agentId: string) => {
    colorInputs.current[agentId]?.click();
  };

  const handleColorChange = (agentId: string, color: string) => {
    setAgentColor(agentId, color);
  };

  return (
    <>
      {open ? <div className="sidebar-overlay" onClick={() => onSelect(selected)} /> : null}
      <aside className={`agent-sidebar${open ? " open" : ""}`}>
        <div className="panel-title agent-sidebar-title">
          <span>Agents</span>
          <label className="avatar-toggle">
            <input
              type="checkbox"
              checked={showAvatars}
              onChange={(e) => setShowAvatars(e.target.checked)}
            />
            <span>Avatars</span>
          </label>
        </div>
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
                <button
                  key={agent.workspaceId}
                  className={`agent-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelect(agent)}
                  style={{
                    "--agent-color": agentColor,
                    "--agent-color-rgb": hexToRgb(agentColor),
                  } as React.CSSProperties}
                >
                  <div className="agent-card-header">
                    {showAvatars && avatarSrc && (
                      <>
                        <div
                          className="agent-avatar-wrapper"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAvatarClick(agent.id);
                          }}
                        >
                          <img
                            src={avatarSrc}
                            alt=""
                            className={`agent-avatar ${customAvatar ? "agent-avatar-custom" : ""}`}
                          />
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
                    )}
                    <div className="agent-card-info">
                      <div className="agent-card-name-row">
                        <span className="agent-name">{agent.name}</span>
                        <span className="agent-runtime-icon" title={agent.family}>{runtimeIcon}</span>
                      </div>
                      <span className="agent-meta">{agent.family} / {agent.provider}</span>
                    </div>
                  </div>
                  <div className="agent-card-footer">
                    <span className="agent-count">{agentStats ? agentStats.total : "..."}</span>
                    <span className="agent-count-label">memories</span>
                    {warning ? <span className="badge warn">{warning}</span> : null}
                  </div>
                  {/* Hidden color picker */}
                  <input
                    type="color"
                    value={agentColor}
                    ref={(el) => { colorInputs.current[agent.id] = el; }}
                    style={{ display: "none" }}
                    onChange={(e) => handleColorChange(agent.id, e.target.value)}
                  />
                </button>
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
