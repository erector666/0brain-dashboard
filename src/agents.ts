import type { AgentConfig } from "./types";

const DEFAULT_COLORS: Record<string, string> = {
  sam: "#6366f1",
  tank: "#f59e0b",
  lucifer: "#ef4444",
  dean: "#3b82f6",
  cass: "#10b981",
  crowley: "#8b5cf6",
  bobby: "#f97316",
};

export const AGENTS: AgentConfig[] = [
  { id: "sam", name: "Sam", workspaceId: "agent-sam", family: "Hermes", provider: "hermes-0brain-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam", color: DEFAULT_COLORS.sam },
  { id: "tank", name: "Tank", workspaceId: "agent-tank", family: "Hermes", provider: "hermes-0brain-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tank", color: DEFAULT_COLORS.tank },
  { id: "lucifer", name: "Lucifer", workspaceId: "agent-main", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucifer", color: DEFAULT_COLORS.lucifer },
  { id: "dean", name: "Dean", workspaceId: "agent-dean", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dean", color: DEFAULT_COLORS.dean },
  { id: "cass", name: "Cass", workspaceId: "agent-cass", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cass", color: DEFAULT_COLORS.cass },
  { id: "crowley", name: "Crowley", workspaceId: "agent-crowley", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Crowley", color: DEFAULT_COLORS.crowley },
  { id: "bobby", name: "Bobby", workspaceId: "agent-bobby", family: "OpenClaw", provider: "ob1-agent-memory", expected: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bobby", color: DEFAULT_COLORS.bobby },
];

export function warningForAgent(agent: AgentConfig, total?: number) {
  if (agent.expected && total === 0) return "empty";
  if (agent.family === "Unknown") return "unknown source";
  return "";
}
