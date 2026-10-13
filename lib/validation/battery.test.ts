import { describe, expect, it } from "vitest";
import {
  buildCanonicalBatteryMetadata,
  deterministicValueUsd,
  estimateSohPercent,
} from "./battery";

describe("battery metadata", () => {
  it("hashes normalized manufacturer addresses", () => {
    const a = buildCanonicalBatteryMetadata({
      schemaVersion: 1,
      name: "Pack",
      manufacturerName: "Acme",
      manufacturerAddress: "0x1111111111111111111111111111111111111111",
      chemistry: "LFP",
      capacityValue: 12,
      capacityUnit: "kWh",
      initialCondition: "good",
    });
    const b = buildCanonicalBatteryMetadata({
      schemaVersion: 1,
      name: "Pack",
      manufacturerName: "Acme",
      manufacturerAddress: "0x1111111111111111111111111111111111111111",
      chemistry: "LFP",
      capacityValue: 12,
      capacityUnit: "kWh",
      initialCondition: "good",
    });
    expect(a.metadataHash).toBe(b.metadataHash);
  });
});

describe("soh estimate", () => {
  it("uses measured over rated capacity", () => {
    const result = estimateSohPercent({
      chemistry: "LFP",
      ratedCapacity: 100,
      measuredCapacity: 82,
    });
    expect(result.sohEstimate).toBe(82);
  });

  it("does not invent soh without measurements", () => {
    const result = estimateSohPercent({ chemistry: "LFP" });
    expect(result.sohEstimate).toBeNull();
  });
});

describe("valuation", () => {
  it("requires a provided unit price", () => {
    const result = deterministicValueUsd({
      category: "PCB",
      quantity: 2,
      condition: "good",
      unitPriceUsd: null,
    });
    expect(result.indicativeValueUsd).toBeNull();
  });

  it("applies condition factor", () => {
    const result = deterministicValueUsd({
      category: "PCB",
      quantity: 2,
      condition: "good",
      unitPriceUsd: 10,
    });
    expect(result.indicativeValueUsd).toBe(17);
  });
});
