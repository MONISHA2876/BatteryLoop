"use client";

import { useEffect, useState } from "react";
import { Banner, Field, PageHeader, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";
import { LIFECYCLE_EVENT_TYPES } from "@/lib/blockchain/lifecycle";
import { describeChainError } from "@/lib/blockchain/errors";
import { explorerTxUrl } from "@/lib/blockchain/config";

type EventRow = {
  id: string;
  batteryId: string;
  eventType: number;
  dataHash: string;
  chainStatus: string;
  txHash: string | null;
};

export default function LifecyclePage() {
  const { session, wrongNetwork, lifecycleContract } = useWallet();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const data = await api<{ events: EventRow[] }>("/api/lifecycle");
    setEvents(data.events);
  }

  useEffect(() => {
    if (session.user) void reload().catch((e) => setError(e.message));
  }, [session.user]);

  async function submit(formData: FormData) {
    setBusy(true);
    setError(null);
    try {
      if (!session.user) throw new Error("Sign in first.");
      if (wrongNetwork) throw new Error("Switch network first.");
      const payload = {
        batteryId: String(formData.get("batteryId")),
        eventType: Number(formData.get("eventType")),
        notes: String(formData.get("notes") || ""),
        location: String(formData.get("location") || ""),
        fromAddress: String(formData.get("fromAddress") || "") || null,
        toAddress: String(formData.get("toAddress") || "") || null,
      };
      const created = await api<{ event: EventRow; dataHash: string; useOwnership: boolean }>("/api/lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const contract = await lifecycleContract();
      const tx = created.useOwnership
        ? await contract.recordOwnership(
            payload.batteryId,
            payload.fromAddress || "0x0000000000000000000000000000000000000000",
            payload.toAddress,
            created.dataHash,
          )
        : await contract.recordEvent(payload.batteryId, payload.eventType, created.dataHash);
      await api(`/api/lifecycle/${created.event.id}/tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING", txHash: tx.hash }),
      });
      await tx.wait();
      await api(`/api/lifecycle/${created.event.id}/tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED", txHash: tx.hash }),
      });
      await reload();
    } catch (err) {
      setError(describeChainError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Provenance"
        title="Lifecycle events"
        description="Full payloads stay in the database. The BatteryLifecycle contract stores a hash, actor, type, and timestamp. RECORDER_ROLE is required. Events are never labelled blockchain-verified without a confirmed receipt."
      />
      {session.chainRoles?.recorder === false ? (
        <Banner tone="warn">This account does not currently have RECORDER_ROLE.</Banner>
      ) : null}
      <form
        className="app-panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(new FormData(e.currentTarget));
        }}
      >
        <Field label="Battery ID (bytes32 hex)">
          <input name="batteryId" required placeholder="0x…" />
        </Field>
        <Field label="Event type">
          <select name="eventType" defaultValue="1">
            {Object.entries(LIFECYCLE_EVENT_TYPES).map(([id, meta]) => (
              <option key={id} value={id}>
                {id} — {meta.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From (ownership only)">
          <input name="fromAddress" placeholder="0x…" />
        </Field>
        <Field label="To (required for type 2)">
          <input name="toAddress" placeholder="0x…" />
        </Field>
        <Field label="Location">
          <input name="location" />
        </Field>
        <Field label="Notes">
          <textarea name="notes" rows={4} />
        </Field>
        <PrimaryButton disabled={busy} type="submit">
          {busy ? "Recording…" : "Save payload and submit proof"}
        </PrimaryButton>
        {error ? <p className="form-error">{error}</p> : null}
      </form>
      <section className="app-panel">
        <h3>Recorded events</h3>
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          <ul className="plain-list">
            {events.map((event) => (
              <li key={event.id}>
                <span>
                  {LIFECYCLE_EVENT_TYPES[event.eventType as 0]?.label ?? event.eventType} · {event.batteryId.slice(0, 12)}…
                </span>
                <StatusChip status={event.chainStatus} />
                {event.txHash ? (
                  <a href={explorerTxUrl(event.txHash)} target="_blank" rel="noreferrer">
                    tx
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
