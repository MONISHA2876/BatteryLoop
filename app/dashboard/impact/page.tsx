"use client";

import { useEffect, useState } from "react";
import { Banner, DataSource, PageHeader, SkeletonGrid } from "@/components/ui/primitives";
import { IMPACT_ASSUMPTIONS } from "@/lib/impact";

type Impact = {
  configured: boolean;
  error?: string;
  offChain?: Record<string, number>;
  onChainVerified?: Record<string, number>;
  estimates?: { divertedKg: number; assumptions: typeof IMPACT_ASSUMPTIONS };
};

export default function ImpactPage() {
  const [data, setData] = useState<Impact | null>(null);

  useEffect(() => {
    void fetch("/api/impact")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <SkeletonGrid />;

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Impact"
        description="Totals are live database counts. On-chain verified means the application stored a CONFIRMED status after a successful receipt. Estimated diversion uses a documented proxy, not a measured inventory."
      />
      {!data.configured ? <Banner tone="warn">{data.error}</Banner> : null}
      <section className="dashboard-metrics">
        <article className="dashboard-stat">
          <span>Batteries registered <DataSource label="off-chain" /></span>
          <strong>{data.offChain?.batteriesRegistered ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Passports confirmed <DataSource label="on-chain" /></span>
          <strong>{data.onChainVerified?.passports ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Lifecycle events confirmed <DataSource label="on-chain" /></span>
          <strong>{data.onChainVerified?.lifecycleEvents ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Second-life evaluations <DataSource label="off-chain" /></span>
          <strong>{data.offChain?.secondLifeEvaluations ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Recycling verified <DataSource label="on-chain" /></span>
          <strong>{data.onChainVerified?.recyclingVerified ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Components valued <DataSource label="off-chain" /></span>
          <strong>{data.offChain?.componentsValued ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Estimated diversion kg <DataSource label="estimate" /></span>
          <strong>{data.estimates?.divertedKg ?? "—"}</strong>
        </article>
      </section>
      <section className="app-panel">
        <h3>Assumptions</h3>
        <p>{IMPACT_ASSUMPTIONS.note}</p>
        <p>Proxy mass: {IMPACT_ASSUMPTIONS.kgPerBatteryProxy} kg per verified recycled battery record.</p>
      </section>
    </div>
  );
}
