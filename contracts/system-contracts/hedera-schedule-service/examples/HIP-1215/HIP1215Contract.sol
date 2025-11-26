// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "../../HederaScheduleService_HIP1215.sol";
import "../../HRC1215ScheduleFacade.sol";

contract HIP1215Contract is HederaScheduleService_HIP1215 {

    uint256 internal constant SCHEDULE_GAS_LIMIT = 1_000_000;

    constructor() payable {}

    event ScheduleCreated(address);

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, expiration time, the gas limit for the future call, the value to send with that call
    /// and the call data to use.
    function scheduleCallExample(address _to, bytes memory _calldata, uint256 _expiry, uint256 _gasLimit, uint64 _value) external returns (int64 responseCode, address scheduleAddress) {
        (responseCode, scheduleAddress) = scheduleCall(
            _to,
            _expiry > 0 ? _expiry : block.timestamp + 5,
            _gasLimit > 0 ? _gasLimit : SCHEDULE_GAS_LIMIT,
            _value,
            _calldata
        );

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to schedule");
        }

        emit ScheduleCreated(scheduleAddress);
    }

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, with a payer for the scheduled transaction, expiration time, the gas limit for the future call,
    /// the value to send with that call and the call data to use.
    function scheduleCallWithPayerExample(address _payer, address _to, bytes memory _calldata, uint256 _expiry, uint256 _gasLimit, uint64 _value)
    external returns (int64 responseCode, address scheduleAddress) {
        (responseCode, scheduleAddress) = scheduleCallWithPayer(
            _to,
            _payer,
            _expiry > 0 ? _expiry : block.timestamp + 5,
            _gasLimit > 0 ? _gasLimit : SCHEDULE_GAS_LIMIT,
            _value,
            _calldata
        );

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to schedule");
        }

        emit ScheduleCreated(scheduleAddress);
    }

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, with a payer for the scheduled transaction, expiration time, the gas limit for the future call,
    /// the value to send with that call and the call data to use.
    function executeCallOnPayerSignatureExample(address _payer, address _to, bytes memory _calldata, uint256 _expiry, uint256 _gasLimit, uint64 _value)
    external returns (int64 responseCode, address scheduleAddress) {
        (responseCode, scheduleAddress) = executeCallOnPayerSignature(
            _to,
            _payer,
            _expiry > 0 ? _expiry : block.timestamp + 5,
            _gasLimit > 0 ? _gasLimit : SCHEDULE_GAS_LIMIT,
            _value,
            _calldata
        );

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to schedule");
        }

        emit ScheduleCreated(scheduleAddress);
    }

    /// Delete the targeted schedule transaction.
    function deleteScheduleExample(address scheduleAddress) external returns (int64 responseCode) {
        (responseCode) = deleteSchedule(scheduleAddress);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to delete schedule");
        }
    }

    /// Delete the targeted schedule transaction via IHRC1215 proxy.
    function deleteScheduleProxyExample(address scheduleAddress) external returns (int64 responseCode) {
        (responseCode) = IHRC1215ScheduleFacade(scheduleAddress).deleteSchedule();
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to delete schedule");
        }
    }

    /// Allows to check if the given second still has capacity to schedule a contract call with the specified gas limit.
    function hasScheduleCapacityProxyExample(uint256 expirySecond, uint256 gasLimit) external view returns (bool hasCapacity) {
        (hasCapacity) = hasScheduleCapacity(expirySecond, gasLimit);
    }

    /// Returns the current block timestamp.
    function getBlockTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}
