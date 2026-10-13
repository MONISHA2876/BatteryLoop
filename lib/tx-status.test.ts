import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isOnChainVerified } from "./tx-status";

describe("transaction status model", () => {
  it("allows draft to pending to confirmed", () => {
    expect(canTransition("DRAFT", "PENDING")).toBe(true);
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(isOnChainVerified("CONFIRMED")).toBe(true);
  });

  it("rejects marking confirmed from draft", () => {
    expect(canTransition("DRAFT", "CONFIRMED")).toBe(false);
    expect(() => assertTransition("DRAFT", "CONFIRMED")).toThrow();
  });

  it("does not treat pending as verified", () => {
    expect(isOnChainVerified("PENDING")).toBe(false);
    expect(isOnChainVerified("DRAFT")).toBe(false);
  });
});
