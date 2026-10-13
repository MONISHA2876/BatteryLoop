import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/api";

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireSession();
    const { name } = await ctx.params;
    if (!/^[a-f0-9]+\.(jpg|jpeg|png|webp)$/i.test(name)) {
      return jsonError("Invalid file name.", 400);
    }
    const file = await readFile(path.join(process.cwd(), "storage", "uploads", name));
    const ext = name.split(".").pop()?.toLowerCase();
    const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(file, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return jsonError("File not found.", 404);
  }
}
