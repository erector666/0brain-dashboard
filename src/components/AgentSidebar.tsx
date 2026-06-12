import { useRef, useState } from "react";
import { warningForAgent } from "../agents";
import { useCustomAvatars } from "../hooks/useCustomAvatars";
import type { AgentConfig, StatsResponse } from "../types";

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
  onSelect
}: {
  agents: AgentConfig[];
  selected: AgentConfig;
  stats: Record<string, StatsResponse | undefined>;
  onSelect: (agent: AgentConfig) => void;
}) {
  const [showAvatars, setShowAvatars] = useState(true);
  const { getCustomAvatar, setCustomAvatar } = useCustomAvatars();
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAvatarClick = (agentId: string) => {
    fileInputs.current[agentId]?.click();
  };

  const handleFileChange = async (agentId: string, file: File | null) => {
    if (!file) return;
    await setCustomAvatar(agentId, file);
  };

  return (
    <aside className="agent-sidebar">
      <div className="panel-title">
        Agents
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
        <div key={group.family}>
          <div className="agent-group-label">{group.family}</div>
          {group.agents.map((agent) => {
        const agentStats = stats[agent.workspaceId];
        const warning = warningForAgent(agent, agentStats?.total);
        const customAvatar = getCustomAvatar(agent.id);
        const avatarSrc = customAvatar || agent.avatar;

        return (
          <button
            key={agent.workspaceId}
            className={`agent-row ${selected.workspaceId === agent.workspaceId ? "selected" : ""}`}
            onClick={() => onSelect(agent)}
          >
            {showAvatars && avatarSrc && (
              <>
                <img
                  src={avatarSrc}
                  alt=""
                  className={`agent-avatar ${customAvatar ? "agent-avatar-custom" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAvatarClick(agent.id);
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileInputs.current[agent.id] = el; }}
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(agent.id, e.target.files?.[0] ?? null)}
                />
              </>
            )}
            <span className="agent-name">{agent.name}</span>
            <span className="agent-meta">{agent.family} / {agent.provider}</span>
            <span className="agent-count">{agentStats ? agentStats.total : "..."}</span>
            {warning ? <span className="badge warn">{warning}</span> : null}
          </button>
        );
      })}
        </div>
      ))}
    </aside>
  );
}
