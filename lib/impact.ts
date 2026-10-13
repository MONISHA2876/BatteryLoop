/**
 * Estimated environmental metrics are labelled as estimates.
 * Assumptions (documented, not measured lab values):
 * - Average traction/pack-equivalent mass proxy: 12 kg per registered battery record
 *   when actual mass is unknown.
 * - Diversion estimate only counts recycling records with CONFIRMED on-chain
 *   verification, using 12 kg per verified battery.
 */
export const IMPACT_ASSUMPTIONS = {
  kgPerBatteryProxy: 12,
  note: "Waste-diversion kilograms are estimates using a 12 kg per battery proxy when mass is unknown. They are not measured environmental inventories.",
};

export function estimateKg(count: number): number {
  return count * IMPACT_ASSUMPTIONS.kgPerBatteryProxy;
}
