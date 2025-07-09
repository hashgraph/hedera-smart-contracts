// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "../HederaResponseCodes.sol";

contract ContractCreationHandler {
    // Event to emit when contract creation fails
    event ContractCreationFailed(int32 responseCode, uint64 contractNum);

    // Function to handle contract creation result
    function handleContractCreationResult(
        int32 responseCode,
        uint64 contractNum
    ) internal {
        if (responseCode != HederaResponseCodes.SUCCESS) {
            // For failed contract creation, we still want to track the contract number
            // This ensures consistency between record and block files
            emit ContractCreationFailed(responseCode, contractNum);
        }
    }

    // Function to validate contract creation parameters
    function validateContractCreation(
        bytes memory bytecode,
        uint64 value
    ) internal pure returns (int32) {
        if (bytecode.length == 0) {
            return HederaResponseCodes.CONTRACT_BYTECODE_EMPTY;
        }
        if (value < 0) {
            return HederaResponseCodes.CONTRACT_NEGATIVE_VALUE;
        }
        return HederaResponseCodes.SUCCESS;
    }
} 