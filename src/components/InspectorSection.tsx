import type { ReactNode } from "react";

export function InspectorSection({
  icon,
  title,
  children
}: {
  icon?: ReactNode;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <section className="detail-section">
      {title ? (
        <div className="detail-section-heading">
          {icon ? <span className="detail-section-icon">{icon}</span> : null}
          <h3>{title}</h3>
        </div>
      ) : null}
      <div className="detail-content-block">
        {children}
      </div>
    </section>
  );
}
