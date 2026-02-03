// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "../../HederaScheduleService.sol";

pragma experimental ABIEncoderV2;

contract HRC755Contract is HederaScheduleService {
    /// Authorizes the calling contract as a signer to the schedule transaction.
    /// @param schedule the address of the schedule transaction.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function authorizeScheduleCallExample(address schedule) external returns (int64 responseCode) {
        (responseCode) = authorizeSchedule(schedule);
        require(responseCode == HederaResponseCodes.SUCCESS, "Authorize schedule failed.");
    }

    /// Allows for the signing of a schedule transaction given a protobuf encoded signature map
    /// The message signed by the keys is defined to be the concatenation of the shard, realm, and schedule transaction ID.
    /// @param schedule the address of the schedule transaction.
    /// @param signatureMap the protobuf encoded signature map.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function signScheduleCallExample(address schedule, bytes memory signatureMap) external returns (int64 responseCode) {
        (responseCode) = signSchedule(schedule, signatureMap);
        require(responseCode == HederaResponseCodes.SUCCESS, "Sign schedule failed.");
    }
}
