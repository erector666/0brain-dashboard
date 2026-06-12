import clsx from "clsx";

export const cx = clsx;

export function statusTone(status?: string) {
  const value = String(status || "unknown").toLowerCase();

  if (["confirmed", "active", "ok", "success"].includes(value)) return "good";
  if (["unconfirmed", "pending", "review", "stale"].includes(value)) return "warn";
  if (["rejected", "failed", "error", "deleted"].includes(value)) return "bad";
  if (["evidence_only", "restricted"].includes(value)) return "info";

  return "neutral";
}

export function compactNumber(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return "…";
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}
