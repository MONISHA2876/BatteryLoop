"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Banner, PageHeader, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";

type AdminPayload = {
  users: Array<{ address: string; appRole: string; displayName: string | null }>;
  batteries: Array<{ batteryId: string; name: string; chainStatus: string }>;
  recycling: Array<{ id: string; batteryId: string; status: string; chainStatus: string }>;
  listings: Array<{ id: string; title: string; status: string }>;
  config: {
    contracts: { missing: string[]; invalid: string[]; passport: string | null };
    gemini: boolean;
    auth: boolean;
    database: boolean;
  };
};

export default function AdminPage() {
  const { session } = useWallet();
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const payload = await api<AdminPayload>("/api/admin");
    setData(payload);
  }

  useEffect(() => {
    if (session.user?.appRole === "ADMIN") {
      void load().catch((e) => setError(e.message));
    }
  }, [session.user]);

  async function setRole(address: string, appRole: string) {
    await api("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, appRole }),
    });
    await load();
  }

  if (!session.user) {
    return <Banner tone="info">Sign in first. A connected wallet is not enough for admin access.</Banner>;
  }
  if (session.user.appRole !== "ADMIN") {
    return (
      <Banner tone="error">
        This account does not have the application ADMIN role. Set APP_ADMIN_WALLETS before first sign-in or have an
        existing admin assign the role. On-chain DEFAULT_ADMIN_ROLE is separate.
      </Banner>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Application admin"
        description="Application roles are stored in the database. This page cannot grant Solidity roles; the contract admin must call grantRole on the deployed contracts."
      />
      {error ? <p className="form-error">{error}</p> : null}
      {data ? (
        <>
          <section className="app-panel">
            <h3>Configuration</h3>
            <ul className="plain-list">
              <li><span>Database</span><strong>{String(data.config.database)}</strong></li>
              <li><span>Auth</span><strong>{String(data.config.auth)}</strong></li>
              <li><span>Gemini</span><strong>{String(data.config.gemini)}</strong></li>
              <li><span>Passport</span><strong className="mono-wrap">{data.config.contracts.passport || "missing"}</strong></li>
            </ul>
          </section>
          <section className="app-panel">
            <h3>Users</h3>
            <ul className="plain-list">
              {data.users.map((user) => (
                <li key={user.address}>
                  <span className="mono-wrap">{user.address}</span>
                  <select
                    defaultValue={user.appRole}
                    onChange={(e) => void setRole(user.address, e.target.value)}
                  >
                    <option>USER</option>
                    <option>RECYCLER</option>
                    <option>ADMIN</option>
                  </select>
                </li>
              ))}
            </ul>
          </section>
          <section className="app-panel">
            <h3>Passports</h3>
            {data.batteries.map((b) => (
              <p key={b.batteryId}>
                {b.name} <StatusChip status={b.chainStatus} />
              </p>
            ))}
          </section>
          <section className="app-panel">
            <h3>Recycling requests</h3>
            {data.recycling.map((r) => (
              <p key={r.id}>
                {r.batteryId.slice(0, 12)}… <StatusChip status={r.status} />
              </p>
            ))}
          </section>
          <section className="app-panel">
            <h3>Marketplace moderation</h3>
            {data.listings.map((l) => (
              <p key={l.id}>
                {l.title} <StatusChip status={l.status} />
                {l.status === "OPEN" ? (
                  <PrimaryButton
                    onClick={() =>
                      void api(`/api/marketplace/${l.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "DRAFT" }),
                      }).then(load)
                    }
                  >
                    Unlist
                  </PrimaryButton>
                ) : null}
              </p>
            ))}
          </section>
        </>
      ) : (
        <p>Loading admin data…</p>
      )}
    </div>
  );
}
