import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasOnChainRole } from "@/lib/blockchain/server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null, chainRoles: null });
  const [registrar, recorder, verifier, passportAdmin, rewardsAdmin] = await Promise.all([
    hasOnChainRole("passport", "REGISTRAR_ROLE", session.address),
    hasOnChainRole("lifecycle", "RECORDER_ROLE", session.address),
    hasOnChainRole("rewards", "VERIFIER_ROLE", session.address),
    hasOnChainRole("passport", "DEFAULT_ADMIN_ROLE", session.address),
    hasOnChainRole("rewards", "DEFAULT_ADMIN_ROLE", session.address),
  ]);
  return NextResponse.json({
    user: session,
    chainRoles: {
      registrar,
      recorder,
      verifier,
      passportAdmin,
      rewardsAdmin,
    },
  });
}
