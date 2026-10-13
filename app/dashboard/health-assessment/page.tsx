"use client";

import { useState } from "react";
import { Banner, DataSource, Field, PageHeader, PrimaryButton } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";
import { CAPACITY_UNITS, CHEMISTRIES } from "@/lib/validation/battery";

type Result = {
  soh: { sohEstimate: number | null; sohMethod: string };
  ai: {
    summary: string;
    observedIndicators: string[];
    possibleRisks: string[];
    missingInformation: string[];
    suggestedNextSteps: string[];
    confidence: string;
    limitations: string;
  };
};

export default function HealthPage() {
  const { config, session } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const data = await api<Result>("/api/ai/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batteryId: String(formData.get("batteryId") || "") || null,
          chemistry: String(formData.get("chemistry")),
          ratedCapacity: formData.get("ratedCapacity") ? Number(formData.get("ratedCapacity")) : null,
          measuredCapacity: formData.get("measuredCapacity") ? Number(formData.get("measuredCapacity")) : null,
          capacityUnit: String(formData.get("capacityUnit") || "kWh"),
          voltageV: formData.get("voltageV") ? Number(formData.get("voltageV")) : null,
          cycleCount: formData.get("cycleCount") ? Number(formData.get("cycleCount")) : null,
          temperatureC: formData.get("temperatureC") ? Number(formData.get("temperatureC")) : null,
          notes: String(formData.get("notes") || ""),
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assessment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Diagnostics"
        title="AI battery health assessment"
        description="Gemini structures observations from the data you supply. A numerical SoH is only calculated when both rated and measured capacity are present, using measured ÷ rated. This does not replace certified safety testing."
      />
      {!config?.gemini.configured ? (
        <Banner tone="warn">GEMINI_API_KEY is not configured. No fake assessment will be generated.</Banner>
      ) : null}
      {!session.user ? <Banner tone="info">Sign in to save assessments against your account.</Banner> : null}
      <form
        className="app-panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(new FormData(e.currentTarget));
        }}
      >
        <Field label="Battery ID (optional)">
          <input name="batteryId" placeholder="0x…" />
        </Field>
        <Field label="Chemistry">
          <select name="chemistry">{CHEMISTRIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <div className="two-col">
          <Field label="Rated capacity">
            <input name="ratedCapacity" type="number" step="0.01" />
          </Field>
          <Field label="Measured capacity">
            <input name="measuredCapacity" type="number" step="0.01" />
          </Field>
        </div>
        <Field label="Capacity unit">
          <select name="capacityUnit">{CAPACITY_UNITS.map((u) => <option key={u}>{u}</option>)}</select>
        </Field>
        <Field label="Voltage (V)">
          <input name="voltageV" type="number" step="0.01" />
        </Field>
        <Field label="Cycle count">
          <input name="cycleCount" type="number" />
        </Field>
        <Field label="Temperature (°C)">
          <input name="temperatureC" type="number" step="0.1" />
        </Field>
        <Field label="Notes">
          <textarea name="notes" rows={4} />
        </Field>
        <PrimaryButton disabled={busy} type="submit">
          {busy ? "Assessing…" : "Run assessment"}
        </PrimaryButton>
        {error ? <p className="form-error">{error}</p> : null}
      </form>
      {result ? (
        <section className="split-grid">
          <article className="app-panel">
            <h3>Capacity-ratio estimate <DataSource label="estimate" /></h3>
            <p className="stat-value">{result.soh.sohEstimate === null ? "n/a" : `${result.soh.sohEstimate}%`}</p>
            {result.soh.sohEstimate !== null ? (
              <div className="meter">
                <span style={{ width: `${result.soh.sohEstimate}%` }} />
              </div>
            ) : null}
            <p>{result.soh.sohMethod}</p>
          </article>
          <article className="app-panel">
            <h3>Model summary <DataSource label="ai" /></h3>
            <p>{result.ai.summary}</p>
            <p>Confidence: {result.ai.confidence}</p>
            <p>{result.ai.limitations}</p>
          </article>
          <article className="app-panel">
            <h4>Indicators</h4>
            <ul>{result.ai.observedIndicators.map((i) => <li key={i}>{i}</li>)}</ul>
          </article>
          <article className="app-panel">
            <h4>Risks and gaps</h4>
            <ul>{result.ai.possibleRisks.map((i) => <li key={i}>{i}</li>)}</ul>
            <ul>{result.ai.missingInformation.map((i) => <li key={i}>{i}</li>)}</ul>
          </article>
        </section>
      ) : null}
    </div>
  );
}
