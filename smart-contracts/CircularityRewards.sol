// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * BatteryLoop — circularity reward pool.
 * Manufacturers deposit native FLOW. An authorized verifier (hackathon admin)
 * confirms recycling and the contract pays recycler + consumer from the pool.
 */
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/access/AccessControl.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.2/contracts/utils/ReentrancyGuard.sol";

contract CircularityRewards is AccessControl, ReentrancyGuard {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    uint256 public recyclerReward;
    uint256 public consumerReward;
    mapping(bytes32 => bool) public recycled;

    event RewardDeposited(address indexed manufacturer, uint256 amount);
    event RewardsConfigured(uint256 recyclerReward, uint256 consumerReward);
    event RecyclingVerified(
        bytes32 indexed batteryId,
        address indexed recycler,
        address indexed consumer,
        uint256 recyclerAmount,
        uint256 consumerAmount
    );

    constructor(address admin, uint256 _recyclerReward, uint256 _consumerReward) {
        require(admin != address(0), "admin required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
        recyclerReward = _recyclerReward;
        consumerReward = _consumerReward;
        emit RewardsConfigured(_recyclerReward, _consumerReward);
    }

    function deposit() external payable {
        require(msg.value > 0, "zero deposit");
        emit RewardDeposited(msg.sender, msg.value);
    }

    receive() external payable {
        require(msg.value > 0, "zero deposit");
        emit RewardDeposited(msg.sender, msg.value);
    }

    function setRewards(uint256 _recyclerReward, uint256 _consumerReward)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        recyclerReward = _recyclerReward;
        consumerReward = _consumerReward;
        emit RewardsConfigured(_recyclerReward, _consumerReward);
    }

    function poolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function verifyRecycling(bytes32 batteryId, address recycler, address consumer)
        external
        onlyRole(VERIFIER_ROLE)
        nonReentrant
    {
        require(batteryId != bytes32(0), "batteryId required");
        require(recycler != address(0), "recycler required");
        require(!recycled[batteryId], "already recycled");

        uint256 recyclerAmount = recyclerReward;
        uint256 consumerAmount = consumer == address(0) ? 0 : consumerReward;
        uint256 total = recyclerAmount + consumerAmount;
        require(address(this).balance >= total, "insufficient pool");

        recycled[batteryId] = true;

        (bool okRecycler, ) = recycler.call{value: recyclerAmount}("");
        require(okRecycler, "recycler payout failed");

        if (consumerAmount > 0 && consumer != address(0)) {
            (bool okConsumer, ) = consumer.call{value: consumerAmount}("");
            require(okConsumer, "consumer payout failed");
        }

        emit RecyclingVerified(batteryId, recycler, consumer, recyclerAmount, consumerAmount);
    }
}
