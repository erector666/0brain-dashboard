import { motion } from "motion/react";
import { compactNumber } from "../lib/ui";

export function MetricOrb({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value?: number;
  detail?: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  return (
    <motion.div
      className={`metric-orb metric-${tone}`}
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <div className="metric-orb-glow" />
      <span className="metric-label">{label}</span>
      <strong>{compactNumber(value)}</strong>
      {detail ? <small>{detail}</small> : null}
    </motion.div>
  );
}
