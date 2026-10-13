"use client";

import { useEffect, useState } from "react";
import { Banner, Field, PageHeader, PrimaryButton } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { parseEther, formatEther } from "ethers";
import { describeChainError } from "@/lib/blockchain/errors";
import { explorerTxUrl } from "@/lib/blockchain/config";

type Rewards = {
  configured?: boolean;
  error?: string;
  poolBalanceFlow?: string;
  recyclerRewardFlow?: string;
  consumerRewardFlow?: string;
  recycled?: boolean | null;
};

export default function RewardsPage() {
  const { rewardsContract, session, wrongNetwork } = useWallet();
  const [data, setData] = useState<Rewards | null>(null);
  const [amount, setAmount] = useState("0.01");
  const [tx, setTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(batteryId?: string) {
    const url = batteryId ? `/api/rewards?batteryId=${batteryId}` : "/api/rewards";
    setData(await fetch(url).then((r) => r.json()));
  }

  useEffect(() => {
    void load();
  }, []);

  async function deposit() {
    setError(null);
    try {
      if (wrongNetwork) throw new Error("Switch to Flow EVM Testnet.");
      const value = parseEther(amount);
      if (value <= 0n) throw new Error("Enter a positive testnet amount.");
      if (!window.confirm(`Deposit ${amount} testnet FLOW into the reward pool?`)) return;
      const contract = await rewardsContract();
      const sent = await contract.deposit({ value });
      const receipt = await sent.wait();
      setTx(receipt.hash);
      await load();
    } catch (err) {
      setError(describeChainError(err).message);
    }
  }

  async function setRewards(formData: FormData) {
    setError(null);
    try {
      const contract = await rewardsContract();
      const recycler = parseEther(String(formData.get("recycler") || "0"));
      const consumer = parseEther(String(formData.get("consumer") || "0"));
      const sent = await contract.setRewards(recycler, consumer);
      const receipt = await sent.wait();
      setTx(receipt.hash);
      await load();
    } catch (err) {
      setError(describeChainError(err).message);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="CircularityRewards"
        title="Reward pool"
        description="Anyone can deposit testnet FLOW. Only DEFAULT_ADMIN_ROLE can change payout amounts. Only VERIFIER_ROLE can verify recycling, which pays out immediately. Use small testnet amounts."
      />
      {!data?.configured ? <Banner tone="warn">{data?.error || "Rewards contract is not configured."}</Banner> : null}
      <section className="dashboard-metrics">
        <article className="dashboard-stat">
          <span>Pool</span>
          <strong>{data?.poolBalanceFlow ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Recycler reward</span>
          <strong>{data?.recyclerRewardFlow ?? "—"}</strong>
        </article>
        <article className="dashboard-stat">
          <span>Consumer reward</span>
          <strong>{data?.consumerRewardFlow ?? "—"}</strong>
        </article>
      </section>
      <div className="split-grid">
        <form
          className="app-panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void deposit();
          }}
        >
          <h3>Deposit testnet FLOW</h3>
          <Field label="Amount (FLOW)">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <p>Required confirmation before the wallet popup. Do not use mainnet funds.</p>
          <PrimaryButton type="submit">Deposit</PrimaryButton>
        </form>
        <form
          className="app-panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void setRewards(new FormData(e.currentTarget));
          }}
        >
          <h3>Configure rewards</h3>
          <p>Requires DEFAULT_ADMIN_ROLE on CircularityRewards.</p>
          <Field label="Recycler reward (FLOW)">
            <input name="recycler" defaultValue={data?.recyclerRewardFlow || "0"} />
          </Field>
          <Field label="Consumer reward (FLOW)">
            <input name="consumer" defaultValue={data?.consumerRewardFlow || "0"} />
          </Field>
          <PrimaryButton type="submit" disabled={session.chainRoles?.rewardsAdmin === false}>
            setRewards
          </PrimaryButton>
        </form>
        <form
          className="app-panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void load(String(new FormData(e.currentTarget).get("batteryId") || ""));
          }}
        >
          <h3>Already recycled?</h3>
          <Field label="Battery ID">
            <input name="batteryId" />
          </Field>
          <PrimaryButton type="submit">Check recycled()</PrimaryButton>
          {data?.recycled === true ? <p>Already verified on-chain.</p> : null}
          {data?.recycled === false ? <p>Not yet verified on-chain.</p> : null}
        </form>
      </div>
      {tx ? (
        <p>
          Last tx:{" "}
          <a href={explorerTxUrl(tx)} target="_blank" rel="noreferrer">
            {tx}
          </a>
        </p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
