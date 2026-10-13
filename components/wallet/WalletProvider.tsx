"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BrowserProvider, Contract } from "ethers";
import {
  BATTERY_LIFECYCLE_ABI,
  BATTERY_PASSPORT_ABI,
  CIRCULARITY_REWARDS_ABI,
} from "@/lib/blockchain/abis";
import { describeChainError } from "@/lib/blockchain/errors";
import { ROLE_IDS } from "@/lib/blockchain/roles";

type ChainConfig = {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

type ContractsConfig = {
  passport: string | null;
  lifecycle: string | null;
  rewards: string | null;
  missing: string[];
  invalid: string[];
  ready: boolean;
};

export type AppConfig = {
  chain: ChainConfig;
  contracts: ContractsConfig;
  gemini: { configured: boolean; model: string | null };
  database: { configured: boolean };
  auth: { configured: boolean };
};

type SessionState = {
  user: { address: string; appRole: string; displayName: string | null } | null;
  chainRoles: {
    registrar: boolean | null;
    recorder: boolean | null;
    verifier: boolean | null;
    passportAdmin: boolean | null;
    rewardsAdmin: boolean | null;
  } | null;
};

type WalletContextValue = {
  config: AppConfig | null;
  account: string | null;
  chainId: number | null;
  connecting: boolean;
  signingIn: boolean;
  session: SessionState;
  error: string | null;
  wrongNetwork: boolean;
  hasInjectedWallet: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  signIn: () => Promise<void>;
  getSigner: () => Promise<BrowserProvider>;
  passportContract: () => Promise<Contract>;
  lifecycleContract: () => Promise<Contract>;
  rewardsContract: () => Promise<Contract>;
  refreshSession: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used within WalletProvider");
  return value;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [session, setSession] = useState<SessionState>({ user: null, chainRoles: null });
  const [error, setError] = useState<string | null>(null);
  const [hasInjectedWallet, setHasInjectedWallet] = useState(false);

  const refreshSession = useCallback(async () => {
    const res = await fetch("/api/auth/session");
    const data = (await res.json()) as SessionState;
    setSession(data);
  }, []);

  useEffect(() => {
    setHasInjectedWallet(typeof window !== "undefined" && Boolean(window.ethereum));
    void fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig);
    void refreshSession();
  }, [refreshSession]);

  const syncChain = useCallback(async () => {
    if (!window.ethereum) return;
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    setChainId(Number(network.chainId));
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accounts: unknown) => {
      const list = accounts as string[];
      setAccount(list[0]?.toLowerCase() ?? null);
    };
    const onChain = () => {
      void syncChain();
    };
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccounts);
      window.ethereum?.removeListener("chainChanged", onChain);
    };
  }, [syncChain]);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum || !config) throw new Error("Wallet or chain config unavailable.");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: config.chain.chainIdHex }],
      });
    } catch (err) {
      const code = (err as { code?: number }).code;
      if (code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: config.chain.chainIdHex,
              chainName: config.chain.name,
              nativeCurrency: config.chain.nativeCurrency,
              rpcUrls: [config.chain.rpcUrl],
              blockExplorerUrls: [config.chain.explorerUrl],
            },
          ],
        });
      } else {
        throw err;
      }
    }
    await syncChain();
  }, [config, syncChain]);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("No injected wallet found. Install MetaMask or another injected wallet.");
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(String(accounts[0]).toLowerCase());
      await syncChain();
    } catch (err) {
      setError(describeChainError(err).message);
    } finally {
      setConnecting(false);
    }
  }, [syncChain]);

  const signIn = useCallback(async () => {
    if (!account || !window.ethereum) {
      setError("Connect a wallet first.");
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account }),
      });
      const nonceJson = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceJson.error || "Could not start sign-in.");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonceJson.message);
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account, message: nonceJson.message, signature }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyJson.error || "Sign-in failed.");
      await refreshSession();
    } catch (err) {
      setError(describeChainError(err).message);
    } finally {
      setSigningIn(false);
    }
  }, [account, refreshSession]);

  const disconnect = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ user: null, chainRoles: null });
    setAccount(null);
  }, []);

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("No injected wallet found.");
    return new BrowserProvider(window.ethereum);
  }, []);

  const contractFor = useCallback(
    async (kind: "passport" | "lifecycle" | "rewards") => {
      if (!config?.contracts[kind]) {
        throw new Error(`Missing ${kind} contract address. Configure it in .env.local.`);
      }
      const provider = await getSigner();
      const signer = await provider.getSigner();
      const abi =
        kind === "passport"
          ? BATTERY_PASSPORT_ABI
          : kind === "lifecycle"
            ? BATTERY_LIFECYCLE_ABI
            : CIRCULARITY_REWARDS_ABI;
      return new Contract(config.contracts[kind] as string, abi, signer);
    },
    [config, getSigner],
  );

  const wrongNetwork = Boolean(config && chainId && chainId !== config.chain.chainId);

  const value = useMemo<WalletContextValue>(
    () => ({
      config,
      account,
      chainId,
      connecting,
      signingIn,
      session,
      error,
      wrongNetwork,
      hasInjectedWallet,
      connect,
      disconnect,
      switchNetwork,
      signIn,
      getSigner,
      passportContract: () => contractFor("passport"),
      lifecycleContract: () => contractFor("lifecycle"),
      rewardsContract: () => contractFor("rewards"),
      refreshSession,
    }),
    [
      config,
      account,
      chainId,
      connecting,
      signingIn,
      session,
      error,
      wrongNetwork,
      hasInjectedWallet,
      connect,
      disconnect,
      switchNetwork,
      signIn,
      getSigner,
      contractFor,
      refreshSession,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export async function readHasRole(contract: Contract, role: keyof typeof ROLE_IDS, account: string) {
  return Boolean(await contract.hasRole(ROLE_IDS[role], account));
}
