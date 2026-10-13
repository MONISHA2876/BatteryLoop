import { describe, expect, it } from "vitest";
import { canonicalStringify, hashCanonicalPayload, hashesEqual, shortBatteryLabel } from "./hashing";

describe("canonical hashing", () => {
  it("sorts object keys stably", () => {
    expect(canonicalStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("produces the same keccak hash regardless of key order", () => {
    const a = hashCanonicalPayload({ name: "LFP", capacityValue: 10, capacityUnit: "kWh" });
    const b = hashCanonicalPayload({ capacityUnit: "kWh", capacityValue: 10, name: "LFP" });
    expect(a).toBe(b);
    expect(a.startsWith("0x")).toBe(true);
    expect(a).toHaveLength(66);
  });

  it("changes hash when data changes", () => {
    const a = hashCanonicalPayload({ name: "A" });
    const b = hashCanonicalPayload({ name: "B" });
    expect(hashesEqual(a, b)).toBe(false);
  });

  it("formats a short battery label", () => {
    expect(shortBatteryLabel("0xabcdef0123456789")).toBe("BL-ABCDEF01");
  });
});
