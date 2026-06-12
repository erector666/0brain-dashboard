import type { TabId } from "../types";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "memories", label: "Memories" },
  { id: "recall", label: "Semantic Recall" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "review", label: "Review Queue" }
];

export function Tabs({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button key={tab.id} className={active === tab.id ? "active" : ""} onClick={() => onChange(tab.id)} role="tab">
          {tab.label}
        </button>
      ))}
    </div>
  );
}
