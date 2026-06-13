import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, Zap } from "lucide-react";
import { runRecall } from "../api";
import type { AgentConfig, MemoryRecord, RecallResponse } from "../types";
import { MemoryStream } from "./MemoryStream";

export function SearchPanel({
  agent,
  selectedId,
  onSelect
}: {
  agent: AgentConfig;
  selectedId?: string;
  onSelect: (memory: MemoryRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [includeUnconfirmed, setIncludeUnconfirmed] = useState(true);
  const [result, setResult] = useState<RecallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      setResult(await runRecall(agent.workspaceId, query.trim(), 10, includeUnconfirmed));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <form className="toolbar" onSubmit={onSubmit}>
        <Search size={18} className="toolbar-search-icon" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Semantic search ${agent.workspaceId}`} aria-label="Search query" />
        <label className="checkbox">
          <input type="checkbox" checked={includeUnconfirmed} onChange={(event) => setIncludeUnconfirmed(event.target.checked)} />
          include unconfirmed
        </label>
        <button type="submit" disabled={loading} className="btn-primary">
          <Zap size={15} />
          {loading ? "Searching" : "Search"}
        </button>

        <AnimatePresence>
          {loading ? (
            <motion.div
              className="recall-scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </form>
      {error ? <div className="error" role="alert">{error}</div> : null}
      {result ? (
        <div className="result-note">
          Request {result.request_id} / {result.memories.length} memories / {result.memories[0]?.retrieval?.strategy || "no retrieval"}
        </div>
      ) : null}
      <MemoryStream memories={result?.memories || []} selectedId={selectedId} onSelect={onSelect} />
    </div>
  );
}
