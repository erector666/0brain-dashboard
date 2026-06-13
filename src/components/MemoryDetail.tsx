import { useEffect, useState } from "react";
import { deleteMemory, editMemory, reviewMemory } from "../api";
import type { AgentConfig, MemoryRecord } from "../types";
import { FileText, Fingerprint, CalendarClock, Layers, Paperclip, Settings, Edit3, MoreVertical, Trash2, Check, X, AlertTriangle, Ban, EyeOff, Save, XCircle } from "lucide-react";

const reviewActions = [
  ["confirm", "Confirm", Check],
  ["evidence_only", "Evidence Only", EyeOff],
  ["reject", "Reject", X],
  ["mark_stale", "Mark Stale", AlertTriangle],
  ["restrict_scope", "Restrict Scope", Ban]
] as const;

export function MemoryDetail({
  agent,
  memory,
  onChanged,
  embedded
}: {
  agent: AgentConfig;
  memory?: MemoryRecord | null;
  onChanged: () => void;
  embedded?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [rawMetaOpen, setRawMetaOpen] = useState(false);
  const [reviewMenuOpen, setReviewMenuOpen] = useState(false);

  useEffect(() => {
    setIsEditing(false);
    setActionError("");
    setRawMetaOpen(false);
    setReviewMenuOpen(false);
    setEditSummary(memory?.summary || "");
    setEditContent(memory?.content || "");
  }, [memory?.memory_id, memory?.summary, memory?.content]);

  // Close review menu on click outside or Escape (capture phase to stay ahead of React synthetic events)
  useEffect(() => {
    if (!reviewMenuOpen) return;
    const menuEl = document.querySelector(".detail-review-menu");
    function handleClick(e: MouseEvent) {
      // Only close if click target is outside the menu element
      if (menuEl && !menuEl.contains(e.target as Node)) {
        setReviewMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setReviewMenuOpen(false);
    }
    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("keydown", handleKey);
    };
  }, [reviewMenuOpen]);

  if (!memory) {
    return (
      <div className="detail-panel" role="region" aria-label="Memory inspector (empty)">
        <div className="panel-title">Memory Inspector</div>
        <div className="detail-empty-state">
          <div className="detail-empty-icon"><FileText size={40} /></div>
          <p>Select a memory to inspect content, metadata, source refs, and review state.</p>
        </div>
      </div>
    );
  }

  const metadata = memory.metadata || {};

  async function onDelete() {
    if (!memory) return;
    setReviewMenuOpen(false);
    const confirmation = window.prompt(`Type ${memory.memory_id} to delete this memory.`);
    if (confirmation !== memory.memory_id) return;
    await runAction(() => deleteMemory(agent.workspaceId, memory.memory_id));
  }

  async function onReview(action: string) {
    if (!memory) return;
    setReviewMenuOpen(false);
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

  const createdDate = memory.freshness?.created_at || memory.source?.timestamp;
  const staleDate = memory.freshness?.stale_after;
  const confirmedAt = memory.freshness?.last_confirmed_at;

  return (
    <div className="detail-panel" role="region" aria-label="Memory inspector">
      <div className="panel-title">Memory Inspector</div>

      {/* Action bar — grouped */}
      <div className="detail-actions">
        {isEditing ? (
          <>
            <button className="btn-primary" onClick={onSaveEdit} disabled={saving}>
              <Save size={15} />
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setIsEditing(false)} disabled={saving}><XCircle size={15} /> Cancel</button>
          </>
        ) : (
          <>
            <button className="btn-primary" onClick={() => setIsEditing(true)} disabled={saving}>
              <Edit3 size={15} /> Edit
            </button>
            <div className="detail-review-group">
              <button
                className="detail-review-trigger"
                onClick={() => setReviewMenuOpen((v) => !v)}
                disabled={saving}
                aria-haspopup="true"
                aria-expanded={reviewMenuOpen}
              >
                <MoreVertical size={15} /> Actions
              </button>
              {reviewMenuOpen ? (
                <div className="detail-review-menu" role="menu">
                  {reviewActions.map(([action, label, Icon]) => (
                    <button key={action} onClick={() => onReview(action)} role="menuitem">
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                    <div className="menu-separator" role="separator" />
                    <button className="menu-item-delete" onClick={onDelete} disabled={saving} role="menuitem">
                      <Trash2 size={13} /> Delete
                    </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {actionError ? <div className="error" role="alert">{actionError}</div> : null}

      {/* Content section */}
      <section className="detail-section">
        <div className="detail-section-heading">
          <span className="detail-section-icon"><FileText size={16} /></span>
          <h3>Content</h3>
        </div>
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
          <div className="detail-content-block">
            {memory.summary ? <p className="memory-summary">{memory.summary}</p> : null}
            <p className="memory-content">{memory.content}</p>
          </div>
        )}
      </section>

      {/* Identity section */}
      <section className="detail-section">
        <div className="detail-section-heading">
          <span className="detail-section-icon"><Fingerprint size={16} /></span>
          <h3>Identity</h3>
        </div>
        <dl className="detail-dl">
          <div className="detail-dl-row">
            <dt>ID</dt>
            <dd className="detail-mono">{memory.memory_id}</dd>
          </div>
          <div className="detail-dl-row">
            <dt>Workspace</dt>
            <dd>{memory.scope?.workspace_id || agent.workspaceId}</dd>
          </div>
          <div className="detail-dl-row">
            <dt>Review</dt>
            <dd><span className={`badge badge-${memory.review_status || memory.provenance?.status || "unknown"}`}>{memory.review_status || memory.provenance?.status || "unknown"}</span></dd>
          </div>
          <div className="detail-dl-row">
            <dt>Runtime</dt>
            <dd className="detail-mono">{memory.provenance?.runtime || "-"}</dd>
          </div>
        </dl>
      </section>

      {/* Freshness section */}
      {createdDate || staleDate || confirmedAt ? (
        <section className="detail-section">
          <div className="detail-section-heading">
            <span className="detail-section-icon"><CalendarClock size={16} /></span>
            <h3>Freshness</h3>
          </div>
          <dl className="detail-dl">
            {createdDate ? (
              <div className="detail-dl-row">
                <dt>Created</dt>
                <dd>{formatDate(createdDate)}</dd>
              </div>
            ) : null}
            {staleDate ? (
              <div className="detail-dl-row">
                <dt>Stale After</dt>
                <dd>{formatDate(staleDate)}</dd>
              </div>
            ) : null}
            {confirmedAt ? (
              <div className="detail-dl-row">
                <dt>Confirmed</dt>
                <dd>{formatDate(confirmedAt)}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {/* Extracted Metadata */}
      {hasMetadata(metadata) ? (
        <section className="detail-section">
          <div className="detail-section-heading">
            <span className="detail-section-icon"><Layers size={16} /></span>
            <h3>Extracted Metadata</h3>
          </div>
          <div className="detail-metadata-grid">
            <TagList label="People" value={metadata.extracted_people} />
            <TagList label="Topics" value={metadata.extracted_topics} />
            <TagList label="Actions" value={metadata.action_items} />
            <TagList label="Dates" value={metadata.dates_mentioned} />
            {metadata.extracted_type ? (
              <div className="detail-meta-item">
                <span className="detail-meta-label">Type</span>
                <strong className="detail-meta-value">{String(metadata.extracted_type)}</strong>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Sources section */}
      {memory.source ? (
        <section className="detail-section">
          <div className="detail-section-heading">
            <span className="detail-section-icon"><Paperclip size={16} /></span>
            <h3>Source</h3>
          </div>
          <dl className="detail-dl">
            {memory.source.title ? (
              <div className="detail-dl-row">
                <dt>Title</dt>
                <dd>{memory.source.title}</dd>
              </div>
            ) : null}
            {memory.source.timestamp ? (
              <div className="detail-dl-row">
                <dt>Timestamp</dt>
                <dd>{formatDate(memory.source.timestamp)}</dd>
              </div>
            ) : null}
            {memory.retrieval?.strategy ? (
              <div className="detail-dl-row">
                <dt>Retrieval</dt>
                <dd>{memory.retrieval.strategy}</dd>
              </div>
            ) : null}
            {memory.similarity !== undefined ? (
              <div className="detail-dl-row">
                <dt>Similarity</dt>
                <dd>{Math.round(memory.similarity * 100)}%</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      {/* Collapsible Raw Metadata */}
      <section className="detail-section">
        <div className="detail-section-heading">
          <span className="detail-section-icon"><Settings size={16} /></span>
          <h3>Raw Metadata</h3>
          <button
            className="detail-collapse-btn"
            onClick={() => setRawMetaOpen((v) => !v)}
            aria-label={rawMetaOpen ? "Collapse raw metadata" : "Expand raw metadata"}
          >
            {rawMetaOpen ? "▲ Hide" : "▼ Show"}
          </button>
        </div>
        {rawMetaOpen ? (
          <pre className="detail-pre">{JSON.stringify(metadata, null, 2)}</pre>
        ) : (
          <p className="detail-hint">Click <strong>Show</strong> to view raw metadata JSON.</p>
        )}
      </section>
    </div>
  );
}

function TagList({ label, value }: { label: string; value: unknown }) {
  const items = Array.isArray(value) ? value.map(String) : [];
  return (
    <div className="detail-meta-item">
      <span className="detail-meta-label">{label}</span>
      <div className="detail-meta-tags">
        {items.length
          ? items.map((item) => <span key={item} className="detail-tag" title={item}>{item}</span>)
          : <em className="detail-meta-empty">not extracted</em>
        }
      </div>
    </div>
  );
}

function hasMetadata(meta: Record<string, unknown>): boolean {
  return Object.keys(meta).length > 0;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}
