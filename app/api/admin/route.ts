import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireAppRole } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { APP_ROLES, type AppRole } from "@/lib/auth/session";
import { getContractAddresses, getPublicChainConfig } from "@/lib/blockchain/config";
import { isGeminiConfigured } from "@/lib/gemini/client";
import { isAuthConfigured } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db";

export async function GET() {
  try {
    await requireAppRole(["ADMIN"]);
    const prisma = getPrisma();
    const [users, batteries, recycling, listings, requests] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.battery.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.recyclingRecord.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.marketplaceListing.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.marketplaceRequest.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);
    return NextResponse.json({
      users,
      batteries,
      recycling,
      listings,
      requests,
      config: {
        chain: getPublicChainConfig(),
        contracts: getContractAddresses(),
        gemini: isGeminiConfigured(),
        auth: isAuthConfigured(),
        database: isDatabaseConfigured(),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAppRole(["ADMIN"]);
    const body = await readJson<{ address?: string; appRole?: string }>(request);
    if (!body.address || !body.appRole) return jsonError("address and appRole are required.", 400);
    if (!APP_ROLES.includes(body.appRole as AppRole)) return jsonError("Invalid application role.", 400);
    const user = await getPrisma().user.update({
      where: { address: body.address.toLowerCase() },
      data: { appRole: body.appRole },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
