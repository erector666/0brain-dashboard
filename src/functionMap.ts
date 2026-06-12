export type FunctionInfo = {
  path: string;
  method: string;
  purpose: string;
  usedBy: "Hermes" | "OpenClaw" | "Both" | "Admin";
  safeCheck: boolean;
};

export const FUNCTION_MAP: FunctionInfo[] = [
  { method: "GET", path: "/health", purpose: "Backend service health", usedBy: "Both", safeCheck: true },
  { method: "POST", path: "/stats", purpose: "Exact workspace counts", usedBy: "Both", safeCheck: true },
  { method: "GET", path: "/memories", purpose: "Inventory listing by workspace", usedBy: "Hermes", safeCheck: true },
  { method: "POST", path: "/recall", purpose: "Semantic vector recall", usedBy: "Both", safeCheck: true },
  { method: "POST", path: "/writeback", purpose: "Store, embed, and metadata-sort memories", usedBy: "Both", safeCheck: false },
  { method: "POST", path: "/delete", purpose: "Workspace-scoped delete", usedBy: "Hermes", safeCheck: false },
  { method: "GET", path: "/memories/review", purpose: "Pending review queue", usedBy: "OpenClaw", safeCheck: true },
  { method: "PATCH", path: "/memories/:id/review", purpose: "Confirm/reject/stale/restrict memory", usedBy: "OpenClaw", safeCheck: false },
  { method: "GET", path: "/recall-traces/:id", purpose: "Inspect recall trace and returned items", usedBy: "OpenClaw", safeCheck: false },
  { method: "POST", path: "/admin/reembed", purpose: "Admin repair for embeddings", usedBy: "Admin", safeCheck: false }
];
