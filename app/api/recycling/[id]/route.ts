import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = await readJson<{
      status?: string;
      recoveredJson?: string;
      notes?: string;
      chainStatus?: string;
      txHash?: string;
      recyclerAmountWei?: string;
      consumerAmountWei?: string;
    }>(request);
    const record = await getPrisma().recyclingRecord.findUnique({ where: { id } });
    if (!record) return jsonError("Record not found.", 404);
    const allowed =
      session.appRole === "ADMIN" ||
      record.recyclerAddress === session.address ||
      Boolean(body.txHash);
    if (!allowed) return jsonError("Not allowed to update this recycling record.", 403);
    const updated = await getPrisma().recyclingRecord.update({
      where: { id },
      data: {
        status: body.status,
        recoveredJson: body.recoveredJson,
        notes: body.notes,
        chainStatus: body.chainStatus,
        txHash: body.txHash?.toLowerCase(),
        recyclerAmountWei: body.recyclerAmountWei,
        consumerAmountWei: body.consumerAmountWei,
      },
    });
    return NextResponse.json({ record: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
