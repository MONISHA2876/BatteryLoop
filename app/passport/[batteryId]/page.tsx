"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DataSource, EmptyState, PageHeader, SkeletonGrid, StatusChip } from "@/components/ui/primitives";
import { explorerTxUrl } from "@/lib/blockchain/config";
import { lifecycleLabel } from "@/lib/blockchain/lifecycle";
import { shortBatteryLabel } from "@/lib/blockchain/hashing";

type Payload = {
  battery: {
    batteryId: string;
    name: string;
    model: string | null;
    manufacturerName: string;
    manufacturerAddress: string;
    chemistry: string;
    capacityValue: number;
    capacityUnit: string;
    manufacturedAt: string | null;
    serialNumber: string | null;
    initialCondition: string;
    metadataHash: string;
    chainStatus: string;
    txHash: string | null;
    hashMatch: boolean;
    existsOnChain: boolean;
    onChain: {
      metadataHash: string;
      manufacturer: string;
      registeredAt: string;
      exists: boolean;
    } | null;
    lifecycle: Array<{
      id: string;
      eventType: number;
      chainStatus: string;
      txHash: string | null;
      createdAt: string;
      hashMatch: boolean | null;
    }>;
    assessments: Array<{ id: string; sohEstimate: number | null; createdAt: string; sohMethod: string | null }>;
  };
  qr: string;
  publicUrl: string;
  error?: string;
};

function PublicPassportInner() {
  const params = useParams<{ batteryId: string }>();
  const batteryId = decodeURIComponent(params.batteryId);
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/batteries/${batteryId}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Not found");
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [batteryId]);

  if (loading) return <SkeletonGrid count={3} />;
  if (error || !data) {
    return <EmptyState title="Passport not found" body={error || "No off-chain record exists for this ID."} />;
  }

  const b = data.battery;
  const nextStep = b.chainStatus !== "CONFIRMED"
    ? "Complete on-chain registration, then record inspection."
    : b.lifecycle.some((e) => e.eventType === 5 && e.chainStatus === "CONFIRMED")
      ? "Review second-life or recycling options in the marketplace."
      : "Record inspection or a second-life evaluation.";

  return (
    <main className="section-shell passport-page">
      <PageHeader
        eyebrow="Public passport"
        title={b.name}
        description="On-chain identity proves a record exists. It does not by itself prove the physical battery is genuine."
        actions={
          <Link className="secondary-btn" href="/dashboard">
            Platform
          </Link>
        }
      />
      <section className="passport-hero app-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.qr} alt="Passport QR code" width={180} height={180} />
        <div>
          <p className="eyebrow">{shortBatteryLabel(b.batteryId)}</p>
          <p className="mono-wrap">{b.batteryId}</p>
          <StatusChip status={b.chainStatus} />
          <p>
            <a href={data.qr} download={`${shortBatteryLabel(b.batteryId)}.png`}>
              Download QR
            </a>
          </p>
        </div>
      </section>
      <section className="split-grid">
        <article className="app-panel">
          <h3>Specifications <DataSource label="off-chain" /></h3>
          <ul className="plain-list">
            <li><span>Chemistry</span><strong>{b.chemistry}</strong></li>
            <li><span>Capacity</span><strong>{b.capacityValue} {b.capacityUnit}</strong></li>
            <li><span>Condition</span><strong>{b.initialCondition}</strong></li>
            <li><span>Serial</span><strong>{b.serialNumber || "—"}</strong></li>
            <li><span>Manufactured</span><strong>{b.manufacturedAt || "—"}</strong></li>
            <li><span>Manufacturer</span><strong>{b.manufacturerName}</strong></li>
          </ul>
        </article>
        <article className="app-panel">
          <h3>On-chain identity <DataSource label="on-chain" /></h3>
          {b.onChain?.exists ? (
            <ul className="plain-list">
              <li><span>Exists</span><strong>Yes</strong></li>
              <li><span>Manufacturer</span><strong className="mono-wrap">{b.onChain.manufacturer}</strong></li>
              <li><span>Registered at (unix)</span><strong>{b.onChain.registeredAt}</strong></li>
              <li><span>Stored hash</span><strong className="mono-wrap">{b.onChain.metadataHash}</strong></li>
              <li><span>Local hash</span><strong className="mono-wrap">{b.metadataHash}</strong></li>
              <li><span>Hash match</span><strong>{b.hashMatch ? "Yes" : "No"}</strong></li>
            </ul>
          ) : (
            <p>getBattery does not currently return exists=true for this ID.</p>
          )}
          {b.txHash ? (
            <p>
              Registration tx:{" "}
              <a href={explorerTxUrl(b.txHash)} target="_blank" rel="noreferrer">
                {b.txHash}
              </a>
            </p>
          ) : (
            <p>No registration transaction hash is stored.</p>
          )}
        </article>
      </section>
      <section className="app-panel">
        <h3>Recommended next step</h3>
        <p>{nextStep}</p>
      </section>
      <section className="app-panel">
        <h3>Lifecycle</h3>
        {b.lifecycle.length === 0 ? (
          <p>No off-chain lifecycle payloads yet.</p>
        ) : (
          <ol className="timeline">
            {b.lifecycle.map((event) => (
              <li key={event.id}>
                <strong>{lifecycleLabel(event.eventType)}</strong>
                <StatusChip status={event.chainStatus} />
                {event.chainStatus === "CONFIRMED" ? <DataSource label="on-chain" /> : <DataSource label="off-chain" />}
                {event.txHash ? (
                  <a href={explorerTxUrl(event.txHash)} target="_blank" rel="noreferrer">
                    tx
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="app-panel">
        <h3>AI assessments <DataSource label="ai" /></h3>
        {b.assessments.length === 0 ? (
          <p>No stored assessments.</p>
        ) : (
          <ul className="plain-list">
            {b.assessments.map((a) => (
              <li key={a.id}>
                <span>{a.sohEstimate === null ? "Qualitative only" : `${a.sohEstimate}% capacity-ratio estimate`}</span>
                <small>{a.sohMethod}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function PublicPassportPage() {
  return (
    <Suspense fallback={<SkeletonGrid count={3} />}>
      <PublicPassportInner />
    </Suspense>
  );
}
