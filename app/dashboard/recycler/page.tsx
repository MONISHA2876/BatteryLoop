"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banner, Field, PageHeader, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";
import { describeChainError } from "@/lib/blockchain/errors";
import { explorerTxUrl } from "@/lib/blockchain/config";
import { formatEther, ZeroAddress } from "ethers";

type RecordRow = {
  id: string;
  batteryId: string;
  recyclerAddress: string;
  consumerAddress: string | null;
  status: string;
  chainStatus: string;
  notes: string | null;
  txHash: string | null;
};

export default function RecyclerPage() {
  const { session, rewardsContract, wrongNetwork } = useWallet();
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [rewards, setRewards] = useState<{ recyclerRewardFlow?: string; poolBalanceFlow?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<{ records: RecordRow[]; rewards: unknown }>("/api/recycling");
    setRecords(data.records);
    const rewardState = await fetch("/api/rewards").then((r) => r.json());
    setRewards(rewardState);
  }

  useEffect(() => {
    if (session.user) void load().catch((e) => setError(e.message));
  }, [session.user]);

  async function submitJob(formData: FormData) {
    setError(null);
    try {
      await api("/api/recycling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batteryId: String(formData.get("batteryId")),
          consumerAddress: String(formData.get("consumerAddress") || "") || null,
          notes: String(formData.get("notes") || ""),
          recoveredJson: String(formData.get("recoveredJson") || "[]"),
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    }
  }

  async function verify(record: RecordRow) {
    setError(null);
    try {
      if (wrongNetwork) throw new Error("Switch to Flow EVM Testnet.");
      const contract = await rewardsContract();
      const recyclerReward = await contract.recyclerReward();
      const consumerReward = await contract.consumerReward();
      const pool = await contract.poolBalance();
      const needed = recyclerReward + (record.consumerAddress ? consumerReward : 0n);
      if (pool < needed) {
        throw new Error(
          `Insufficient pool: ${formatEther(pool)} FLOW available, ${formatEther(needed)} FLOW required.`,
        );
      }
      const already = await contract.recycled(record.batteryId);
      if (already) throw new Error("This battery is already recycled on-chain.");
      const tx = await contract.verifyRecycling(
        record.batteryId,
        record.recyclerAddress,
        record.consumerAddress || ZeroAddress,
      );
      await api(`/api/recycling/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chainStatus: "PENDING", txHash: tx.hash, status: "VERIFYING" }),
      });
      const receipt = await tx.wait();
      await api(`/api/recycling/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainStatus: "CONFIRMED",
          status: "VERIFIED",
          txHash: receipt.hash,
          recyclerAmountWei: String(recyclerReward),
          consumerAmountWei: record.consumerAddress ? String(consumerReward) : "0",
        }),
      });
      await load();
    } catch (err) {
      setError(describeChainError(err).message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recycler operations"
        title="Recycler dashboard"
        description="A recycler submits a completion request in the app. An account with VERIFIER_ROLE then calls verifyRecycling, and the contract itself pays recycler and consumer from the pool. There is no separate claim function."
      />
      {session.user && session.user.appRole !== "RECYCLER" && session.user.appRole !== "ADMIN" ? (
        <Banner tone="warn">Your application role is not recycler. An admin can grant it on the Admin page.</Banner>
      ) : null}
      {session.chainRoles?.verifier === false ? (
        <Banner tone="info">
          You can submit jobs, but on-chain verification requires VERIFIER_ROLE. Do not send verifyRecycling from an
          unauthorized wallet.
        </Banner>
      ) : null}
      <p>
        Pool: {rewards?.poolBalanceFlow ?? "—"} FLOW · Recycler reward: {rewards?.recyclerRewardFlow ?? "—"} FLOW
      </p>
      <form
        className="app-panel form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          void submitJob(new FormData(e.currentTarget));
        }}
      >
        <Field label="Battery ID">
          <input name="batteryId" required />
        </Field>
        <Field label="Consumer address (optional payout)">
          <input name="consumerAddress" />
        </Field>
        <Field label="Recovered materials JSON">
          <textarea name="recoveredJson" defaultValue='[{"name":"copper","note":"visual only"}]' />
        </Field>
        <Field label="Notes">
          <textarea name="notes" />
        </Field>
        <PrimaryButton type="submit">Submit recycling request</PrimaryButton>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="card-grid">
        {records.map((record) => (
          <article key={record.id} className="app-panel">
            <StatusChip status={record.status} />
            <StatusChip status={record.chainStatus} />
            <p className="mono-wrap">{record.batteryId}</p>
            <Link href={`/passport/${record.batteryId}`}>Passport</Link>
            {record.txHash ? (
              <a href={explorerTxUrl(record.txHash)} target="_blank" rel="noreferrer">
                Verification tx
              </a>
            ) : null}
            {session.chainRoles?.verifier ? (
              <PrimaryButton onClick={() => void verify(record)}>Verify on-chain</PrimaryButton>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
