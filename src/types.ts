export type RuntimeFamily = "Hermes" | "OpenClaw" | "Unknown";

export type AgentConfig = {
  id: string;
  name: string;
  workspaceId: string;
  family: RuntimeFamily;
  provider: "hermes-0brain-memory" | "ob1-agent-memory" | "suspect";
  expected: boolean;
  avatar?: string;
  color?: string;
};

export type StatsResponse = {
  schema_version: string;
  workspace_id: string;
  total: number;
  unconfirmed: number;
  instruction_eligible: number;
  evidence_eligible: number;
  page_size_limit: number;
  recall_limit: number;
  by_memory_type: Record<string, number>;
  by_review_status: Record<string, number>;
  by_lifecycle_status: Record<string, number>;
};

export type MemoryRecord = {
  memory_id: string;
  summary: string;
  content: string;
  similarity?: number;
  scores?: { similarity?: number; ranking_score?: number };
  retrieval?: { strategy: string };
  source?: { title?: string | null; timestamp?: string | null };
  provenance?: { status?: string; confidence?: number; runtime?: string | null; model?: string | null };
  scope?: { workspace_id?: string; project_id?: string | null; visibility?: string };
  use_policy?: { can_use_as_instruction?: boolean; can_use_as_evidence?: boolean; requires_user_confirmation?: boolean };
  freshness?: { created_at?: string; last_confirmed_at?: string | null; stale_after?: string | null };
  metadata?: Record<string, unknown>;
  memory_type?: string;
  review_status?: string;
  lifecycle_status?: string;
};

export type MemoriesResponse = {
  memories: MemoryRecord[];
  page_count: number;
};

export type RecallResponse = {
  schema_version: string;
  request_id: string;
  memories: MemoryRecord[];
};

export type MemoryDetailResponse = {
  memory: MemoryRecord & {
    metadata?: Record<string, unknown>;
    agent_memory_source_refs?: unknown[];
    agent_memory_artifacts?: unknown[];
  };
};

export type TabId = "memories" | "recall" | "diagnostics" | "review";
