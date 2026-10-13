import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from "@google/generative-ai";
import { healthAiSchema, pcbDetectionSchema, valuationAiSchema } from "@/lib/gemini/schemas";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

function getClient() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_UNCONFIGURED");
  }
  return new GoogleGenerativeAI(key);
}

function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const payload = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(payload);
  } catch {
    throw new Error("The model returned a response that was not valid JSON.");
  }
}

const healthSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    observedIndicators: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    possibleRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    missingInformation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    suggestedNextSteps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    confidence: { type: SchemaType.STRING },
    limitations: { type: SchemaType.STRING },
  },
  required: [
    "summary",
    "observedIndicators",
    "possibleRisks",
    "missingInformation",
    "suggestedNextSteps",
    "confidence",
    "limitations",
  ],
};

const pcbSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    detections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          conditionEstimate: { type: SchemaType.STRING },
          confidence: { type: SchemaType.STRING },
          uncertainty: { type: SchemaType.STRING },
        },
        required: ["name", "description", "confidence", "uncertainty"],
      },
    },
    limitations: { type: SchemaType.STRING },
  },
  required: ["summary", "detections", "limitations"],
};

const valuationSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    classification: { type: SchemaType.STRING },
    explanation: { type: SchemaType.STRING },
    caveats: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ["classification", "explanation", "caveats"],
};

async function generateStructured(options: {
  prompt: string;
  schema: ResponseSchema;
  image?: { mimeType: string; data: string };
}) {
  const model = getClient().getGenerativeModel({
    model: getGeminiModelName(),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: options.schema,
    },
  });

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: options.prompt },
  ];
  if (options.image) {
    parts.unshift({ inlineData: options.image });
  }

  const result = await Promise.race([
    model.generateContent(parts),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("The Gemini request timed out.")), 45_000);
    }),
  ]);

  const text = result.response.text();
  return parseModelJson(text);
}

export async function assessBatteryHealth(input: unknown) {
  const json = await generateStructured({
    schema: healthSchema,
    prompt: `You are assisting BatteryLoop with a structured battery health assessment.
Do not invent lab-certified State of Health. If quantitative data is missing, say so.
Do not claim electrical safety certification.
Return JSON only.

Input JSON:
${JSON.stringify(input)}`,
  });
  return healthAiSchema.parse(json);
}

export async function analyzePcbImage(image: { mimeType: string; data: string }) {
  const json = await generateStructured({
    schema: pcbSchema,
    image,
    prompt: `Analyze this PCB or e-waste photo for visually identifiable components.
This is visual identification only. Do not claim exact material composition, electrical function, or monetary value.
If uncertain, use low confidence and explain uncertainty.
Return JSON only.`,
  });
  return pcbDetectionSchema.parse(json);
}

export async function explainValuation(input: unknown) {
  const json = await generateStructured({
    schema: valuationSchema,
    prompt: `Explain a component valuation using only the supplied inputs.
Do not invent live market prices. If no unit price was provided, say the value cannot be determined reliably.
Return JSON only.

Input JSON:
${JSON.stringify(input)}`,
  });
  return valuationAiSchema.parse(json);
}

export { getClient };
