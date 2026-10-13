import { keccak256, toUtf8Bytes, hexlify, randomBytes } from "ethers";

export function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, sortValue(v)]);
    return Object.fromEntries(entries);
  }
  return value;
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function hashCanonicalPayload(value: unknown): `0x${string}` {
  return keccak256(toUtf8Bytes(canonicalStringify(value))) as `0x${string}`;
}

export function generateBatteryId(parts: {
  serial?: string;
  manufacturer: string;
  entropy?: string;
}): `0x${string}` {
  const entropy = parts.entropy ?? hexlify(randomBytes(16));
  return hashCanonicalPayload({
    kind: "batteryloop.battery-id.v1",
    manufacturer: parts.manufacturer.trim().toLowerCase(),
    serial: parts.serial?.trim() || null,
    entropy,
    at: Date.now(),
  });
}

export function shortBatteryLabel(batteryId: string): string {
  const hex = batteryId.replace(/^0x/i, "").slice(0, 8).toUpperCase();
  return `BL-${hex}`;
}

export function normalizeBytes32(value: string): `0x${string}` {
  const v = value.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(v)) {
    throw new Error("Expected a 32-byte hex string (bytes32).");
  }
  return v.toLowerCase() as `0x${string}`;
}

export function hashesEqual(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
