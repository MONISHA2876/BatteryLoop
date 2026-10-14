import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, readJson } from "@/lib/api";
import { deterministicValueUsd, valuationInputSchema } from "@/lib/validation/battery";
import { explainValuation, getGeminiModelName, isGeminiConfigured } from "@/lib/gemini/client";

async function resolveLinkedBatteryId(batteryId?: string | null) {
  if (!batteryId) return null;
  const normalized = batteryId.trim().toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(normalized)) return null;
  const battery = await getPrisma().battery.findUnique({
    where: { batteryId: normalized },
    select: { batteryId: true },
  });
  return battery ? normalized : null;
}

export async function GET() {
  try {
    const session = await requireSession();
    const valuations = await getPrisma().valuation.findMany({
      where: { createdByAddress: session.address },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ valuations });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson<Record<string, unknown>>(request);
    const parsed = valuationInputSchema.parse({
      ...body,
      quantity: Number(body.quantity),
      unitPriceUsd: body.unitPriceUsd === "" || body.unitPriceUsd === undefined ? null : Number(body.unitPriceUsd),
    });
    const linkedBatteryId = await resolveLinkedBatteryId(parsed.batteryId);
    const numeric = deterministicValueUsd(parsed);
    let ai = null;
    if (isGeminiConfigured()) {
      ai = await explainValuation({ ...parsed, ...numeric });
    }
    const record = await getPrisma().valuation.create({
      data: {
        batteryId: linkedBatteryId,
        pcbScanId: parsed.pcbScanId || null,
        inputJson: JSON.stringify(parsed),
        resultJson: JSON.stringify({ numeric, ai }),
        indicativeValueUsd: numeric.indicativeValueUsd,
        valueLabel: numeric.valueLabel,
        modelName: ai ? getGeminiModelName() : null,
        createdByAddress: session.address,
      },
    });
    return NextResponse.json({
      valuation: record,
      numeric,
      ai,
      geminiConfigured: isGeminiConfigured(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
