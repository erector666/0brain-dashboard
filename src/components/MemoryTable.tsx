import type { MemoryRecord } from "../types";

export function MemoryTable({
  memories,
  selectedId,
  onSelect
}: {
  memories: MemoryRecord[];
  selectedId?: string;
  onSelect: (memory: MemoryRecord) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="memory-table">
        <thead>
          <tr>
            <th>Created</th>
            <th>Type</th>
            <th>Summary</th>
            <th>Review</th>
            <th>Retrieval</th>
          </tr>
        </thead>
        <tbody>
          {memories.map((memory, index) => (
            <tr
              key={memory.memory_id}
              className={`${memory.memory_id === selectedId ? "selected" : ""} ${index % 2 === 1 ? "striped" : ""}`}
              onClick={() => onSelect(memory)}
            >
              <td className="cell-date">{formatDate(memory.freshness?.created_at || memory.source?.timestamp)}</td>
              <td>{memory.memory_type || inferType(memory)}</td>
              <td className="cell-summary">{memory.summary || memory.content?.slice(0, 120)}</td>
              <td>
                <span className={`badge badge-${memory.review_status || memory.provenance?.status || "unknown"}`}>
                  {memory.review_status || memory.provenance?.status || "unknown"}
                </span>
              </td>
              <td className="cell-retrieval">{memory.retrieval?.strategy || (memory.similarity ? `${Math.round(memory.similarity * 100)}%` : "-")}</td>
            </tr>
          ))}
          {memories.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-cell">No memories in this result set.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function inferType(memory: MemoryRecord) {
  if (memory.content?.startsWith("Next step:")) return "work_log";
  return "memory";
}
