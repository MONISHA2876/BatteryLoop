import { Contract, JsonRpcProvider } from "ethers";
import {
  getContractAddresses,
  getPublicChainConfig,
  requireContractAddress,
} from "@/lib/blockchain/config";
import {
  BATTERY_LIFECYCLE_ABI,
  BATTERY_PASSPORT_ABI,
  CIRCULARITY_REWARDS_ABI,
} from "@/lib/blockchain/abis";
import { ROLE_IDS } from "@/lib/blockchain/roles";

export function getReadProvider() {
  const { rpcUrl } = getPublicChainConfig();
  return new JsonRpcProvider(rpcUrl, getPublicChainConfig().chainId, {
    staticNetwork: true,
  });
}

export function passportContract() {
  return new Contract(requireContractAddress("passport"), BATTERY_PASSPORT_ABI, getReadProvider());
}

export function lifecycleContract() {
  return new Contract(requireContractAddress("lifecycle"), BATTERY_LIFECYCLE_ABI, getReadProvider());
}

export function rewardsContract() {
  return new Contract(requireContractAddress("rewards"), CIRCULARITY_REWARDS_ABI, getReadProvider());
}

export type OnChainBattery = {
  batteryId: string;
  metadataHash: string;
  manufacturer: string;
  registeredAt: string;
  exists: boolean;
};

export async function readOnChainBattery(batteryId: string): Promise<OnChainBattery | null> {
  const addresses = getContractAddresses();
  if (!addresses.passport) return null;
  const contract = passportContract();
  const [id, metadataHash, manufacturer, registeredAt, exists] = await contract.getBattery(batteryId);
  return {
    batteryId: String(id),
    metadataHash: String(metadataHash),
    manufacturer: String(manufacturer),
    registeredAt: String(registeredAt),
    exists: Boolean(exists),
  };
}

export async function readLifecycleEventCount(batteryId: string): Promise<number | null> {
  const addresses = getContractAddresses();
  if (!addresses.lifecycle) return null;
  const count = await lifecycleContract().eventCount(batteryId);
  return Number(count);
}

export async function readLifecycleEvent(batteryId: string, index: number) {
  const contract = lifecycleContract();
  const call = contract.getFunction("getEvent");
  const result = await call(batteryId, index);
  const [eventBatteryId, eventType, dataHash, actor, timestamp] = result as [string, bigint, string, string, bigint];
  return {
    batteryId: String(eventBatteryId),
    eventType: Number(eventType),
    dataHash: String(dataHash),
    actor: String(actor),
    timestamp: String(timestamp),
  };
}

export async function readRewardsState() {
  const addresses = getContractAddresses();
  if (!addresses.rewards) return null;
  const contract = rewardsContract();
  const [pool, recyclerReward, consumerReward] = await Promise.all([
    contract.poolBalance(),
    contract.recyclerReward(),
    contract.consumerReward(),
  ]);
  return {
    poolBalanceWei: String(pool),
    recyclerRewardWei: String(recyclerReward),
    consumerRewardWei: String(consumerReward),
  };
}

export async function isBatteryRecycled(batteryId: string): Promise<boolean | null> {
  const addresses = getContractAddresses();
  if (!addresses.rewards) return null;
  return Boolean(await rewardsContract().recycled(batteryId));
}

export async function hasOnChainRole(
  contractKind: "passport" | "lifecycle" | "rewards",
  role: keyof typeof ROLE_IDS,
  account: string,
): Promise<boolean | null> {
  const addresses = getContractAddresses();
  if (!addresses[contractKind]) return null;
  const contract =
    contractKind === "passport"
      ? passportContract()
      : contractKind === "lifecycle"
        ? lifecycleContract()
        : rewardsContract();
  return Boolean(await contract.hasRole(ROLE_IDS[role], account));
}
