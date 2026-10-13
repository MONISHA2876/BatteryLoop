import { z } from "zod";
import { canonicalStringify, hashCanonicalPayload } from "@/lib/blockchain/hashing";

export const CAPACITY_UNITS = ["Wh", "kWh", "Ah", "mAh"] as const;
export const CHEMISTRIES = ["LFP", "NMC", "NCA", "LTO", "Lead-acid", "NiMH", "Other"] as const;
export const CONDITIONS = ["unknown", "new", "good", "fair", "poor", "damaged"] as const;

export const batteryMetadataSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  name: z.string().trim().min(2).max(120),
  model: z.string().trim().max(120).optional().nullable(),
  manufacturerName: z.string().trim().min(2).max(120),
  manufacturerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Manufacturer must be an address"),
  chemistry: z.enum(CHEMISTRIES),
  capacityValue: z.number().positive(),
  capacityUnit: z.enum(CAPACITY_UNITS),
  manufacturedAt: z.string().trim().max(32).optional().nullable(),
  serialNumber: z.string().trim().max(80).optional().nullable(),
  initialCondition: z.enum(CONDITIONS),
  specifications: z.record(z.string(), z.string()).optional().default({}),
});

export type BatteryMetadata = z.infer<typeof batteryMetadataSchema>;

export function buildCanonicalBatteryMetadata(input: BatteryMetadata) {
  const parsed = batteryMetadataSchema.parse(input);
  const canonical = {
    schemaVersion: 1 as const,
    name: parsed.name,
    model: parsed.model || null,
    manufacturerName: parsed.manufacturerName,
    manufacturerAddress: parsed.manufacturerAddress.toLowerCase(),
    chemistry: parsed.chemistry,
    capacityValue: parsed.capacityValue,
    capacityUnit: parsed.capacityUnit,
    manufacturedAt: parsed.manufacturedAt || null,
    serialNumber: parsed.serialNumber || null,
    initialCondition: parsed.initialCondition,
    specifications: parsed.specifications || {},
  };
  return {
    canonical,
    canonicalJson: canonicalStringify(canonical),
    metadataHash: hashCanonicalPayload(canonical),
  };
}

export const lifecyclePayloadSchema = z.object({
  batteryId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  eventType: z.number().int().min(0).max(10),
  notes: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  fromAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
  toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
  extra: z.record(z.string(), z.unknown()).optional().default({}),
});

export function buildCanonicalLifecyclePayload(input: z.infer<typeof lifecyclePayloadSchema>) {
  const parsed = lifecyclePayloadSchema.parse(input);
  const canonical = {
    schemaVersion: 1 as const,
    batteryId: parsed.batteryId.toLowerCase(),
    eventType: parsed.eventType,
    notes: parsed.notes || null,
    location: parsed.location || null,
    fromAddress: parsed.fromAddress ? parsed.fromAddress.toLowerCase() : null,
    toAddress: parsed.toAddress ? parsed.toAddress.toLowerCase() : null,
    extra: parsed.extra || {},
  };
  return {
    canonical,
    canonicalJson: canonicalStringify(canonical),
    dataHash: hashCanonicalPayload(canonical),
  };
}

export const healthInputSchema = z.object({
  batteryId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional().nullable(),
  chemistry: z.enum(CHEMISTRIES),
  ratedCapacity: z.number().positive().optional().nullable(),
  measuredCapacity: z.number().positive().optional().nullable(),
  capacityUnit: z.enum(CAPACITY_UNITS).optional().nullable(),
  voltageV: z.number().positive().optional().nullable(),
  cycleCount: z.number().int().nonnegative().optional().nullable(),
  temperatureC: z.number().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export function estimateSohPercent(input: z.infer<typeof healthInputSchema>): {
  sohEstimate: number | null;
  sohMethod: string;
} {
  if (
    input.ratedCapacity &&
    input.measuredCapacity &&
    input.ratedCapacity > 0 &&
    input.measuredCapacity > 0
  ) {
    const ratio = (input.measuredCapacity / input.ratedCapacity) * 100;
    return {
      sohEstimate: Math.max(0, Math.min(100, Math.round(ratio * 10) / 10)),
      sohMethod:
        "Estimate = (measured capacity / rated capacity) × 100. This is a transparent capacity-ratio estimate, not a certified State of Health test.",
    };
  }
  return {
    sohEstimate: null,
    sohMethod:
      "A numerical SoH estimate was not calculated because both rated and measured capacity were not provided.",
  };
}

export const valuationInputSchema = z.object({
  batteryId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional().nullable(),
  pcbScanId: z.string().optional().nullable(),
  category: z.string().trim().min(2).max(80),
  quantity: z.number().positive(),
  condition: z.enum(CONDITIONS),
  specifications: z.string().trim().max(1000).optional().nullable(),
  unitPriceUsd: z.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export function deterministicValueUsd(input: z.infer<typeof valuationInputSchema>): {
  indicativeValueUsd: number | null;
  valueLabel: string;
} {
  if (input.unitPriceUsd === undefined || input.unitPriceUsd === null) {
    return {
      indicativeValueUsd: null,
      valueLabel:
        "Value cannot be determined from a live market feed. Provide a unit price from a known source for a deterministic calculation.",
    };
  }
  const conditionFactor: Record<(typeof CONDITIONS)[number], number> = {
    new: 1,
    good: 0.85,
    fair: 0.6,
    poor: 0.35,
    damaged: 0.15,
    unknown: 0.5,
  };
  const value = input.quantity * input.unitPriceUsd * conditionFactor[input.condition];
  return {
    indicativeValueUsd: Math.round(value * 100) / 100,
    valueLabel:
      "Deterministic estimate = quantity × provided unit price × condition factor. Gemini does not supply live prices.",
  };
}

export const listingSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(4000),
  category: z.string().trim().min(2).max(80),
  condition: z.enum(CONDITIONS),
  priceUsd: z.number().nonnegative().optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  batteryId: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional().nullable(),
  valuationId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "OPEN"]).default("OPEN"),
});

export const requestSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().trim().min(4).max(2000),
});
