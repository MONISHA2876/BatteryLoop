import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { listingSchema } from "@/lib/validation/battery";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const listing = await getPrisma().marketplaceListing.findUnique({
      where: { id },
      include: { requests: true, battery: true, valuation: true },
    });
    if (!listing) return jsonError("Listing not found.", 404);
    return NextResponse.json({ listing });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const listing = await getPrisma().marketplaceListing.findUnique({ where: { id } });
    if (!listing) return jsonError("Listing not found.", 404);
    if (listing.sellerAddress !== session.address && session.appRole !== "ADMIN") {
      return jsonError("You cannot edit this listing.", 403);
    }
    const body = await readJson<Record<string, unknown>>(request);
    const parsed = listingSchema.partial().parse({
      ...body,
      priceUsd: body.priceUsd === "" || body.priceUsd === undefined ? undefined : Number(body.priceUsd),
    });
    const updated = await getPrisma().marketplaceListing.update({
      where: { id },
      data: parsed,
    });
    return NextResponse.json({ listing: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
