import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, readJson } from "@/lib/api";
import { estimateSohPercent, healthInputSchema } from "@/lib/validation/battery";
import { assessBatteryHealth, getGeminiModelName, isGeminiConfigured } from "@/lib/gemini/client";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!isGeminiConfigured()) throw new Error("GEMINI_UNCONFIGURED");
    const body = await readJson<Record<string, unknown>>(request);
    const parsed = healthInputSchema.parse({
      ...body,
      ratedCapacity: body.ratedCapacity ? Number(body.ratedCapacity) : null,
      measuredCapacity: body.measuredCapacity ? Number(body.measuredCapacity) : null,
      voltageV: body.voltageV ? Number(body.voltageV) : null,
      cycleCount: body.cycleCount ? Number(body.cycleCount) : null,
      temperatureC: body.temperatureC === "" || body.temperatureC === undefined ? null : Number(body.temperatureC),
    });
    const soh = estimateSohPercent(parsed);
    const ai = await assessBatteryHealth({ ...parsed, ...soh });
    const record = await getPrisma().healthAssessment.create({
      data: {
        batteryId: parsed.batteryId || null,
        inputJson: JSON.stringify(parsed),
        resultJson: JSON.stringify({ ai, soh }),
        sohEstimate: soh.sohEstimate,
        sohMethod: soh.sohMethod,
        modelName: getGeminiModelName(),
        createdByAddress: session.address,
      },
    });
    return NextResponse.json({ assessment: record, ai, soh });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    const assessments = await getPrisma().healthAssessment.findMany({
      where: { createdByAddress: session.address },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ assessments });
  } catch (error) {
    return handleRouteError(error);
  }
}
