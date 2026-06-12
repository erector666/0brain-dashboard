import type { MemoriesResponse, MemoryDetailResponse, MemoryRecord, RecallResponse, StatsResponse } from "./types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers as Record<string, string> || {})
    }
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || data.details?.error || response.statusText);
  }
  return data as T;
}

export function fetchStats(workspaceId: string, signal?: AbortSignal) {
  return api<StatsResponse>("/api/ob1/stats", {
    method: "POST",
    body: JSON.stringify({ workspace_id: workspaceId }),
    signal
  });
}

export function fetchMemories(workspaceId: string, limit = 50, filters: Record<string, string> = {}, signal?: AbortSignal) {
  const params = new URLSearchParams({ workspace_id: workspaceId, limit: String(limit), ...filters });
  return api<MemoriesResponse>(`/api/ob1/memories?${params}`, { signal });
}

export function fetchReviewQueue(workspaceId: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ workspace_id: workspaceId });
  return api<MemoriesResponse>(`/api/ob1/memories/review?${params}`, { signal });
}

export function fetchMemoryDetail(memoryId: string, signal?: AbortSignal) {
  return api<{ memory: Record<string, unknown> }>(`/api/ob1/memories/${encodeURIComponent(memoryId)}`, { signal }).then((data) => ({
    memory: normalizeMemory(data.memory)
  }) satisfies MemoryDetailResponse);
}

export function runRecall(workspaceId: string, query: string, limit = 10, includeUnconfirmed = true, signal?: AbortSignal) {
  return api<RecallResponse>("/api/ob1/recall", {
    method: "POST",
    signal,
    body: JSON.stringify({
      schema_version: "openbrain.openclaw.recall.v1",
      workspace_id: workspaceId,
      query,
      scope: { include_unconfirmed: includeUnconfirmed, project_only: false, visibility: "personal" },
      limits: { max_items: limit }
    })
  });
}

export function deleteMemory(workspaceId: string, memoryId: string) {
  return api<{ deleted: boolean; memory_id: string }>("/api/ob1/delete", {
    method: "POST",
    body: JSON.stringify({ schema_version: "openbrain.openclaw.delete.v1", workspace_id: workspaceId, memory_id: memoryId })
  });
}

export function reviewMemory(memoryId: string, action: string, notes = "", changes: Record<string, unknown> = {}) {
  return api<{ memory: unknown }>(`/api/ob1/memories/${encodeURIComponent(memoryId)}/review`, {
    method: "PATCH",
    body: JSON.stringify({ action, actor_label: "0Brain Dashboard", notes, ...changes })
  });
}

export function editMemory(memoryId: string, summary: string, content: string) {
  return reviewMemory(memoryId, "edit", "Dashboard content edit", { summary, content });
}

export function fetchHealth(signal?: AbortSignal) {
  return api<{ ok: boolean; service: string; version: string }>("/api/ob1/health", { signal });
}

function normalizeMemory(raw: Record<string, unknown>): MemoryRecord {
  const scope = asRecord(raw.scope) || {
    workspace_id: raw.workspace_id,
    project_id: raw.project_id,
    visibility: raw.visibility
  };
  const provenance = asRecord(raw.provenance) || {
    status: raw.status,
    confidence: raw.confidence,
    runtime: raw.runtime_name,
    model: raw.model
  };
  const freshness = asRecord(raw.freshness) || {
    created_at: raw.created_at,
    last_confirmed_at: raw.last_confirmed_at,
    stale_after: raw.stale_after
  };
  const usePolicy = asRecord(raw.use_policy) || {
    can_use_as_instruction: raw.can_use_as_instruction,
    can_use_as_evidence: raw.can_use_as_evidence,
    requires_user_confirmation: raw.requires_user_confirmation
  };

  return {
    ...(raw as unknown as MemoryRecord),
    memory_id: String(raw.memory_id || raw.id || ""),
    summary: String(raw.summary || ""),
    content: String(raw.content || raw.summary || ""),
    memory_type: typeof raw.memory_type === "string" ? raw.memory_type : undefined,
    review_status: typeof raw.review_status === "string" ? raw.review_status : undefined,
    lifecycle_status: typeof raw.lifecycle_status === "string" ? raw.lifecycle_status : undefined,
    metadata: asRecord(raw.metadata) || {},
    scope: scope as MemoryRecord["scope"],
    provenance: provenance as MemoryRecord["provenance"],
    freshness: freshness as MemoryRecord["freshness"],
    use_policy: usePolicy as MemoryRecord["use_policy"]
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}
