"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { WalletControls } from "@/components/wallet/WalletControls";
import { ConfigStrip } from "@/components/app/ConfigStrip";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/passports", label: "Passports" },
  { href: "/dashboard/lifecycle", label: "Lifecycle" },
  { href: "/dashboard/health-assessment", label: "Health" },
  { href: "/dashboard/pcb-scanner", label: "PCB scanner" },
  { href: "/dashboard/valuation", label: "Valuation" },
  { href: "/dashboard/marketplace", label: "Marketplace" },
  { href: "/dashboard/recycler", label: "Recycler" },
  { href: "/dashboard/rewards", label: "Rewards" },
  { href: "/dashboard/impact", label: "Impact" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/admin", label: "Admin" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <WalletProvider>
      <div className="app-frame">
        <aside className="app-sidebar">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-inner" />
            </span>
            <span className="brand-word">BatteryLoop</span>
          </Link>
          <nav aria-label="Application">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={active ? "nav-active" : ""}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="app-main">
          <header className="app-topbar">
            <details className="mobile-nav app-mobile-nav">
              <summary>Menu</summary>
              <div className="mobile-menu glass-panel">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <Link href="/">Landing</Link>
              </div>
            </details>
            <WalletControls />
          </header>
          <ConfigStrip />
          <div className="app-content">{children}</div>
        </div>
      </div>
    </WalletProvider>
  );
}
