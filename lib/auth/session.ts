import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export const SESSION_COOKIE = "batteryloop_session";
export const APP_ROLES = ["USER", "RECYCLER", "ADMIN"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type SessionUser = {
  address: string;
  appRole: AppRole;
  displayName: string | null;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a random 32+ character secret in .env.local.",
    );
  }
  return new TextEncoder().encode(secret);
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim().length >= 16);
}

function bootstrapRole(address: string): AppRole {
  const admins = (process.env.APP_ADMIN_WALLETS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(address.toLowerCase())) return "ADMIN";
  const recyclers = (process.env.APP_RECYCLER_WALLETS || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (recyclers.includes(address.toLowerCase())) return "RECYCLER";
  return "USER";
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    address: user.address,
    appRole: user.appRole,
    displayName: user.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const address = String(payload.address || "");
    const appRole = String(payload.appRole || "USER");
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
    if (!APP_ROLES.includes(appRole as AppRole)) return null;
    return {
      address: address.toLowerCase(),
      appRole: appRole as AppRole,
      displayName: payload.displayName ? String(payload.displayName) : null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  if (!isAuthConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requireAppRole(roles: AppRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.appRole)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function upsertUserFromAddress(address: string) {
  const prisma = getPrisma();
  const normalized = address.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { address: normalized } });
  if (existing) {
    const boot = bootstrapRole(normalized);
    if (boot !== "USER" && existing.appRole === "USER") {
      return prisma.user.update({
        where: { address: normalized },
        data: { appRole: boot },
      });
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      address: normalized,
      appRole: bootstrapRole(normalized),
    },
  });
}

export function assertDatabase(): void {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_UNCONFIGURED");
  }
}
