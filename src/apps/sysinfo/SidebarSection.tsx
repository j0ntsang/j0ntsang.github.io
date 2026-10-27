import React from "react";

type SidebarRow = [label: string, value: React.ReactNode];

/** A titled list of label/value pairs; both sysinfo tabs are built from these. */
export function SidebarSection({
  title,
  rows,
}: {
  title: string;
  rows: SidebarRow[];
}) {
  return (
    <section className="sidebar-section">
      <h2 className="sidebar-section__heading">{title}</h2>
      <dl className="sidebar-section__list">
        {rows.map(([label, value]) => (
          <div className="sidebar-row" key={label}>
            <dt className="sidebar-row__label">{label}</dt>
            <dd className="sidebar-row__value">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
