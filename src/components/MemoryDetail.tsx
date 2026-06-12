import { useEffect, useState } from "react";
import { deleteMemory, editMemory, reviewMemory } from "../api";
import type { AgentConfig, MemoryRecord } from "../types";

const reviewActions = [
  ["confirm", "Confirm"],
  ["evidence_only", "Evidence"],
  ["reject", "Reject"],
  ["mark_stale", "Stale"],
  ["restrict_scope", "Restrict"]
] as const;

export function MemoryDetail({
  agent,
  memory,
  onChanged
}: {
  agent: AgentConfig;
  memory?: MemoryRecord | null;
  onChanged: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setActionError("");
    setEditSummary(memory?.summary || "");
    setEditContent(memory?.content || "");
  }, [memory?.memory_id, memory?.summary, memory?.content]);

  if (!memory) {
    return (
      <aside className="detail-panel">
        <div className="panel-title">Memory Detail</div>
        <div className="empty-state">Select a memory to inspect content, metadata, source refs, and review state.</div>
      </aside>
    );
  }

  const metadata = memory.metadata || {};

  async function onDelete() {
    if (!memory) return;
    const confirmation = window.prompt(`Type ${memory.memory_id} to delete this memory.`);
    if (confirmation !== memory.memory_id) return;
    await runAction(() => deleteMemory(agent.workspaceId, memory.memory_id));
  }

  async function onReview(action: string) {
    if (!memory) return;
    await runAction(() => reviewMemory(memory.memory_id, action, `Dashboard action: ${action}`));
  }

  async function onSaveEdit() {
    if (!memory) return;
    const nextSummary = editSummary.trim();
    const nextContent = editContent.trim();
    if (!nextContent) {
      setActionError("Content cannot be empty.");
      return;
    }
    const confirmation = window.prompt(`Type ${memory.memory_id} to save edits to this memory.`);
    if (confirmation !== memory.memory_id) return;
    await runAction(() => editMemory(memory.memory_id, nextSummary, nextContent));
    setIsEditing(false);
  }

  async function runAction(action: () => Promise<unknown>) {
    setSaving(true);
    setActionError("");
    try {
      await action();
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="detail-panel">
      <div className="panel-title">Memory Detail</div>
      <div className="detail-actions">
        {isEditing ? (
          <>
            <button onClick={onSaveEdit} disabled={saving}>Save</button>
            <button onClick={() => setIsEditing(false)} disabled={saving}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} disabled={saving}>Edit</button>
        )}
        {reviewActions.map(([action, label]) => (
          <button key={action} onClick={() => onReview(action)} disabled={saving}>{label}</button>
        ))}
        <button className="danger" onClick={onDelete} disabled={saving}>Delete</button>
      </div>
      {actionError ? <div className="error">{actionError}</div> : null}
      <section>
        <h3>Content</h3>
        {isEditing ? (
          <div className="edit-form">
            <label>
              <span>Summary</span>
              <textarea value={editSummary} onChange={(event) => setEditSummary(event.target.value)} rows={3} />
            </label>
            <label>
              <span>Content</span>
              <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={12} />
            </label>
          </div>
        ) : (
          <>
            {memory.summary ? <p className="memory-summary">{memory.summary}</p> : null}
            <p className="memory-content">{memory.content}</p>
          </>
        )}
      </section>
      <section>
        <h3>Identity</h3>
        <dl>
          <dt>ID</dt><dd>{memory.memory_id}</dd>
          <dt>Workspace</dt><dd>{memory.scope?.workspace_id || agent.workspaceId}</dd>
          <dt>Review</dt><dd>{memory.review_status || memory.provenance?.status || "unknown"}</dd>
          <dt>Runtime</dt><dd>{memory.provenance?.runtime || "-"}</dd>
        </dl>
      </section>
      <section>
        <h3>Extracted Metadata</h3>
        <TagList label="People" value={metadata.extracted_people} />
        <TagList label="Topics" value={metadata.extracted_topics} />
        <TagList label="Actions" value={metadata.action_items} />
        <TagList label="Dates" value={metadata.dates_mentioned} />
        <div className="kv"><span>Type</span><strong>{String(metadata.extracted_type || "not extracted")}</strong></div>
      </section>
      <section>
        <h3>Raw Metadata</h3>
        <pre>{JSON.stringify(metadata, null, 2)}</pre>
      </section>
    </aside>
  );
}

function TagList({ label, value }: { label: string; value: unknown }) {
  const items = Array.isArray(value) ? value.map(String) : [];
  return (
    <div className="tag-group">
      <span>{label}</span>
      <div>{items.length ? items.map((item) => <b key={item}>{item}</b>) : <em>not extracted</em>}</div>
    </div>
  );
}
