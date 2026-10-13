export const ACCESS_CONTROL_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function getRoleAdmin(bytes32 role) view returns (bytes32)",
  "function grantRole(bytes32 role, address account)",
] as const;

export const BATTERY_PASSPORT_ABI = [
  ...ACCESS_CONTROL_ABI,
  "function MANUFACTURER_ROLE() view returns (bytes32)",
  "function REGISTRAR_ROLE() view returns (bytes32)",
  "function registerBattery(bytes32 batteryId, bytes32 metadataHash, address manufacturer)",
  "function getBattery(bytes32 batteryId) view returns (bytes32, bytes32, address, uint256, bool)",
  "event BatteryRegistered(bytes32 indexed batteryId, address indexed manufacturer, bytes32 metadataHash)",
] as const;

export const BATTERY_LIFECYCLE_ABI = [
  ...ACCESS_CONTROL_ABI,
  "function RECORDER_ROLE() view returns (bytes32)",
  "function recordEvent(bytes32 batteryId, uint8 eventType, bytes32 dataHash)",
  "function recordOwnership(bytes32 batteryId, address from, address to, bytes32 dataHash)",
  "function getEvent(bytes32 batteryId, uint256 index) view returns (bytes32, uint8, bytes32, address, uint256)",
  "function eventCount(bytes32 batteryId) view returns (uint256)",
  "event LifecycleRecorded(bytes32 indexed batteryId, uint8 eventType, bytes32 dataHash, address indexed actor)",
  "event OwnershipRecorded(bytes32 indexed batteryId, address indexed from, address indexed to, bytes32 dataHash)",
] as const;

export const CIRCULARITY_REWARDS_ABI = [
  ...ACCESS_CONTROL_ABI,
  "function VERIFIER_ROLE() view returns (bytes32)",
  "function recyclerReward() view returns (uint256)",
  "function consumerReward() view returns (uint256)",
  "function recycled(bytes32 batteryId) view returns (bool)",
  "function poolBalance() view returns (uint256)",
  "function deposit() payable",
  "function setRewards(uint256 recyclerReward, uint256 consumerReward)",
  "function verifyRecycling(bytes32 batteryId, address recycler, address consumer)",
  "event RewardDeposited(address indexed manufacturer, uint256 amount)",
  "event RewardsConfigured(uint256 recyclerReward, uint256 consumerReward)",
  "event RecyclingVerified(bytes32 indexed batteryId, address indexed recycler, address indexed consumer, uint256 recyclerAmount, uint256 consumerAmount)",
] as const;
