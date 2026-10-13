import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError } from "@/lib/api";
import { analyzePcbImage, getGeminiModelName, isGeminiConfigured } from "@/lib/gemini/client";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    if (!isGeminiConfigured()) throw new Error("GEMINI_UNCONFIGURED");
    const { id } = await ctx.params;
    const scan = await getPrisma().pcbScan.findUnique({ where: { id } });
    if (!scan) return jsonError("Scan not found.", 404);
    if (scan.createdByAddress !== session.address && session.appRole !== "ADMIN") {
      return jsonError("You cannot retry this scan.", 403);
    }
    const buffer = await readFile(path.join(process.cwd(), scan.imagePath));
    const result = await analyzePcbImage({
      mimeType: scan.mimeType,
      data: buffer.toString("base64"),
    });
    const updated = await getPrisma().pcbScan.update({
      where: { id },
      data: {
        status: "ANALYZED",
        resultJson: JSON.stringify(result),
        summary: result.summary,
        modelName: getGeminiModelName(),
        errorMessage: null,
      },
    });
    return NextResponse.json({ scan: updated, result });
  } catch (error) {
    return handleRouteError(error);
  }
}
