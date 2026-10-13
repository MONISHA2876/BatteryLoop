import { NextResponse } from "next/server";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { handleRouteError } from "@/lib/api";
import { estimateKg, IMPACT_ASSUMPTIONS } from "@/lib/impact";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        configured: false,
        error: "DATABASE_URL is not configured.",
      });
    }
    const prisma = getPrisma();
    const [
      batteries,
      confirmedPassports,
      lifecycle,
      confirmedLifecycle,
      secondLife,
      recyclingConfirmed,
      valuations,
      listings,
      scans,
    ] = await Promise.all([
      prisma.battery.count(),
      prisma.battery.count({ where: { chainStatus: "CONFIRMED" } }),
      prisma.lifecycleEvent.count(),
      prisma.lifecycleEvent.count({ where: { chainStatus: "CONFIRMED" } }),
      prisma.lifecycleEvent.count({ where: { eventType: 5 } }),
      prisma.recyclingRecord.count({ where: { chainStatus: "CONFIRMED" } }),
      prisma.valuation.count(),
      prisma.marketplaceListing.count({ where: { status: "OPEN" } }),
      prisma.pcbScan.count({ where: { status: "ANALYZED" } }),
    ]);

    return NextResponse.json({
      configured: true,
      offChain: {
        batteriesRegistered: batteries,
        lifecycleEvents: lifecycle,
        secondLifeEvaluations: secondLife,
        componentsValued: valuations,
        openListings: listings,
        pcbScans: scans,
      },
      onChainVerified: {
        passports: confirmedPassports,
        lifecycleEvents: confirmedLifecycle,
        recyclingVerified: recyclingConfirmed,
      },
      estimates: {
        divertedKg: estimateKg(recyclingConfirmed),
        assumptions: IMPACT_ASSUMPTIONS,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
