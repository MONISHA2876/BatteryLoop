import { NextResponse } from "next/server";

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleRouteError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message === "UNAUTHENTICATED") return jsonError("Sign in with your wallet to continue.", 401);
  if (message === "FORBIDDEN") return jsonError("This action is limited to authorized application roles.", 403);
  if (message === "DATABASE_UNCONFIGURED") {
    return jsonError(
      "DATABASE_URL is not configured. Add it to .env.local and run Prisma migrations. See SETUP.md.",
      503,
      { code: "DATABASE_UNCONFIGURED" },
    );
  }
  if (/AUTH_SECRET/.test(message)) {
    return jsonError(message, 503, { code: "AUTH_UNCONFIGURED" });
  }
  if (/GEMINI_API_KEY/.test(message) || message === "GEMINI_UNCONFIGURED") {
    return jsonError(
      "GEMINI_API_KEY is not configured on the server. Add it to .env.local. The key must never use a NEXT_PUBLIC_ prefix.",
      503,
      { code: "GEMINI_UNCONFIGURED" },
    );
  }
  if (/Contract address/.test(message) || /NEXT_PUBLIC_/.test(message)) {
    return jsonError(message, 503, { code: "CONTRACTS_UNCONFIGURED" });
  }
  console.error(message);
  return jsonError(message, 400);
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body.");
  }
}
