import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { assertTransition, isTxStatus, type TxStatus } from "@/lib/tx-status";
import { hashesEqual } from "@/lib/blockchain/hashing";
import { readOnChainBattery } from "@/lib/blockchain/server";

type Ctx = { params: Promise<{ batteryId: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { batteryId } = await ctx.params;
    const body = await readJson<{
      status: string;
      txHash?: string;
    }>(request);
    if (!isTxStatus(body.status)) return jsonError("Invalid status.", 400);

    const prisma = getPrisma();
    const battery = await prisma.battery.findUnique({ where: { batteryId } });
    if (!battery) return jsonError("Battery not found.", 404);
    if (battery.createdByAddress !== session.address && session.appRole !== "ADMIN") {
      return jsonError("You cannot update this battery.", 403);
    }

    const next = body.status as TxStatus;
    assertTransition(battery.chainStatus as TxStatus, next);

    if (next === "PENDING") {
      if (!body.txHash || !/^0x[a-fA-F0-9]{64}$/.test(body.txHash)) {
        return jsonError("A transaction hash is required when marking PENDING.", 400);
      }
      const updated = await prisma.battery.update({
        where: { batteryId },
        data: { chainStatus: "PENDING", txHash: body.txHash.toLowerCase() },
      });
      return NextResponse.json({ battery: updated });
    }

    if (next === "CONFIRMED") {
      const onChain = await readOnChainBattery(batteryId);
      if (!onChain?.exists) {
        const updated = await prisma.battery.update({
          where: { batteryId },
          data: { chainStatus: "NEEDS_RECONCILIATION" },
        });
        return jsonError(
          "On-chain getBattery does not show this battery yet. Marked NEEDS_RECONCILIATION.",
          409,
          { battery: updated },
        );
      }
      const hashMatch = hashesEqual(onChain.metadataHash, battery.metadataHash);
      const updated = await prisma.battery.update({
        where: { batteryId },
        data: {
          chainStatus: "CONFIRMED",
          existsOnChain: true,
          onChainManufacturer: onChain.manufacturer.toLowerCase(),
          onChainMetadataHash: onChain.metadataHash,
          registeredAtChain: onChain.registeredAt,
          hashMatch,
          txHash: body.txHash ? body.txHash.toLowerCase() : battery.txHash,
        },
      });
      return NextResponse.json({ battery: updated, onChain, hashMatch });
    }

    const updated = await prisma.battery.update({
      where: { batteryId },
      data: { chainStatus: next },
    });
    return NextResponse.json({ battery: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
