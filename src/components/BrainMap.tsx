import { motion } from "motion/react";
import { Activity, Database, GitBranch, HeartPulse, RotateCw, Search, ShieldCheck, Trash2 } from "lucide-react";

const nodes = [
  { id: "health", label: "/health", icon: HeartPulse, x: 8, y: 42 },
  { id: "stats", label: "/stats", icon: Activity, x: 22, y: 20 },
  { id: "memories", label: "/memories", icon: Database, x: 40, y: 42 },
  { id: "recall", label: "/recall", icon: Search, x: 58, y: 18 },
  { id: "review", label: "/review", icon: ShieldCheck, x: 70, y: 48 },
  { id: "delete", label: "/delete", icon: Trash2, x: 86, y: 30 },
  { id: "traces", label: "/traces", icon: GitBranch, x: 58, y: 74 },
  { id: "reembed", label: "/reembed", icon: RotateCw, x: 88, y: 72 }
];

const links = [
  ["health", "stats"],
  ["stats", "memories"],
  ["memories", "recall"],
  ["memories", "review"],
  ["recall", "traces"],
  ["review", "delete"],
  ["traces", "reembed"]
];

function stateFor(check?: string) {
  if (!check) return "pending";
  if (check === "failed") return "bad";
  if (check.includes("ok") || check.includes("memories") || check.includes("returned") || check.includes("results")) return "good";
  return "neutral";
}

export function BrainMap({ checks }: { checks: Record<string, string> }) {
  const byLabel: Record<string, string> = {
    "/health": checks["/health"],
    "/stats": checks["/stats"],
    "/memories": checks["/memories"],
    "/recall": checks["/recall"],
    "/review": checks["/memories/review"],
    "/delete": checks["/delete"],
    "/traces": checks["/traces"],
    "/reembed": checks["/reembed"]
  };

  return (
    <div className="brain-map-card">
      <div className="section-kicker">Brain Map</div>
      <h3>OB1 function topology</h3>

      <div className="brain-map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          {links.map(([from, to]) => {
            const a = nodes.find((node) => node.id === from)!;
            const b = nodes.find((node) => node.id === to)!;

            return (
              <motion.line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="brain-link"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4 }}
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const Icon = node.icon;
          const check = byLabel[node.label];
          const state = stateFor(check);

          return (
            <motion.div
              key={node.id}
              className={`brain-node brain-${state}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Icon size={18} />
              <strong>{node.label}</strong>
              <span>{check || "manual/safe"}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
