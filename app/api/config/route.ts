import { NextResponse } from "next/server";
import { getContractAddresses, getPublicChainConfig } from "@/lib/blockchain/config";
import { ROLE_GUIDE } from "@/lib/blockchain/roles";
import { isGeminiConfigured, getGeminiModelName } from "@/lib/gemini/client";
import { isAuthConfigured } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db";
import { IMPACT_ASSUMPTIONS } from "@/lib/impact";

export async function GET() {
  const chain = getPublicChainConfig();
  const contracts = getContractAddresses();
  return NextResponse.json({
    chain,
    contracts: {
      passport: contracts.passport,
      lifecycle: contracts.lifecycle,
      rewards: contracts.rewards,
      missing: contracts.missing,
      invalid: contracts.invalid,
      ready: contracts.missing.length === 0 && contracts.invalid.length === 0,
    },
    gemini: {
      configured: isGeminiConfigured(),
      model: isGeminiConfigured() ? getGeminiModelName() : null,
    },
    database: { configured: isDatabaseConfigured() },
    auth: { configured: isAuthConfigured() },
    roles: ROLE_GUIDE,
    impactAssumptions: IMPACT_ASSUMPTIONS,
  });
}
