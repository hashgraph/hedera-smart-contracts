// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./HederaScheduleService_HIP1215.sol";
import "./HRC1215ScheduleFacade.sol";

contract HIP1215Contract is HederaScheduleService_HIP1215 {

    uint256 internal constant SCHEDULE_GAS_LIMIT = 1_000_000;
    uint256 internal constant HAS_SCHEDULE_CAPACITY_GAS_LIMIT = 10_000;

    constructor() payable {}

    event ScheduleCreated(address);

    function scheduleCallExample(address _to, bytes memory _selector, uint256 _expiry) external returns (int64 responseCode, address scheduleAddress) {
        (bool success, bytes memory result) = HSS.call(
            abi.encodeWithSelector(
                IHederaScheduleService_HIP1215.scheduleCall.selector,
                _to,
                _expiry > 0 ? _expiry : block.timestamp + 10,
                SCHEDULE_GAS_LIMIT,
                0,
                _selector
            ));

        (responseCode, scheduleAddress) = success ? abi.decode(result, (int64, address)) : (int64(HederaResponseCodes.UNKNOWN), address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to schedule");
        }

        emit ScheduleCreated(scheduleAddress);
    }

    function scheduleCallWithPayerExample(address _payer, address _to, bytes memory _selector, uint256 _expiry)
    external returns (int64 responseCode, address scheduleAddress) {
        (bool success, bytes memory result) = HSS.call(
            abi.encodeWithSelector(
                IHederaScheduleService_HIP1215.scheduleCallWithPayer.selector,
                _to,
                _payer,
                _expiry > 0 ? _expiry : block.timestamp + 10,
                SCHEDULE_GAS_LIMIT,
                0,
                _selector)
        );
        (responseCode, scheduleAddress) = success ? abi.decode(result, (int64, address)) : (int64(HederaResponseCodes.UNKNOWN), address(0));

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to schedule");
        }

        emit ScheduleCreated(scheduleAddress);
    }

    function executeCallOnPayerSignatureExample(address _payer, address _to, bytes memory _selector, uint256 _expiry)
    external returns (int64 responseCode, address scheduleAddress) {
        (bool success, bytes memory result) = HSS.call(
            abi.encodeWithSelector(
                IHederaScheduleService_HIP1215.executeCallOnPayerSignature.selector,
                _to,
                _payer,
                _expiry > 0 ? _expiry : block.timestamp + 10,
                SCHEDULE_GAS_LIMIT,
                0,
                _selector)
        );
        (responseCode, scheduleAddress) = success ? abi.decode(result, (int64, address)) : (int64(HederaResponseCodes.UNKNOWN), address(0));

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to schedule");
        }

        emit ScheduleCreated(scheduleAddress);
    }

    function deleteScheduleExample(address scheduleAddress) external returns (int64 responseCode) {
        (bool success, bytes memory result) = HSS.call(
            abi.encodeWithSelector(IHederaScheduleService_HIP1215.deleteSchedule.selector, scheduleAddress));
        responseCode = success ? abi.decode(result, (int64)) : HederaResponseCodes.UNKNOWN;

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to delete schedule");
        }
    }

    function deleteScheduleProxyExample(address scheduleAddress) external returns (int64 responseCode) {
        (responseCode) = IHRC1215ScheduleFacade(scheduleAddress).deleteSchedule();
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to delete schedule");
        }
    }

    function hasScheduleCapacityProxyExample(uint256 expirySecond, uint256 gasLimit) external view returns (bool hasCapacity) {
        (bool success, bytes memory result) = HSS.staticcall(
            abi.encodeWithSelector(IHederaScheduleService_HIP1215.hasScheduleCapacity.selector, expirySecond, gasLimit));
        hasCapacity = success ? abi.decode(result, (bool)) : false;
    }

    function getBlockTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}
