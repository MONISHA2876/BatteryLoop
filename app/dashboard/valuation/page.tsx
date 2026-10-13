"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Banner, DataSource, Field, PageHeader, PrimaryButton } from "@/components/ui/primitives";
import { api } from "@/lib/client/api";
import { CONDITIONS } from "@/lib/validation/battery";

type Result = {
  numeric: { indicativeValueUsd: number | null; valueLabel: string };
  ai: { classification: string; explanation: string; caveats: string[] } | null;
  geminiConfigured: boolean;
  valuation: { id: string };
};

function ValuationForm() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      const data = await api<Result>("/api/ai/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pcbScanId: params.get("scan"),
          batteryId: String(formData.get("batteryId") || "") || null,
          category: String(formData.get("category")),
          quantity: Number(formData.get("quantity")),
          condition: String(formData.get("condition")),
          specifications: String(formData.get("specifications") || ""),
          unitPriceUsd: formData.get("unitPriceUsd") ? Number(formData.get("unitPriceUsd")) : null,
          notes: String(formData.get("notes") || ""),
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Valuation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form
        className="app-panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(new FormData(e.currentTarget));
        }}
      >
        <Field label="Category">
          <input name="category" required defaultValue="PCB" />
        </Field>
        <Field label="Quantity">
          <input name="quantity" type="number" min="0" step="0.01" required defaultValue="1" />
        </Field>
        <Field label="Condition">
          <select name="condition">{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Unit price USD (from a known source)">
          <input name="unitPriceUsd" type="number" step="0.01" />
        </Field>
        <Field label="Battery ID (optional)">
          <input name="batteryId" />
        </Field>
        <Field label="Specifications">
          <textarea name="specifications" rows={3} />
        </Field>
        <PrimaryButton disabled={busy} type="submit">
          {busy ? "Calculating…" : "Save valuation"}
        </PrimaryButton>
        {error ? <p className="form-error">{error}</p> : null}
      </form>
      {result ? (
        <section className="split-grid">
          <article className="app-panel">
            <h3>Numeric result <DataSource label="estimate" /></h3>
            <p className="stat-value">
              {result.numeric.indicativeValueUsd === null ? "n/a" : `$${result.numeric.indicativeValueUsd}`}
            </p>
            <p>{result.numeric.valueLabel}</p>
            <a className="primary-btn" href={`/dashboard/marketplace?valuation=${result.valuation.id}`}>
              Create listing draft
            </a>
          </article>
          <article className="app-panel">
            <h3>Model explanation <DataSource label="ai" /></h3>
            {result.ai ? (
              <>
                <p>{result.ai.classification}</p>
                <p>{result.ai.explanation}</p>
                <ul>{result.ai.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
              </>
            ) : (
              <p>Gemini is not configured, so only the deterministic calculation was stored.</p>
            )}
          </article>
        </section>
      ) : null}
    </>
  );
}

export default function ValuationPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Recovery value"
        title="Component valuation"
        description="Deterministic math uses quantity × your supplied unit price × a condition factor. Gemini never invents live market prices."
      />
      <Banner tone="info">If you do not provide a unit price from a known source, value is reported as undetermined.</Banner>
      <Suspense fallback={<p>Loading form…</p>}>
        <ValuationForm />
      </Suspense>
    </div>
  );
}
