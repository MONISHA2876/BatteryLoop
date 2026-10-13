import Link from "next/link";

export default function PassportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <header className="topbar-wrap">
        <div className="section-shell">
          <nav className="topbar glass-panel" aria-label="Passport">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">
                <span className="brand-mark-inner" />
              </span>
              <span className="brand-word">BatteryLoop</span>
            </Link>
            <Link className="nav-cta" href="/dashboard">
              Open platform
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
