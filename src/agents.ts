import type { AgentConfig } from "./types";

export const AGENTS: AgentConfig[] = [
  { id: "sam", name: "Sam", workspaceId: "agent-sam", family: "Hermes", provider: "hermes-0brain-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam" },
  { id: "tank", name: "Tank", workspaceId: "agent-tank", family: "Hermes", provider: "hermes-0brain-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tank" },
  { id: "dean", name: "Dean", workspaceId: "agent-main", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dean" },
  { id: "cass", name: "Cass", workspaceId: "agent-cass", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cass" },
  { id: "crowley", name: "Crowley", workspaceId: "agent-crowley", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Crowley" },
  { id: "bobby", name: "Bobby", workspaceId: "agent-bobby", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bobby" },
];

export function warningForAgent(agent: AgentConfig, total?: number) {
  if (agent.expected && total === 0) return "empty";
  if (agent.family === "Unknown") return "unknown source";
  return "";
}
