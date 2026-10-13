import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const scan = await getPrisma().pcbScan.findUnique({ where: { id } });
    if (!scan) return jsonError("File not found.", 404);
    if (scan.createdByAddress !== session.address && session.appRole !== "ADMIN") {
      return jsonError("Not authorized to view this file.", 403);
    }
    const data = await readFile(path.join(process.cwd(), scan.imagePath));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": scan.mimeType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
