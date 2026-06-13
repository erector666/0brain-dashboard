import { useRef, useState } from "react";
import { motion, type Variants } from "motion/react";
import { warningForAgent } from "../agents";
import { useCustomAvatars } from "../hooks/useCustomAvatars";
import type { AgentConfig, StatsResponse } from "../types";

const FAMILY_ICONS: Record<string, string> = {
  OpenClaw: "⛧",
  Hermes: "🪶",
};

function getFamilyIcon(agent: AgentConfig): string {
  return FAMILY_ICONS[agent.family] || "◆";
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

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function AgentSidebar({
  agents,
  agentIds,
  selected,
  stats,
  open,
  onSelect,
  onClose,
  onAvatarChange,
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
    useCustomAvatars(
      Object.fromEntries(agentIds.map((id) => [id, getDefaultColor(id)])),
      agentIds
    );
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
              const agentColor = getAgentColor(agent.id) || getDefaultColor(agent.id);
              const isSelected = selected.workspaceId === agent.workspaceId;

              const statItems = [
                ...(agentStats ? [
                  { label: "TOTAL", value: agentStats.total },
                  { label: "UNCONFIRMED", value: agentStats.unconfirmed },
                ] : [
                  { label: "MEMORIES", value: "…" },
                ]),
              ];

              return (
                <motion.button
                  key={agent.workspaceId}
                  className={`profile-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelect(agent)}
                  style={{
                    "--accent": agentColor,
                    "--accent-rgb": hexToRgb(agentColor),
                  } as React.CSSProperties}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Header: avatar + name/handle */}
                  <motion.div variants={itemVariants} className="profile-card-header">
                    {showAvatars ? (
                      <div
                        className="profile-avatar-wrapper"
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
                            className={`profile-avatar-img ${customAvatar ? "custom" : ""}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              const fb = (e.target as HTMLImageElement).parentElement?.querySelector(".profile-avatar-fallback");
                              if (fb) (fb as HTMLElement).style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div className="profile-avatar-fallback" style={{ display: avatarSrc ? "none" : "flex" }}>
                          {agent.name.charAt(0)}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => { fileInputs.current[agent.id] = el; }}
                          style={{ display: "none" }}
                          onChange={(e) => handleFileChange(agent.id, e.target.files?.[0] ?? null)}
                        />
                      </div>
                    ) : null}
                    <div className="profile-card-info">
                      <h2 className="profile-card-name">
                        {agent.name}
                        <span className="profile-card-icon">{getFamilyIcon(agent)}</span>
                      </h2>
                      <p className="profile-card-handle">{agent.family} / {agent.provider === "ob1-agent-memory" ? "OB1" : "0Brain"}</p>
                    </div>
                    <div
                      className="profile-card-swatch"
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
                  </motion.div>

                  {/* Warning / status line */}
                  {warning ? (
                    <motion.div variants={itemVariants} className="profile-card-warning">
                      {warning}
                    </motion.div>
                  ) : null}

                  {/* Stats: memory counts — like the profile card's border-t border-b row */}
                  <motion.div variants={itemVariants} className="profile-card-stats">
                    {statItems.map((stat) => (
                      <div key={stat.label} className="profile-card-stat">
                        <span className="profile-card-stat-value">{stat.value}</span>
                        <span className="profile-card-stat-label">{stat.label}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Bottom info: workspace + status */}
                  <motion.div variants={itemVariants} className="profile-card-meta">
                    <div className="profile-card-meta-item">
                      <span className="profile-card-meta-label">Workspace</span>
                      <span className="profile-card-meta-value">{agent.workspaceId.replace("agent-", "")}</span>
                    </div>
                    <div className="profile-card-meta-item">
                      <span className="profile-card-meta-label">Status</span>
                      <span className={`profile-card-meta-value ${agentStats && agentStats.total > 0 ? "active" : "idle"}`}>
                        {agentStats && agentStats.total > 0 ? "active" : "idle"}
                      </span>
                    </div>
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        ))}
      </aside>
    </>
  );
}

function getDefaultColor(id: string): string {
  const colors: Record<string, string> = {
    sam: "#7c7ee0", tank: "#c9953a", lucifer: "#d96262",
    dean: "#5d8fe0", cass: "#2ea077", crowley: "#957ae0", bobby: "#d9863e",
  };
  return colors[id] || "#6366f1";
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
