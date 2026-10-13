import { isAddress } from "ethers";

export const FLOW_EVM_TESTNET = {
  chainId: 545,
  chainIdHex: "0x221",
  name: "Flow EVM Testnet",
  rpcUrl: "https://testnet.evm.nodes.onflow.org",
  explorerUrl: "https://evm-testnet.flowscan.io",
  nativeCurrency: {
    name: "FLOW",
    symbol: "FLOW",
    decimals: 18,
  },
} as const;

function parseChainId(raw: string | undefined): number {
  if (!raw || raw.trim() === "") return FLOW_EVM_TESTNET.chainId;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("NEXT_PUBLIC_FLOW_EVM_CHAIN_ID must be a positive integer.");
  }
  return n;
}

function optionalAddress(raw: string | undefined, label: string): string | null {
  if (!raw || raw.trim() === "") return null;
  if (!isAddress(raw)) {
    throw new Error(`${label} is not a valid Ethereum address.`);
  }
  return raw;
}

export type ContractConfigStatus = {
  passport: string | null;
  lifecycle: string | null;
  rewards: string | null;
  missing: string[];
  invalid: string[];
};

export function getPublicChainConfig() {
  const chainId = parseChainId(process.env.NEXT_PUBLIC_FLOW_EVM_CHAIN_ID);
  const rpcUrl =
    process.env.NEXT_PUBLIC_FLOW_EVM_RPC_URL?.trim() ||
    process.env.FLOW_EVM_RPC_URL?.trim() ||
    FLOW_EVM_TESTNET.rpcUrl;

  return {
    chainId,
    chainIdHex: `0x${chainId.toString(16)}`,
    name: chainId === FLOW_EVM_TESTNET.chainId ? FLOW_EVM_TESTNET.name : `EVM chain ${chainId}`,
    rpcUrl,
    explorerUrl:
      process.env.NEXT_PUBLIC_FLOW_EVM_EXPLORER_URL?.trim() || FLOW_EVM_TESTNET.explorerUrl,
    nativeCurrency: FLOW_EVM_TESTNET.nativeCurrency,
  };
}

export function getContractAddresses(): ContractConfigStatus {
  const missing: string[] = [];
  const invalid: string[] = [];

  const read = (key: string) => {
    const value = process.env[key]?.trim();
    if (!value) {
      missing.push(key);
      return null;
    }
    if (!isAddress(value)) {
      invalid.push(key);
      return null;
    }
    return value;
  };

  return {
    passport: read("NEXT_PUBLIC_BATTERY_PASSPORT_ADDRESS"),
    lifecycle: read("NEXT_PUBLIC_BATTERY_LIFECYCLE_ADDRESS"),
    rewards: read("NEXT_PUBLIC_CIRCULARITY_REWARDS_ADDRESS"),
    missing,
    invalid,
  };
}

export function requireContractAddress(
  kind: "passport" | "lifecycle" | "rewards",
): string {
  const addresses = getContractAddresses();
  const value = addresses[kind];
  if (!value) {
    const issue = [...addresses.missing, ...addresses.invalid].join(", ");
    throw new Error(
      `Contract address for ${kind} is not configured. Set the NEXT_PUBLIC_* address environment variables. Issues: ${issue || "unknown"}`,
    );
  }
  return value;
}

export function explorerTxUrl(txHash: string): string {
  const { explorerUrl } = getPublicChainConfig();
  return `${explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  const { explorerUrl } = getPublicChainConfig();
  return `${explorerUrl.replace(/\/$/, "")}/address/${address}`;
}

export function getWalletAddChainParams() {
  const chain = getPublicChainConfig();
  return {
    chainId: chain.chainIdHex,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [chain.rpcUrl],
    blockExplorerUrls: [chain.explorerUrl],
  };
}

export { optionalAddress };
