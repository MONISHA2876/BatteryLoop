import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { requestSchema } from "@/lib/validation/battery";

export async function GET() {
  try {
    const session = await requireSession();
    const prisma = getPrisma();
    const [sent, received] = await Promise.all([
      prisma.marketplaceRequest.findMany({
        where: { buyerAddress: session.address },
        include: { listing: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.marketplaceRequest.findMany({
        where: { sellerAddress: session.address },
        include: { listing: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return NextResponse.json({ sent, received });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson<Record<string, unknown>>(request);
    const parsed = requestSchema.parse(body);
    const listing = await getPrisma().marketplaceListing.findUnique({ where: { id: parsed.listingId } });
    if (!listing || listing.status !== "OPEN") {
      return jsonError("Listing is not open for requests.", 400);
    }
    if (listing.sellerAddress === session.address) {
      return jsonError("You cannot request your own listing.", 400);
    }
    const record = await getPrisma().marketplaceRequest.create({
      data: {
        listingId: listing.id,
        buyerAddress: session.address,
        sellerAddress: listing.sellerAddress,
        message: parsed.message,
        status: "OPEN",
      },
    });
    return NextResponse.json({ request: record });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson<{ id?: string; status?: string }>(request);
    if (!body.id || !body.status) return jsonError("id and status are required.", 400);
    if (!["OPEN", "ACCEPTED", "DECLINED", "CANCELLED"].includes(body.status)) {
      return jsonError("Invalid request status. Off-chain requests are not marked paid.", 400);
    }
    const record = await getPrisma().marketplaceRequest.findUnique({ where: { id: body.id } });
    if (!record) return jsonError("Request not found.", 404);
    const canSeller = record.sellerAddress === session.address && ["ACCEPTED", "DECLINED"].includes(body.status);
    const canBuyer = record.buyerAddress === session.address && body.status === "CANCELLED";
    const canAdmin = session.appRole === "ADMIN";
    if (!canSeller && !canBuyer && !canAdmin) return jsonError("Not allowed to change this request.", 403);
    const updated = await getPrisma().marketplaceRequest.update({
      where: { id: body.id },
      data: { status: body.status },
    });
    return NextResponse.json({ request: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}
