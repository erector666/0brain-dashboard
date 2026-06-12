import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  active: "var(--good)",
  stale: "var(--warn)",
  rejected: "var(--bad)",
  archived: "var(--neutral)",
  unknown: "var(--info)"
};

export function LifecycleRing({
  lifecycle,
  review
}: {
  lifecycle?: Record<string, number>;
  review?: Record<string, number>;
}) {
  const lifecycleData = Object.entries(lifecycle || {})
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const reviewData = Object.entries(review || {})
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const total = lifecycleData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="lifecycle-card">
      <div className="section-kicker">Lifecycle telemetry</div>
      <div className="lifecycle-body">
        <div className="lifecycle-ring">
          <ResponsiveContainer width="100%" height={154}>
            <PieChart>
              <Pie
                data={lifecycleData.length ? lifecycleData : [{ name: "unknown", value: 1 }]}
                innerRadius={48}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
                stroke="transparent"
                isAnimationActive
              >
                {(lifecycleData.length ? lifecycleData : [{ name: "unknown", value: 1 }]).map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || "var(--info)"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="lifecycle-center">
            <strong>{total || "—"}</strong>
            <span>memories</span>
          </div>
        </div>

        <div className="lifecycle-legend">
          {lifecycleData.map((item) => (
            <div key={item.name}>
              <span className="legend-dot" style={{ background: COLORS[item.name] || "var(--info)" }} />
              <span>{item.name}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="review-strip">
        {reviewData.map((item) => (
          <span key={item.name}>
            {item.name}: <strong>{item.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
