import { id } from "ethers";

export const ROLE_IDS = {
  DEFAULT_ADMIN_ROLE:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  MANUFACTURER_ROLE: id("MANUFACTURER_ROLE"),
  REGISTRAR_ROLE: id("REGISTRAR_ROLE"),
  RECORDER_ROLE: id("RECORDER_ROLE"),
  VERIFIER_ROLE: id("VERIFIER_ROLE"),
} as const;

export const ROLE_GUIDE = [
  {
    contract: "BatteryPassport",
    roleName: "DEFAULT_ADMIN_ROLE",
    roleId: ROLE_IDS.DEFAULT_ADMIN_ROLE,
    who: "Contract administrator set in the constructor",
    why: "Can grant and revoke registrar and manufacturer roles",
  },
  {
    contract: "BatteryPassport",
    roleName: "REGISTRAR_ROLE",
    roleId: ROLE_IDS.REGISTRAR_ROLE,
    who: "Accounts that register batteries",
    why: "Required to call registerBattery",
  },
  {
    contract: "BatteryPassport",
    roleName: "MANUFACTURER_ROLE",
    roleId: ROLE_IDS.MANUFACTURER_ROLE,
    who: "Optional manufacturer classification",
    why: "Present on the contract; registration still requires REGISTRAR_ROLE",
  },
  {
    contract: "BatteryLifecycle",
    roleName: "RECORDER_ROLE",
    roleId: ROLE_IDS.RECORDER_ROLE,
    who: "Accounts that write lifecycle proofs",
    why: "Required to call recordEvent and recordOwnership",
  },
  {
    contract: "CircularityRewards",
    roleName: "VERIFIER_ROLE",
    roleId: ROLE_IDS.VERIFIER_ROLE,
    who: "Accounts that confirm recycling",
    why: "Required to call verifyRecycling, which pays recycler and consumer",
  },
  {
    contract: "CircularityRewards",
    roleName: "DEFAULT_ADMIN_ROLE",
    roleId: ROLE_IDS.DEFAULT_ADMIN_ROLE,
    who: "Rewards administrator",
    why: "Required to call setRewards",
  },
] as const;
