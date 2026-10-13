import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError } from "@/lib/api";
import { analyzePcbImage, getGeminiModelName, isGeminiConfigured } from "@/lib/gemini/client";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function GET() {
  try {
    const session = await requireSession();
    const scans = await getPrisma().pcbScan.findMany({
      where: { createdByAddress: session.address },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ scans });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("An image file is required.", 400);
    if (!ALLOWED.has(file.type)) return jsonError("Only JPEG, PNG, and WebP images are allowed.", 400);
    if (file.size > MAX_BYTES) return jsonError("Image must be 8 MB or smaller.", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), "storage", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}${path.extname(file.name) || ".img"}`;
    const imagePath = path.join("storage", "uploads", filename);
    await writeFile(path.join(process.cwd(), imagePath), buffer);

    const scan = await getPrisma().pcbScan.create({
      data: {
        imagePath,
        mimeType: file.type,
        originalName: file.name.slice(0, 180),
        status: "UPLOADED",
        createdByAddress: session.address,
      },
    });

    if (!isGeminiConfigured()) {
      await getPrisma().pcbScan.update({
        where: { id: scan.id },
        data: {
          status: "NEEDS_CONFIG",
          errorMessage:
            "Image stored. GEMINI_API_KEY is not configured, so analysis did not run.",
        },
      });
      return jsonError("Image stored, but GEMINI_API_KEY is not configured.", 503, { scanId: scan.id });
    }

    try {
      const result = await analyzePcbImage({
        mimeType: file.type,
        data: buffer.toString("base64"),
      });
      const updated = await getPrisma().pcbScan.update({
        where: { id: scan.id },
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
      const message = error instanceof Error ? error.message : "Analysis failed.";
      const updated = await getPrisma().pcbScan.update({
        where: { id: scan.id },
        data: { status: "FAILED", errorMessage: message },
      });
      return jsonError(message, 502, { scan: updated });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
