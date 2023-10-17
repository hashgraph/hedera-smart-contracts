// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Target {
    string public message;

    function setMessage(string calldata _message) external {
        message = _message;
    }
}

contract TargetWithConstructor {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }
}

contract New {
    struct ContractInformation {
        address contractAddr;
        string message;
    }

    mapping(string => ContractInformation) public newContractsInfo;

    function createContract(string calldata contractName, string calldata message) external {
        Target newTarget = new Target();

        newTarget.setMessage(message);

        newContractsInfo[contractName] = ContractInformation({
            contractAddr: address(newTarget),
            message: newTarget.message()
        });
    }

    function createContractWithData(string calldata contractName, string calldata message) external {
        TargetWithConstructor newTargetWithConstructor = new TargetWithConstructor(message);

        newContractsInfo[contractName] = ContractInformation({
            contractAddr: address(newTargetWithConstructor),
            message: newTargetWithConstructor.message()
        });
    }

    function createContractWithSalt(bytes32 salt, string calldata contractName, string calldata message) external {
        TargetWithConstructor newContractsWithSalt = new TargetWithConstructor{salt: salt}(message);

        newContractsInfo[contractName] = ContractInformation({
            contractAddr: address(newContractsWithSalt),
            message: newContractsWithSalt.message()
        });
    }
}
