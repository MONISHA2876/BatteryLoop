// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * BatteryLoop — lifecycle event proofs.
 * Stores hashes of off-chain event payloads, not the payloads themselves.
 */
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/AccessControl.sol";

contract BatteryLifecycle is AccessControl {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    struct EventProof {
        bytes32 batteryId;
        uint8 eventType;
        bytes32 dataHash;
        address actor;
        uint256 timestamp;
    }

    mapping(bytes32 => EventProof[]) private eventsByBattery;
    mapping(bytes32 => uint256) public eventCount;

    event LifecycleRecorded(
        bytes32 indexed batteryId,
        uint8 eventType,
        bytes32 dataHash,
        address indexed actor
    );

    event OwnershipRecorded(
        bytes32 indexed batteryId,
        address indexed from,
        address indexed to,
        bytes32 dataHash
    );

    constructor(address admin) {
        require(admin != address(0), "admin required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RECORDER_ROLE, admin);
    }

    function recordEvent(bytes32 batteryId, uint8 eventType, bytes32 dataHash)
        external
        onlyRole(RECORDER_ROLE)
    {
        require(batteryId != bytes32(0), "batteryId required");
        require(dataHash != bytes32(0), "dataHash required");
        require(eventType <= 10, "invalid eventType");

        eventsByBattery[batteryId].push(
            EventProof({
                batteryId: batteryId,
                eventType: eventType,
                dataHash: dataHash,
                actor: msg.sender,
                timestamp: block.timestamp
            })
        );
        eventCount[batteryId] += 1;

        emit LifecycleRecorded(batteryId, eventType, dataHash, msg.sender);
    }

    function recordOwnership(bytes32 batteryId, address from, address to, bytes32 dataHash)
        external
        onlyRole(RECORDER_ROLE)
    {
        require(batteryId != bytes32(0), "batteryId required");
        require(dataHash != bytes32(0), "dataHash required");
        require(to != address(0), "to required");

        eventsByBattery[batteryId].push(
            EventProof({
                batteryId: batteryId,
                eventType: 2,
                dataHash: dataHash,
                actor: msg.sender,
                timestamp: block.timestamp
            })
        );
        eventCount[batteryId] += 1;

        emit OwnershipRecorded(batteryId, from, to, dataHash);
        emit LifecycleRecorded(batteryId, 2, dataHash, msg.sender);
    }

    function getEvent(bytes32 batteryId, uint256 index)
        external
        view
        returns (bytes32, uint8, bytes32, address, uint256)
    {
        EventProof storage e = eventsByBattery[batteryId][index];
        return (e.batteryId, e.eventType, e.dataHash, e.actor, e.timestamp);
    }
}
