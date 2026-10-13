"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, DataSource, PageHeader, PrimaryButton, SecondaryButton } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";

type Detection = {
  name: string;
  description: string;
  conditionEstimate: string;
  confidence: string;
  uncertainty: string;
};

type ScanResult = {
  scan: { id: string; status: string; summary: string | null };
  result?: { summary: string; detections: Detection[]; limitations: string };
};

export default function PcbScannerPage() {
  const { config, session } = useWallet();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScanResult | null>(null);

  function onFile(next: File | null) {
    setFile(next);
    setData(null);
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/ai/pcb", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Analysis failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    if (!data?.scan.id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/ai/pcb/${data.scan.id}/retry`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Retry failed");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Computer vision"
        title="PCB and e-waste scanner"
        description="Visual identification only. An image cannot establish exact composition, electrical function, or true market value."
      />
      {!session.user ? <Banner tone="info">Sign in to upload and save scans.</Banner> : null}
      {!config?.gemini.configured ? (
        <Banner tone="warn">Images can still be stored, but analysis requires GEMINI_API_KEY.</Banner>
      ) : null}
      <section
        className="app-panel dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0] || null);
        }}
      >
        <p>Drop a JPEG, PNG, or WebP image here, up to 8 MB.</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Upload preview" className="preview-image" />
        ) : null}
        <div className="row-actions">
          <PrimaryButton disabled={!file || busy} onClick={() => void analyze()}>
            {busy ? "Analyzing…" : "Analyze image"}
          </PrimaryButton>
          <SecondaryButton onClick={() => onFile(null)}>Remove</SecondaryButton>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </section>
      {data?.result ? (
        <section className="app-panel">
          <h3>Visually identified components <DataSource label="ai" /></h3>
          <p>{data.result.summary}</p>
          <p>{data.result.limitations}</p>
          <ul className="plain-list">
            {data.result.detections.map((d) => (
              <li key={`${d.name}-${d.confidence}`}>
                <span>
                  {d.name} · {d.confidence} · {d.conditionEstimate}
                </span>
                <small>{d.uncertainty}</small>
              </li>
            ))}
          </ul>
          <div className="row-actions">
            <PrimaryButton
              onClick={() => router.push(`/dashboard/valuation?scan=${data.scan.id}`)}
            >
              Send to valuation
            </PrimaryButton>
            <SecondaryButton
              onClick={() =>
                router.push(
                  `/dashboard/marketplace?draft=1&title=${encodeURIComponent(data.result?.detections[0]?.name || "Recovered component")}`,
                )
              }
            >
              Marketplace draft
            </SecondaryButton>
            <SecondaryButton onClick={() => void retry()}>Retry analysis</SecondaryButton>
          </div>
        </section>
      ) : null}
    </div>
  );
}
