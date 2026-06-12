import { statusTone } from "../lib/ui";

export function StatusPill({
  value,
  label
}: {
  value?: string;
  label?: string;
}) {
  const display = value || "unknown";
  return (
    <span className={`status-pill status-${statusTone(display)}`}>
      <span className="status-dot" />
      {label ? <span className="status-label">{label}</span> : null}
      <span>{display}</span>
    </span>
  );
}
