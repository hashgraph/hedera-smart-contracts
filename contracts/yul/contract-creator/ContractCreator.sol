// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../../system-contracts/contract-creation/ContractCreationHandler.sol";

/**
 * @notice The unit tests for the `ContractCreator` contract will utilize a predefined bytecode of a contract that inherits the `ITargetContract` interface.
 */
interface ITargetContract {
    function setCount(uint _number) external;
    function getCount() external view returns (uint);
}

contract ContractCreator is ContractCreationHandler {
    event NewContractCreated(address contractAddress);

    /// create(v, p, n) is used to create a new contract
    /// `v`: The value (in wei) to be transferred to the newly created contract.
    /// `p`: The address of the location in memory where the code for the new contract is stored.
    /// `n`: The size of the code in memory.
    function createNewContract(bytes memory bytecode) external payable {
        // Validate contract creation parameters
        int32 validationCode = validateContractCreation(bytecode, uint64(msg.value));
        if (validationCode != HederaResponseCodes.SUCCESS) {
            handleContractCreationResult(validationCode, 0);
            revert();
        }

        address newContractAddress;
        uint64 contractNum;
        assembly {
            // get msgValue
            let msgValue := callvalue()

            // get the size of the `bytecode`
            let size := mload(bytecode)

            // get actual bytecode
            // @notice: This is done as `add(bytecode, 0x20)` because the first 32 bytes of the `bytecode` are often used to store the length of the bytecode,
            //          and the actual bytecode starts from 33rd byte. So by adding `0x20`, it's pointing to the actualy bytecode's starting position within the `bytecode` array
            let actualByteCode := add(bytecode, 0x20)

            // Create new contract using create(v, p, n) opcode
            newContractAddress := create(msgValue, actualByteCode, size)

            // check if the contract creation was sucessful
            if iszero(extcodesize(newContractAddress)) {
                // Get contract number from the transaction
                contractNum := mload(0x40)
                // Handle failed contract creation
                handleContractCreationResult(HederaResponseCodes.CONTRACT_REVERT_EXECUTED, contractNum)
                revert(0, 0)
            }
        }
        emit NewContractCreated(newContractAddress);
    }

    /// create2(v, p, n, s) is used to create a new contract
    /// `v`: The value (in wei) to be transferred to the newly created contract.
    /// `p`: The address of the location in memory where the code for the new contract is stored.
    /// `n`: The size of the code in memory.
    /// `s`: The random 256-bit salt
    function create2NewContract(bytes memory bytecode, uint256 salt) external payable {
        // Validate contract creation parameters
        int32 validationCode = validateContractCreation(bytecode, uint64(msg.value));
        if (validationCode != HederaResponseCodes.SUCCESS) {
            handleContractCreationResult(validationCode, 0);
            revert();
        }

        address newContractAddress;
        uint64 contractNum;
        assembly {
            // get msgValue
            let msgValue := callvalue()

            // get the size of the `bytecode`
            let size := mload(bytecode)

            // get actual bytecode
            // @notice: This is done as `add(bytecode, 0x20)` because the first 32 bytes of the `bytecode` are often used to store the length of the bytecode,
            //          and the actual bytecode starts from 33rd byte. So by adding `0x20`, it's pointing to the actualy bytecode's starting position within the `bytecode` array
            let actualByteCode := add(bytecode, 0x20)

            // Create new contract using create2(v, p, n, s) opcode
            newContractAddress := create2(msgValue, actualByteCode, size, salt)

            // check if the contract creation was sucessful
            if iszero(extcodesize(newContractAddress)) {
                // Get contract number from the transaction
                contractNum := mload(0x40)
                // Handle failed contract creation
                handleContractCreationResult(HederaResponseCodes.CONTRACT_REVERT_EXECUTED, contractNum)
                revert(0, 0)
            }
        }
        emit NewContractCreated(newContractAddress);
    }
}
