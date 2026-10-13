"use client";

import { useState } from "react";
import Link from "next/link";
import { Banner, Field, PageHeader, PrimaryButton, SecondaryButton } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";
import { describeChainError } from "@/lib/blockchain/errors";
import { explorerTxUrl } from "@/lib/blockchain/config";
import { CAPACITY_UNITS, CHEMISTRIES, CONDITIONS } from "@/lib/validation/battery";

type BatteryRecord = {
  batteryId: string;
  metadataHash: string;
  chainStatus: string;
  txHash?: string | null;
};

export default function RegisterBatteryPage() {
  const { account, session, wrongNetwork, passportContract, config } = useWallet();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [battery, setBattery] = useState<BatteryRecord | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setBusy(true);
    try {
      if (!session.user) throw new Error("Sign in with your wallet before registering.");
      if (wrongNetwork) throw new Error("Switch to Flow EVM Testnet before sending a transaction.");
      const payload = {
        name: String(formData.get("name") || ""),
        model: String(formData.get("model") || "") || null,
        manufacturerName: String(formData.get("manufacturerName") || ""),
        manufacturerAddress: String(formData.get("manufacturerAddress") || account || ""),
        chemistry: String(formData.get("chemistry") || "LFP"),
        capacityValue: Number(formData.get("capacityValue")),
        capacityUnit: String(formData.get("capacityUnit") || "kWh"),
        manufacturedAt: String(formData.get("manufacturedAt") || "") || null,
        serialNumber: String(formData.get("serialNumber") || "") || null,
        initialCondition: String(formData.get("initialCondition") || "unknown"),
      };
      const created = await api<{ battery: BatteryRecord; metadataHash: string; batteryId: string }>(
        "/api/batteries",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      setBattery(created.battery);
      const contract = await passportContract();
      const tx = await contract.registerBattery(
        created.batteryId,
        created.metadataHash,
        payload.manufacturerAddress,
      );
      await api(`/api/batteries/${created.batteryId}/tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING", txHash: tx.hash }),
      });
      setTxHash(tx.hash);
      await tx.wait();
      const confirmed = await api<{ battery: BatteryRecord }>(`/api/batteries/${created.batteryId}/tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED", txHash: tx.hash }),
      });
      setBattery(confirmed.battery);
    } catch (err) {
      const described = describeChainError(err);
      setError(err instanceof Error ? err.message : described.message);
      if (battery?.batteryId) {
        const status = described.code === "REJECTED" ? "REJECTED" : "FAILED";
        await fetch(`/api/batteries/${battery.batteryId}/tx`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }).catch(() => undefined);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Registration"
        title="Register a battery passport"
        description="Metadata is saved off-chain first as a DRAFT. The on-chain record stores only the battery ID, manufacturer address, and metadata hash. REGISTRAR_ROLE is required."
      />
      {session.chainRoles?.registrar === false ? (
        <Banner tone="warn">
          The signed-in account does not currently have REGISTRAR_ROLE on BatteryPassport. You can still prepare a
          draft, but registerBattery will revert until an admin grants the role.
        </Banner>
      ) : null}
      <form
        className="app-panel form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(new FormData(event.currentTarget));
        }}
      >
        <Field label="Battery name / model label">
          <input name="name" required placeholder="LFP traction pack 48V" />
        </Field>
        <Field label="Model code">
          <input name="model" placeholder="LFP-48-100" />
        </Field>
        <Field label="Manufacturer name">
          <input name="manufacturerName" required placeholder="Example Cells Ltd" />
        </Field>
        <Field label="Manufacturer wallet">
          <input name="manufacturerAddress" defaultValue={account ?? ""} placeholder="0x…" required />
        </Field>
        <Field label="Chemistry">
          <select name="chemistry" defaultValue="LFP">
            {CHEMISTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="two-col">
          <Field label="Capacity">
            <input name="capacityValue" type="number" step="0.01" min="0" required />
          </Field>
          <Field label="Unit">
            <select name="capacityUnit" defaultValue="kWh">
              {CAPACITY_UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Manufacturing date">
          <input name="manufacturedAt" type="date" />
        </Field>
        <Field label="Serial number">
          <input name="serialNumber" />
        </Field>
        <Field label="Initial condition">
          <select name="initialCondition" defaultValue="unknown">
            {CONDITIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="row-actions">
          <PrimaryButton disabled={busy} type="submit">
            {busy ? "Submitting…" : "Save and register on-chain"}
          </PrimaryButton>
          <SecondaryButton type="button" disabled={busy}>
            Draft only is created automatically before the wallet popup
          </SecondaryButton>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </form>

      {battery ? (
        <section className="app-panel">
          <h3>Registration status</h3>
          <p>Battery ID: {battery.batteryId}</p>
          <p>Status: {battery.chainStatus}</p>
          {txHash ? (
            <p>
              Transaction:{" "}
              <a href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">
                {txHash}
              </a>
            </p>
          ) : null}
          {config && !config.contracts.passport ? (
            <Banner tone="error">Passport contract address is not configured.</Banner>
          ) : null}
          {battery.chainStatus === "CONFIRMED" ? (
            <Link className="primary-btn" href={`/passport/${battery.batteryId}`}>
              Open public passport
            </Link>
          ) : (
            <Banner tone="info">
              This record is not marked blockchain-registered until getBattery confirms it on-chain.
            </Banner>
          )}
        </section>
      ) : null}
    </div>
  );
}
