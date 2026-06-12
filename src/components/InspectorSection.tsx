import type { ReactNode } from "react";
import { motion } from "motion/react";

export function InspectorSection({
  icon,
  heading,
  children,
  collapsible,
  defaultOpen = false
}: {
  icon?: ReactNode;
  heading: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  return (
    <motion.section
      className="detail-section"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
    >
      <div className="detail-section-heading">
        {icon ? <span className="detail-section-icon">{icon}</span> : null}
        <h3>{heading}</h3>
      </div>
      {collapsible && !defaultOpen ? (
        <details className="detail-collapsible">
          <summary className="detail-collapse-summary">View details</summary>
          <div className="detail-collapsible-body">{children}</div>
        </details>
      ) : (
        children
      )}
    </motion.section>
  );
}
