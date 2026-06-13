import { Database, Fingerprint, GitBranch, Radio, ScanSearch } from "lucide-react";
import { motion } from "motion/react";
import type { MemoryRecord } from "../types";
import { formatDateTime, statusTone } from "../lib/ui";
import { StatusPill } from "./StatusPill";

export function MemoryStream({
  memories,
  selectedId,
  onSelect
}: {
  memories: MemoryRecord[];
  selectedId?: string;
  onSelect: (memory: MemoryRecord) => void;
}) {
  if (!memories.length) {
    return (
      <div className="empty-state-panel">
        <Database size={26} />
        <strong>No memories in this result set.</strong>
        <p>Check another agent, review queue, or run semantic recall.</p>
      </div>
    );
  }

  return (
    <div className="memory-stream">
      {memories.map((memory, index) => {
        const review = memory.review_status || memory.provenance?.status || "unknown";
        const lifecycle = memory.lifecycle_status || "unknown";
        const selected = memory.memory_id === selectedId;
        const confidence = memory.provenance?.confidence;
        const similarity = memory.similarity ?? memory.scores?.similarity;

        return (
          <motion.button
            type="button"
            key={memory.memory_id}
            className={`memory-card ${selected ? "selected" : ""} tone-${statusTone(lifecycle)}`}
            onClick={() => onSelect(memory)}
            initial={false}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ delay: Math.min(index * 0.025, 0.25), type: "spring", stiffness: 240, damping: 26 }}
          >
            <div className="memory-card-left">
              <div className="memory-type-icon">
                <Fingerprint size={16} />
              </div>
              <div className="memory-main">
                <div className="memory-title-row">
                  <strong>{memory.summary || memory.content?.slice(0, 96) || "Untitled memory"}</strong>
                  <StatusPill value={lifecycle} />
                  <StatusPill value={review} />
                </div>
                <p>{memory.content}</p>
                <div className="memory-meta-row">
                  <span><Database size={13} /> {memory.memory_type || "memory"}</span>
                  <span><Radio size={13} /> {memory.provenance?.runtime || "runtime unknown"}</span>
                  <span><GitBranch size={13} /> {memory.retrieval?.strategy || "inventory"}</span>
                  <span>{formatDateTime(memory.freshness?.created_at || memory.source?.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="memory-card-right">
              <div className="score-stack">
                <span>trust</span>
                <strong>{confidence !== undefined ? `${Math.round(confidence * 100)}%` : "—"}</strong>
              </div>
              <div className="score-stack">
                <span>match</span>
                <strong>{similarity !== undefined ? `${Math.round(similarity * 100)}%` : "—"}</strong>
              </div>
              <ScanSearch size={16} className="memory-action-icon" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
