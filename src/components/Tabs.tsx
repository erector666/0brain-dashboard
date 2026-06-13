import { motion } from "motion/react";
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
        <motion.button
          key={tab.id}
          className={active === tab.id ? "active" : ""}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={active === tab.id}
          whileHover={{ color: "var(--text-primary)" }}
          whileTap={{ scale: 0.96 }}
          layout
        >
          {tab.label}
          {active === tab.id ? (
            <motion.div
              className="tab-active-indicator"
              layoutId="tab-indicator"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          ) : null}
        </motion.button>
      ))}
    </div>
  );
}
