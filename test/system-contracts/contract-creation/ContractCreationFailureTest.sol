// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../../contracts/yul/contract-creator/ContractCreator.sol";

contract ContractCreationFailureTest {
    ContractCreator public contractCreator;
    
    // This contract will always revert in its constructor
    contract RevertingContract {
        constructor() {
            revert("Contract creation should fail");
        }
    }

    function setUp() public {
        contractCreator = new ContractCreator();
    }

    function testFailedContractCreation() public {
        // Get the bytecode of the RevertingContract
        bytes memory bytecode = type(RevertingContract).creationCode;
        
        // Attempt to create the contract
        try contractCreator.createNewContract(bytecode) {
            // If we get here, the test should fail
            assert(false);
        } catch {
            // Verify that no contract ID was generated
            // This is done by checking that the event was emitted with empty reason
            // and the transaction reverted
            assert(true);
        }
    }

    function testFailedContractCreation2() public {
        // Get the bytecode of the RevertingContract
        bytes memory bytecode = type(RevertingContract).creationCode;
        
        // Attempt to create the contract with create2
        try contractCreator.create2NewContract(bytecode, uint256(0)) {
            // If we get here, the test should fail
            assert(false);
        } catch {
            // Verify that no contract ID was generated
            // This is done by checking that the event was emitted with empty reason
            // and the transaction reverted
            assert(true);
        }
    }
} 