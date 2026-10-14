"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHeader, SkeletonGrid, StatusChip } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";
import { shortBatteryLabel } from "@/lib/blockchain/hashing";

type Battery = {
  batteryId: string;
  name: string;
  chemistry: string;
  chainStatus: string;
  txHash: string | null;
  manufacturerName: string;
};

export default function PassportsPage() {
  const { session } = useWallet();
  const [items, setItems] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.user) return;
    setLoading(true);
    api<{ batteries: Battery[] }>("/api/batteries")
      .then((d) => setItems(d.batteries))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session.user]);

  return (
    <div>
      <PageHeader
        eyebrow="Identity"
        title="Digital battery passports"
        description="Off-chain metadata is stored in the database. On-chain identity is a battery ID plus a metadata hash. A confirmed passport is not by itself proof that a physical pack is genuine."
        actions={
          <Link className="primary-btn" href="/dashboard/passports/new">
            Register battery
          </Link>
        }
      />
      {!session.user ? (
        <EmptyState title="Sign in required" body="Connect a wallet and sign in to see batteries you registered." />
      ) : loading ? (
        <SkeletonGrid />
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="No passports yet"
          body="Create a draft, then submit registerBattery from a wallet that holds REGISTRAR_ROLE."
          action={
            <Link className="primary-btn" href="/dashboard/passports/new">
              Start registration
            </Link>
          }
        />
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <article key={item.batteryId} className="app-panel">
              <p className="eyebrow">{shortBatteryLabel(item.batteryId)}</p>
              <h3>{item.name}</h3>
              <p>
                {item.manufacturerName} · {item.chemistry}
              </p>
              <StatusChip status={item.chainStatus} />
              <div className="row-actions">
                <Link className="secondary-btn" href={`/passport/${item.batteryId}`}>
                  Public passport
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
