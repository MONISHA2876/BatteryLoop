// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * BatteryLoop — Digital Battery Passport (identity + metadata hash).
 *
 * Off-chain: chemistry, telemetry, photos, owner PII.
 * On-chain: battery id, manufacturer, metadata hash, registration time.
 *
 * Remix: OpenZeppelin via GitHub (v5.0.2).
 */
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/AccessControl.sol";

contract BatteryPassport is AccessControl {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct BatteryRecord {
        bytes32 batteryId;
        bytes32 metadataHash;
        address manufacturer;
        uint256 registeredAt;
        bool exists;
    }

    mapping(bytes32 => BatteryRecord) private batteries;

    event BatteryRegistered(
        bytes32 indexed batteryId,
        address indexed manufacturer,
        bytes32 metadataHash
    );

    constructor(address admin) {
        require(admin != address(0), "admin required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
        _grantRole(MANUFACTURER_ROLE, admin);
    }

    function registerBattery(
        bytes32 batteryId,
        bytes32 metadataHash,
        address manufacturer
    ) external onlyRole(REGISTRAR_ROLE) {
        require(batteryId != bytes32(0), "batteryId required");
        require(metadataHash != bytes32(0), "metadataHash required");
        require(manufacturer != address(0), "manufacturer required");
        require(!batteries[batteryId].exists, "already registered");

        batteries[batteryId] = BatteryRecord({
            batteryId: batteryId,
            metadataHash: metadataHash,
            manufacturer: manufacturer,
            registeredAt: block.timestamp,
            exists: true
        });

        emit BatteryRegistered(batteryId, manufacturer, metadataHash);
    }

    function getBattery(bytes32 batteryId)
        external
        view
        returns (bytes32, bytes32, address, uint256, bool)
    {
        BatteryRecord storage rec = batteries[batteryId];
        return (rec.batteryId, rec.metadataHash, rec.manufacturer, rec.registeredAt, rec.exists);
    }
}
