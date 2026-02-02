// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.4.9 <0.9.0;

import "../../HederaScheduleService.sol";
import "../../IHRC1215ScheduleFacade.sol";

contract HRC1215Contract is HederaScheduleService {

    constructor() payable {}

    error FailToSchedule();
    error FailToDeleteSchedule();

    event ScheduleCreated(address);

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, expiration time, the gas limit for the future call, the value to send with that call
    /// and the call data to use.
    function scheduleCallExample(address _to, uint256 _expiry, uint256 _gasLimit, uint64 _value, bytes memory _calldata)
    external returns (int64 responseCode, address scheduleAddress) {
        (responseCode, scheduleAddress) = scheduleCall(
            _to,
            _expiry > 0 ? _expiry : block.timestamp + 5,
            _gasLimit,
            _value,
            _calldata
        );

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert FailToSchedule();
        }

        emit ScheduleCreated(scheduleAddress);
    }

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, with a payer for the scheduled transaction, expiration time, the gas limit for the future call,
    /// the value to send with that call and the call data to use.
    function scheduleCallWithPayerExample(address _to, address _payer, uint256 _expiry, uint256 _gasLimit, uint64 _value, bytes memory _calldata)
    external returns (int64 responseCode, address scheduleAddress) {
        (responseCode, scheduleAddress) = scheduleCallWithPayer(
            _to,
            _payer,
            _expiry > 0 ? _expiry : block.timestamp + 5,
            _gasLimit,
            _value,
            _calldata
        );

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert FailToSchedule();
        }

        emit ScheduleCreated(scheduleAddress);
    }

    /// Allows for the creation of a schedule transaction to schedule any contract call for a given smart contract
    /// address, with a payer for the scheduled transaction, expiration time, the gas limit for the future call,
    /// the value to send with that call and the call data to use.
    function executeCallOnPayerSignatureExample(address _to, address _payer, uint256 _expiry, uint256 _gasLimit, uint64 _value, bytes memory _calldata)
    external returns (int64 responseCode, address scheduleAddress) {
        (responseCode, scheduleAddress) = executeCallOnPayerSignature(
            _to,
            _payer,
            _expiry > 0 ? _expiry : block.timestamp + 5,
            _gasLimit,
            _value,
            _calldata
        );

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert FailToSchedule();
        }

        emit ScheduleCreated(scheduleAddress);
    }

    /// Delete the targeted schedule transaction.
    function deleteScheduleExample(address _scheduleAddress) external returns (int64 responseCode) {
        (responseCode) = deleteSchedule(_scheduleAddress);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert FailToDeleteSchedule();
        }
    }

    /// Delete the targeted schedule transaction via IHRC1215 proxy.
    function deleteScheduleProxyExample(address _scheduleAddress) external returns (int64 responseCode) {
        (responseCode) = IHRC1215ScheduleFacade(_scheduleAddress).deleteSchedule();
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert FailToDeleteSchedule();
        }
    }

    /// Allows to check if the given second still has capacity to schedule a contract call with the specified gas limit.
    function hasScheduleCapacityProxyExample(uint256 _expirySecond, uint256 _gasLimit) external view returns (bool hasCapacity) {
        (hasCapacity) = hasScheduleCapacity(_expirySecond, _gasLimit);
    }

    /// Returns the current block timestamp.
    function getBlockTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}
