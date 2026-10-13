export const LIFECYCLE_EVENT_TYPES = {
  0: {
    key: "collected",
    label: "Collected / intake",
    description: "Battery received or collected into the BatteryLoop record.",
  },
  1: {
    key: "inspection",
    label: "Inspection",
    description: "Visual or diagnostic inspection of the battery.",
  },
  2: {
    key: "ownership",
    label: "Ownership / custody transfer",
    description: "Custody or ownership moved between parties. Uses recordOwnership on-chain.",
  },
  3: {
    key: "maintenance",
    label: "Maintenance",
    description: "Service, repair, or maintenance performed.",
  },
  4: {
    key: "usage",
    label: "Usage checkpoint",
    description: "In-service usage or telemetry checkpoint.",
  },
  5: {
    key: "second_life_eval",
    label: "Second-life evaluation",
    description: "Assessment of suitability for a second-life application.",
  },
  6: {
    key: "second_life_deploy",
    label: "Second-life deployment",
    description: "Battery placed into a second-life use.",
  },
  7: {
    key: "recycle_collection",
    label: "Recycling collection",
    description: "Battery routed into a recycling stream.",
  },
  8: {
    key: "recycle_processing",
    label: "Recycling processing",
    description: "Recycler processing or dismantling in progress.",
  },
  9: {
    key: "material_recovery",
    label: "Material recovery",
    description: "Recovered materials or components documented.",
  },
  10: {
    key: "end_of_life",
    label: "End of life",
    description: "Final decommissioning or closed lifecycle.",
  },
} as const;

export type LifecycleEventType = keyof typeof LIFECYCLE_EVENT_TYPES;

export function isLifecycleEventType(value: number): value is LifecycleEventType {
  return Number.isInteger(value) && value >= 0 && value <= 10;
}

export function lifecycleLabel(eventType: number): string {
  if (!isLifecycleEventType(eventType)) return `Unknown (${eventType})`;
  return LIFECYCLE_EVENT_TYPES[eventType].label;
}
