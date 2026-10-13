"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHeader, SkeletonGrid, StatusChip } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";

type Battery = { batteryId: string; name: string; chainStatus: string; chemistry: string };
type Event = { id: string; batteryId: string; eventType: number; chainStatus: string };
type Assessment = { id: string; sohEstimate: number | null; createdAt: string };

export default function DashboardPage() {
  const { session, config } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [impact, setImpact] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const impactRes = await fetch("/api/impact").then((r) => r.json());
        if (!cancelled) setImpact(impactRes);
        if (session.user) {
          const [b, e, a] = await Promise.all([
            api<{ batteries: Battery[] }>("/api/batteries"),
            api<{ events: Event[] }>("/api/lifecycle"),
            api<{ assessments: Assessment[] }>("/api/ai/health"),
          ]);
          if (!cancelled) {
            setBatteries(b.batteries);
            setEvents(e.events);
            setAssessments(a.assessments);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [session.user]);

  const offChain = (impact?.offChain as Record<string, number> | undefined) ?? null;
  const onChain = (impact?.onChainVerified as Record<string, number> | undefined) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Circular operations overview"
        description="Live counts come from the application database and confirmed on-chain records. Sample marketing numbers from the landing page are not reused here."
        actions={
          <Link className="primary-btn" href="/dashboard/passports/new">
            Register battery →
          </Link>
        }
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <SkeletonGrid /> : null}

      {!loading && (
        <section className="dashboard-metrics">
          <article className="dashboard-stat">
            <span>Batteries (off-chain)</span>
            <strong>{offChain ? offChain.batteriesRegistered : "—"}</strong>
          </article>
          <article className="dashboard-stat">
            <span>Passports confirmed on-chain</span>
            <strong>{onChain ? onChain.passports : "—"}</strong>
          </article>
          <article className="dashboard-stat">
            <span>Lifecycle events confirmed</span>
            <strong>{onChain ? onChain.lifecycleEvents : "—"}</strong>
          </article>
          <article className="dashboard-stat">
            <span>Recycling verified on-chain</span>
            <strong>{onChain ? onChain.recyclingVerified : "—"}</strong>
          </article>
        </section>
      )}

      {!session.user ? (
        <EmptyState
          title="Read-only until you sign in"
          body="You can browse public passports and open marketplace listings. Connect a wallet and sign a message to create records. Signing does not send a transaction."
        />
      ) : (
        <div className="split-grid">
          <section className="app-panel">
            <h3>Your batteries</h3>
            {batteries.length === 0 ? (
              <p>No batteries yet.</p>
            ) : (
              <ul className="plain-list">
                {batteries.slice(0, 6).map((b) => (
                  <li key={b.batteryId}>
                    <Link href={`/passport/${b.batteryId}`}>{b.name}</Link>
                    <StatusChip status={b.chainStatus} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="app-panel">
            <h3>Recent lifecycle drafts</h3>
            {events.length === 0 ? (
              <p>No lifecycle events yet.</p>
            ) : (
              <ul className="plain-list">
                {events.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <span>Type {e.eventType}</span>
                    <StatusChip status={e.chainStatus} />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="app-panel">
            <h3>Health assessments</h3>
            {assessments.length === 0 ? (
              <p>No assessments yet.</p>
            ) : (
              <ul className="plain-list">
                {assessments.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <span>{a.sohEstimate === null ? "No SoH number" : `${a.sohEstimate}% estimate`}</span>
                    <small>{new Date(a.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="app-panel">
            <h3>Network</h3>
            <p>
              {config?.chain.name} · chain ID {config?.chain.chainId}. Public reads work without a wallet.
              Writes require the matching Flow EVM Testnet account and contract role.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
