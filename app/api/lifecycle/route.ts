import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { buildCanonicalLifecyclePayload, lifecyclePayloadSchema } from "@/lib/validation/battery";

export async function GET(request: Request) {
  try {
    await requireSession();
    const url = new URL(request.url);
    const batteryId = url.searchParams.get("batteryId");
    const events = await getPrisma().lifecycleEvent.findMany({
      where: batteryId ? { batteryId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ events });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson<Record<string, unknown>>(request);
    const parsed = lifecyclePayloadSchema.parse({
      ...body,
      eventType: Number(body.eventType),
    });
    const battery = await getPrisma().battery.findUnique({ where: { batteryId: parsed.batteryId } });
    if (!battery) return jsonError("Battery not found. Register it off-chain first.", 404);
    const { canonical, canonicalJson, dataHash } = buildCanonicalLifecyclePayload(parsed);
    const event = await getPrisma().lifecycleEvent.create({
      data: {
        batteryId: canonical.batteryId,
        eventType: canonical.eventType,
        payloadJson: canonicalJson,
        dataHash,
        fromAddress: canonical.fromAddress,
        toAddress: canonical.toAddress,
        chainStatus: "DRAFT",
        createdByAddress: session.address,
      },
    });
    return NextResponse.json({ event, dataHash, useOwnership: canonical.eventType === 2 });
  } catch (error) {
    return handleRouteError(error);
  }
}
