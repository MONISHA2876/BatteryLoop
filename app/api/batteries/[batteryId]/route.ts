import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { handleRouteError, jsonError } from "@/lib/api";
import { hashCanonicalPayload, hashesEqual } from "@/lib/blockchain/hashing";
import { readLifecycleEvent, readLifecycleEventCount, readOnChainBattery } from "@/lib/blockchain/server";
import { passportQrDataUrl } from "@/lib/qr";

type Ctx = { params: Promise<{ batteryId: string }> };

export async function GET(request: Request, ctx: Ctx) {
  try {
    const { batteryId } = await ctx.params;
    const prisma = getPrisma();
    const battery = await prisma.battery.findUnique({
      where: { batteryId },
      include: {
        lifecycle: { orderBy: { createdAt: "asc" } },
        assessments: { orderBy: { createdAt: "desc" }, take: 8 },
        recycling: true,
      },
    });
    if (!battery) return jsonError("Battery not found.", 404);

    const onChain = await readOnChainBattery(batteryId).catch(() => null);
    const recomputed = hashCanonicalPayload(JSON.parse(battery.canonicalMetadata));
    const hashMatch = onChain?.exists
      ? hashesEqual(onChain.metadataHash, recomputed)
      : hashesEqual(battery.metadataHash, recomputed);

    const origin = new URL(request.url).origin;
    const qr = await passportQrDataUrl(`${origin}/passport/${batteryId}`);

    let onChainEvents: Awaited<ReturnType<typeof readLifecycleEvent>>[] = [];
    const count = await readLifecycleEventCount(batteryId).catch(() => null);
    if (count && count > 0) {
      const indexes = Array.from({ length: Math.min(count, 50) }, (_, i) => i);
      onChainEvents = await Promise.all(indexes.map((i) => readLifecycleEvent(batteryId, i)));
    }

    return NextResponse.json({
      battery: {
        ...battery,
        hashMatch,
        existsOnChain: Boolean(onChain?.exists),
        onChain,
      },
      qr,
      publicUrl: `${origin}/passport/${batteryId}`,
      onChainEvents,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
