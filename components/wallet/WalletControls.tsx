"use client";

import { useWallet } from "@/components/wallet/WalletProvider";

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletControls() {
  const {
    account,
    chainId,
    config,
    connecting,
    signingIn,
    session,
    error,
    wrongNetwork,
    hasInjectedWallet,
    connect,
    switchNetwork,
    signIn,
    disconnect,
  } = useWallet();

  return (
    <div className="wallet-controls">
      <div className="network-pill">
        <span className={`net-dot ${wrongNetwork ? "bad" : chainId ? "ok" : ""}`} />
        {wrongNetwork
          ? "Wrong network"
          : chainId
            ? config?.chain.name ?? `Chain ${chainId}`
            : "Read-only"}
      </div>
      {!hasInjectedWallet ? (
        <span className="wallet-note">No injected wallet</span>
      ) : null}
      {!account ? (
        <button className="secondary-btn compact-btn" onClick={() => void connect()} disabled={connecting}>
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
      ) : (
        <>
          <span className="wallet-address">{shorten(account)}</span>
          {wrongNetwork ? (
            <button className="primary-btn compact-btn" onClick={() => void switchNetwork()}>
              Switch network
            </button>
          ) : null}
          {!session.user || session.user.address !== account ? (
            <button className="primary-btn compact-btn" onClick={() => void signIn()} disabled={signingIn}>
              {signingIn ? "Signing…" : "Sign in"}
            </button>
          ) : (
            <span className="role-pill">{session.user.appRole}</span>
          )}
          <button className="secondary-btn compact-btn" onClick={() => void disconnect()}>
            Disconnect
          </button>
        </>
      )}
      {error ? <p className="wallet-error">{error}</p> : null}
    </div>
  );
}
