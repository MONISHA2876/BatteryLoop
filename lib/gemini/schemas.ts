import { z } from "zod";

export const healthAiSchema = z.object({
  summary: z.string(),
  observedIndicators: z.array(z.string()),
  possibleRisks: z.array(z.string()),
  missingInformation: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
  limitations: z.string(),
});

export const pcbDetectionSchema = z.object({
  summary: z.string(),
  detections: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      conditionEstimate: z.string().optional().default("unknown"),
      confidence: z.enum(["low", "medium", "high"]),
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
