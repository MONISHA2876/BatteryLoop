import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { isBatteryRecycled, readRewardsState } from "@/lib/blockchain/server";
import { z } from "zod";

const schema = z.object({
  batteryId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  consumerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  recoveredJson: z.string().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const where =
      session.appRole === "ADMIN"
        ? {}
        : {
            OR: [{ recyclerAddress: session.address }, { consumerAddress: session.address }],
          };
    const records = await getPrisma().recyclingRecord.findMany({
      where,
      include: { battery: true },
      orderBy: { createdAt: "desc" },
    });
    const rewards = await readRewardsState().catch(() => null);
    return NextResponse.json({ records, rewards });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (session.appRole !== "RECYCLER" && session.appRole !== "ADMIN") {
      return jsonError("Only recycler or admin application accounts can submit recycling jobs.", 403);
    }
    const parsed = schema.parse(await readJson(request));
    const battery = await getPrisma().battery.findUnique({ where: { batteryId: parsed.batteryId } });
    if (!battery) return jsonError("Battery not found.", 404);
    const already = await isBatteryRecycled(parsed.batteryId).catch(() => null);
    if (already) return jsonError("This battery is already marked recycled on-chain.", 409);
    const record = await getPrisma().recyclingRecord.create({
      data: {
        batteryId: parsed.batteryId.toLowerCase(),
        recyclerAddress: session.address,
        consumerAddress: parsed.consumerAddress ? parsed.consumerAddress.toLowerCase() : null,
        notes: parsed.notes,
        recoveredJson: parsed.recoveredJson || "[]",
        status: "SUBMITTED",
        chainStatus: "DRAFT",
      },
    });
    return NextResponse.json({ record });
  } catch (error) {
    return handleRouteError(error);
  }
}
