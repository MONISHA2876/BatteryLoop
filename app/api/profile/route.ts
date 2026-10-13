import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, readJson } from "@/lib/api";
import { z } from "zod";

const schema = z.object({
  displayName: z.string().trim().max(80).optional().nullable(),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  location: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const user = await getPrisma().user.findUnique({ where: { address: session.address } });
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const parsed = schema.parse(await readJson(request));
    const user = await getPrisma().user.update({
      where: { address: session.address },
      data: {
        displayName: parsed.displayName,
        email: parsed.email || null,
        location: parsed.location,
        bio: parsed.bio,
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
