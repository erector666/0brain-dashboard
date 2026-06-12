import { FormEvent, useState } from "react";
import { runRecall } from "../api";
import type { AgentConfig, MemoryRecord, RecallResponse } from "../types";
import { MemoryTable } from "./MemoryTable";

export function SearchPanel({
  agent,
  onSelect
}: {
  agent: AgentConfig;
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
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Semantic search ${agent.workspaceId}`} />
        <label className="checkbox">
          <input type="checkbox" checked={includeUnconfirmed} onChange={(event) => setIncludeUnconfirmed(event.target.checked)} />
          include unconfirmed
        </label>
        <button type="submit" disabled={loading}>{loading ? "Searching" : "Search"}</button>
      </form>
      {error ? <div className="error">{error}</div> : null}
      {result ? (
        <div className="result-note">
          Request {result.request_id} / {result.memories.length} memories / {result.memories[0]?.retrieval?.strategy || "no retrieval"}
        </div>
      ) : null}
      <MemoryTable memories={result?.memories || []} onSelect={onSelect} />
    </div>
  );
}
