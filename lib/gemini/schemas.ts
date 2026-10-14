import { z } from "zod";

const normalizeConfidence = (value: unknown) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === "moderate") return "medium";
  return normalized;
};

const confidenceSchema = z.preprocess(normalizeConfidence, z.enum(["low", "medium", "high"]));

export const healthAiSchema = z.object({
  summary: z.string(),
  observedIndicators: z.array(z.string()),
  possibleRisks: z.array(z.string()),
  missingInformation: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
  confidence: confidenceSchema,
  limitations: z.string(),
});

export const pcbDetectionSchema = z.object({
  summary: z.string(),
  detections: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      conditionEstimate: z.string().optional().default("unknown"),
      confidence: confidenceSchema,
      uncertainty: z.string(),
    }),
  ),
  limitations: z.string(),
});

export const valuationAiSchema = z.object({
  classification: z.string(),
  explanation: z.string(),
  caveats: z.array(z.string()),
});

export type HealthAiResult = z.infer<typeof healthAiSchema>;
export type PcbAiResult = z.infer<typeof pcbDetectionSchema>;
export type ValuationAiResult = z.infer<typeof valuationAiSchema>;
