import { describe, expect, it } from "vitest";
import { healthAiSchema } from "@/lib/gemini/schemas";
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
      specifications: {},
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
      specifications: {},
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

describe("gemini response normalization", () => {
  it("accepts case and wording variants for confidence", () => {
    const result = healthAiSchema.parse({
      summary: "Battery is within normal range.",
      observedIndicators: ["Capacity is stable."],
      possibleRisks: [],
      missingInformation: ["No full cycle data."],
      suggestedNextSteps: ["Run a full diagnostic."],
      confidence: "High",
      limitations: "This is not a certified safety test.",
    });

    expect(result.confidence).toBe("high");
  });
});
