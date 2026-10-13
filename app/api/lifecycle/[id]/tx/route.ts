import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { assertTransition, isTxStatus, type TxStatus } from "@/lib/tx-status";
import { hashesEqual } from "@/lib/blockchain/hashing";
import { readLifecycleEvent, readLifecycleEventCount } from "@/lib/blockchain/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = await readJson<{ status: string; txHash?: string }>(request);
    if (!isTxStatus(body.status)) return jsonError("Invalid status.", 400);
    const prisma = getPrisma();
    const event = await prisma.lifecycleEvent.findUnique({ where: { id } });
    if (!event) return jsonError("Event not found.", 404);
    if (event.createdByAddress !== session.address && session.appRole !== "ADMIN") {
      return jsonError("You cannot update this event.", 403);
    }
    const next = body.status as TxStatus;
    assertTransition(event.chainStatus as TxStatus, next);

    if (next === "PENDING") {
      if (!body.txHash || !/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) {
        return jsonError("A transaction hash is required when marking PENDING.", 400);
      }
      const updated = await prisma.lifecycleEvent.update({
        where: { id },
        data: { chainStatus: "PENDING", txHash: body.txHash.toLowerCase() },
      });
      return NextResponse.json({ event: updated });
    }

    if (next === "CONFIRMED") {
      const count = await readLifecycleEventCount(event.batteryId);
      if (count === null || count < 1) {
        const updated = await prisma.lifecycleEvent.update({
          where: { id },
          data: { chainStatus: "NEEDS_RECONCILIATION" },
        });
        return jsonError("No on-chain lifecycle events found yet.", 409, { event: updated });
      }
      let match: Awaited<ReturnType<typeof readLifecycleEvent>> | null = null;
      for (let i = count - 1; i >= 0; i -= 1) {
        const onChain = await readLifecycleEvent(event.batteryId, i);
        if (hashesEqual(onChain.dataHash, event.dataHash)) {
          match = onChain;
          break;
        }
      }
      if (!match) {
        const updated = await prisma.lifecycleEvent.update({
          where: { id },
          data: { chainStatus: "NEEDS_RECONCILIATION", txHash: body.txHash || event.txHash },
        });
        return jsonError("Could not match the payload hash on-chain.", 409, { event: updated });
      }
      const updated = await prisma.lifecycleEvent.update({
        where: { id },
        data: {
          chainStatus: "CONFIRMED",
          txHash: body.txHash ? body.txHash.toLowerCase() : event.txHash,
          onChainIndex: Number((await readLifecycleEventCount(event.batteryId)) ?? 0) - 1,
          onChainTimestamp: match.timestamp,
          onChainActor: match.actor.toLowerCase(),
          hashMatch: true,
        },
      });
      return NextResponse.json({ event: updated, onChain: match });
    }

    const updated = await prisma.lifecycleEvent.update({
      where: { id },
      data: { chainStatus: next },
    });
    return NextResponse.json({ event: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
