import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { warningForAgent } from "../agents";
import { useCustomAvatars } from "../hooks/useCustomAvatars";
import { Database, Activity, Shield, type LucideIcon } from "lucide-react";
import type { AgentConfig, StatsResponse } from "../types";

const FAMILY_ICONS: Record<string, string> = {
  OpenClaw: "⛧",
  Hermes: "🪶",
};

function getFamilyIcon(agent: AgentConfig): string {
  return FAMILY_ICONS[agent.family] || "◆";
}

/** Label + value pair, same pattern as the flight card InfoItem */
const InfoItem = ({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) => (
  <div className="agent-info-item">
    {Icon && <Icon size={12} className="agent-info-icon" />}
    <span className="agent-info-value">{value}</span>
    <span className="agent-info-label">{label}</span>
  </div>
);

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

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, when: "beforeChildren", staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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
      Object.fromEntries(agentIds.map((id) => [id, id === "sam" ? "#7c7ee0" : id === "tank" ? "#c9953a" : id === "lucifer" ? "#d96262" : id === "dean" ? "#5d8fe0" : id === "cass" ? "#2ea077" : id === "crowley" ? "#957ae0" : id === "bobby" ? "#d9863e" : "#6366f1"])),
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
              const agentColor = getAgentColor(agent.id) || (agent.id === "sam" ? "#7c7ee0" : agent.id === "tank" ? "#c9953a" : agent.id === "lucifer" ? "#d96262" : agent.id === "dean" ? "#5d8fe0" : agent.id === "cass" ? "#2ea077" : agent.id === "crowley" ? "#957ae0" : agent.id === "bobby" ? "#d9863e" : "#6366f1");
              const isSelected = selected.workspaceId === agent.workspaceId;

              return (
                <motion.button
                  key={agent.workspaceId}
                  className={`agent-card ${isSelected ? "selected" : ""}`}
                  onClick={() => onSelect(agent)}
                  style={{
                    "--agent-color": agentColor,
                    "--agent-color-rgb": hexToRgb(agentColor),
                  } as React.CSSProperties}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.02, transition: { duration: 0.25 } }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Agent image / avatar header */}
                  <div className="agent-card-image" style={{ backgroundColor: `${agentColor}22` }}>
                    {showAvatars ? (
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
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      ref={(el) => { fileInputs.current[agent.id] = el; }}
                      style={{ display: "none" }}
                      onChange={(e) => handleFileChange(agent.id, e.target.files?.[0] ?? null)}
                    />
                  </div>

                  {/* Details */}
                  <div className="agent-card-body">
                    <motion.div variants={itemVariants} className="agent-card-route">
                      <div className="agent-card-origin">
                        <span className="agent-card-primary">{agent.name}</span>
                        <span className="agent-card-sub">{agent.family}</span>
                      </div>
                      <div className="agent-card-connector">
                        <span className="agent-card-code">{getFamilyIcon(agent)}</span>
                      </div>
                      <div className="agent-card-dest">
                        <span className="agent-card-primary">{agentStats ? agentStats.total : "..."}</span>
                        <span className="agent-card-sub">memories</span>
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="agent-card-divider" />

                    <motion.div variants={itemVariants} className="agent-card-info-row">
                      <InfoItem label="Provider" value={agent.provider === "ob1-agent-memory" ? "OB1" : "0Brain"} icon={Database} />
                      <InfoItem label="Workspace" value={agent.workspaceId.replace("agent-", "")} icon={Activity} />
                      <InfoItem
                        label="Status"
                        value={warning ? warning : agentStats && agentStats.total > 0 ? "active" : "idle"}
                        icon={Shield}
                      />
                    </motion.div>

                    {/* Color picker */}
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
