import { NextResponse } from "next/server";
import { getAddress, verifyMessage } from "ethers";
import { getPrisma } from "@/lib/db";
import {
  SESSION_COOKIE,
  assertDatabase,
  createSessionToken,
  isAuthConfigured,
  upsertUserFromAddress,
} from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";

export async function POST(request: Request) {
  try {
    if (!isAuthConfigured()) {
      throw new Error("AUTH_SECRET is missing or too short. Set it in .env.local.");
    }
    assertDatabase();
    const body = await readJson<{ address?: string; message?: string; signature?: string }>(request);
    if (!body.address || !body.message || !body.signature) {
      return jsonError("address, message, and signature are required.", 400);
    }
    const address = getAddress(body.address).toLowerCase();
    const recovered = verifyMessage(body.message, body.signature);
    if (recovered.toLowerCase() !== address) {
      return jsonError("Signature does not match the connected wallet.", 401);
    }
    const nonceMatch = body.message.match(/Nonce:\s+([a-f0-9]+)/i);
    if (!nonceMatch) return jsonError("Signed message is missing a nonce.", 400);
    const prisma = getPrisma();
    const record = await prisma.authNonce.findUnique({ where: { nonce: nonceMatch[1] } });
    if (!record || record.address !== address) {
      return jsonError("Unknown or mismatched nonce.", 401);
    }
    if (record.expiresAt.getTime() < Date.now()) {
      await prisma.authNonce.delete({ where: { id: record.id } });
      return jsonError("Nonce expired. Request a new sign-in message.", 401);
    }
    await prisma.authNonce.delete({ where: { id: record.id } });
    const user = await upsertUserFromAddress(address);
    const token = await createSessionToken({
      address: user.address,
      appRole: user.appRole as "USER" | "RECYCLER" | "ADMIN",
      displayName: user.displayName,
    });
    const response = NextResponse.json({
      user: {
        address: user.address,
        appRole: user.appRole,
        displayName: user.displayName,
      },
    });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
