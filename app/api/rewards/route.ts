import { NextResponse } from "next/server";
import { formatEther } from "ethers";
import { handleRouteError } from "@/lib/api";
import { getContractAddresses } from "@/lib/blockchain/config";
import { isBatteryRecycled, readRewardsState } from "@/lib/blockchain/server";

export async function GET(request: Request) {
  try {
    const addresses = getContractAddresses();
    if (!addresses.rewards) {
      return NextResponse.json({
        configured: false,
        error:
          "NEXT_PUBLIC_CIRCULARITY_REWARDS_ADDRESS is missing or invalid. Add the deployed address in .env.local.",
      });
    }
    const state = await readRewardsState();
    const batteryId = new URL(request.url).searchParams.get("batteryId");
    const recycled = batteryId ? await isBatteryRecycled(batteryId) : null;
    return NextResponse.json({
      configured: true,
      ...state,
      poolBalanceFlow: state ? formatEther(state.poolBalanceWei) : null,
      recyclerRewardFlow: state ? formatEther(state.recyclerRewardWei) : null,
      consumerRewardFlow: state ? formatEther(state.consumerRewardWei) : null,
      recycled,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
