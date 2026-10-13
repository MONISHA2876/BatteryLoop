import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { getSession, requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { listingSchema } from "@/lib/validation/battery";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category") || undefined;
    const condition = url.searchParams.get("condition") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const location = url.searchParams.get("location") || undefined;
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const session = await getSession();

    const listings = await getPrisma().marketplaceListing.findMany({
      where: {
        AND: [
          session?.appRole === "ADMIN"
            ? {}
            : { OR: [{ status: "OPEN" }, { sellerAddress: session?.address || "__none__" }] },
          category ? { category } : {},
          condition ? { condition } : {},
          location ? { location: { contains: location } } : {},
          q
            ? {
                OR: [
                  { title: { contains: q } },
                  { description: { contains: q } },
                  { category: { contains: q } },
                ],
              }
            : {},
          minPrice ? { priceUsd: { gte: Number(minPrice) } } : {},
          maxPrice ? { priceUsd: { lte: Number(maxPrice) } } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ listings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson<Record<string, unknown>>(request);
    const parsed = listingSchema.parse({
      ...body,
      priceUsd: body.priceUsd === "" || body.priceUsd === undefined ? null : Number(body.priceUsd),
    });
    if (parsed.batteryId) {
      const battery = await getPrisma().battery.findUnique({ where: { batteryId: parsed.batteryId } });
      if (!battery) return jsonError("Linked battery was not found.", 400);
    }
    const listing = await getPrisma().marketplaceListing.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        condition: parsed.condition,
        priceUsd: parsed.priceUsd,
        location: parsed.location,
        batteryId: parsed.batteryId || null,
        valuationId: parsed.valuationId || null,
        status: parsed.status,
        sellerAddress: session.address,
      },
    });
    return NextResponse.json({ listing });
  } catch (error) {
    return handleRouteError(error);
  }
}
