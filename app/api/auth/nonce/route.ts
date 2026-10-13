import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getAddress } from "ethers";
import { getPrisma } from "@/lib/db";
import { assertDatabase, isAuthConfigured } from "@/lib/auth/session";
import { getPublicChainConfig } from "@/lib/blockchain/config";
import { buildSiweMessage } from "@/lib/auth/messages";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export async function POST(request: Request) {
  try {
    if (!isAuthConfigured()) {
      throw new Error("AUTH_SECRET is missing or too short. Set it in .env.local.");
    }
    assertDatabase();
    const body = await readJson<{ address?: string }>(request);
    if (!body.address) return jsonError("Wallet address is required.", 400);
    const address = getAddress(body.address).toLowerCase();
    const nonce = randomBytes(16).toString("hex");
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const prisma = getPrisma();
    await prisma.authNonce.create({ data: { address, nonce, expiresAt } });
    const message = buildSiweMessage({
      address,
      nonce,
      issuedAt,
      chainId: getPublicChainConfig().chainId,
    });
    return NextResponse.json({ nonce, issuedAt, message });
  } catch (error) {
    return handleRouteError(error);
  }
}
