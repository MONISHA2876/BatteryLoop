"use client";

import { useWallet } from "@/components/wallet/WalletProvider";
import { Banner } from "@/components/ui/primitives";

export function ConfigStrip() {
  const { config, wrongNetwork } = useWallet();
  if (!config) return null;
  const issues: string[] = [];
  if (!config.contracts.ready) {
    issues.push(
      `Contract addresses are incomplete. Missing: ${config.contracts.missing.join(", ") || "none"}. Invalid: ${config.contracts.invalid.join(", ") || "none"}.`,
    );
  }
  if (!config.database.configured) issues.push("DATABASE_URL is not set. Off-chain records cannot be saved.");
  if (!config.auth.configured) issues.push("AUTH_SECRET is not set. Wallet sign-in is disabled.");
  if (!config.gemini.configured) issues.push("GEMINI_API_KEY is not set. AI routes will show a setup message instead of fake results.");
  if (wrongNetwork) issues.push(`Switch to ${config.chain.name} (chain ID ${config.chain.chainId}) before sending transactions.`);

  if (issues.length === 0) return null;
  return (
    <div className="config-strip">
      {issues.map((issue) => (
        <Banner key={issue} tone="warn">
          {issue}
        </Banner>
      ))}
    </div>
  );
}
