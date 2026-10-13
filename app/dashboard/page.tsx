import Link from "next/link";

const metrics = [
  { label: "Batteries registered", value: "14,280" },
  { label: "Passports verified", value: "9,760" },
  { label: "Assets evaluated", value: "2,410" },
  { label: "Recovery requests", value: "468" },
];

const activities = [
  { label: "Reused", value: "36%" },
  { label: "Recycling", value: "29%" },
  { label: "Awaiting review", value: "21%" },
  { label: "Needs testing", value: "14%" },
];

export default function DashboardPage() {
  return (
    <main className="section-shell" style={{ padding: "2rem 0 4rem" }}>
      <div className="glass-panel" style={{ borderRadius: "28px", padding: "1.5rem" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <Link className="brand" href="/" aria-label="Back to BatteryLoop home">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-inner" />
            </span>
            <span className="brand-word">BatteryLoop</span>
          </Link>
          <Link className="secondary-btn" href="/">
            Back to landing page
          </Link>
        </header>

        <section style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
          <p className="eyebrow">PRODUCT PREVIEW · SAMPLE DATA</p>
          <h1 style={{ fontSize: "clamp(2.3rem, 3vw, 4rem)", maxWidth: "720px" }}>Circular asset operations dashboard</h1>
        </section>

        <section className="dashboard-metrics" style={{ marginBottom: "1.5rem" }}>
          {metrics.map((metric) => (
            <div key={metric.label} className="dashboard-stat">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </section>

        <section className="dashboard-content">
          <div className="dashboard-panel small-panel">
            <h4>Reuse and recycling status</h4>
            <ul>
              {activities.map((activity) => (
                <li key={activity.label}>
                  <span>{activity.label}</span>
                  <strong>{activity.value}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="dashboard-panel chart-panel">
            <h4>Lifecycle recovery</h4>
            <div className="recovery-chart" aria-hidden="true">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
              <span className="bar bar-4" />
              <span className="bar bar-5" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
