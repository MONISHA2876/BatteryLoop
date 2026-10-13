import { NextResponse } from "next/server";
import { getAddress } from "ethers";
import { getPrisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { handleRouteError, jsonError, readJson } from "@/lib/api";
import { batteryMetadataSchema, buildCanonicalBatteryMetadata } from "@/lib/validation/battery";
import { generateBatteryId } from "@/lib/blockchain/hashing";
import { readOnChainBattery } from "@/lib/blockchain/server";

export async function GET() {
  try {
    const session = await requireSession();
    const batteries = await getPrisma().battery.findMany({
      where: { createdByAddress: session.address },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ batteries });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson<Record<string, unknown>>(request);
    const parsed = batteryMetadataSchema.parse({
      ...body,
      capacityValue: Number(body.capacityValue),
      manufacturerAddress: getAddress(String(body.manufacturerAddress)),
    });
    const { canonical, canonicalJson, metadataHash } = buildCanonicalBatteryMetadata(parsed);
    const batteryId = generateBatteryId({
      manufacturer: canonical.manufacturerAddress,
      serial: canonical.serialNumber || undefined,
    });

    const existingOnChain = await readOnChainBattery(batteryId).catch(() => null);
    if (existingOnChain?.exists) {
      return jsonError("Generated battery ID already exists on-chain. Retry registration.", 409);
    }

    const battery = await getPrisma().battery.create({
      data: {
        batteryId,
        name: canonical.name,
        model: canonical.model,
        manufacturerName: canonical.manufacturerName,
        manufacturerAddress: canonical.manufacturerAddress,
        chemistry: canonical.chemistry,
        capacityValue: canonical.capacityValue,
        capacityUnit: canonical.capacityUnit,
        manufacturedAt: canonical.manufacturedAt,
        serialNumber: canonical.serialNumber,
        initialCondition: canonical.initialCondition,
        specificationsJson: JSON.stringify(canonical.specifications),
        canonicalMetadata: canonicalJson,
        metadataHash,
        chainStatus: "DRAFT",
        createdByAddress: session.address,
      },
    });
    return NextResponse.json({ battery, metadataHash, batteryId });
  } catch (error) {
    return handleRouteError(error);
  }
}
