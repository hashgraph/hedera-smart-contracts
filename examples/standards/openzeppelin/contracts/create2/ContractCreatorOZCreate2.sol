// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Create2.sol";

contract ContractCreatorOZCreate2 {
    constructor() payable{}

    event NewContractDeployedAt(address addr);

    function deploy(uint256 amount, uint256 salt, bytes memory bytecode) external {
        address addr = Create2.deploy(amount, bytes32(salt), bytecode);

        emit NewContractDeployedAt(addr);
    }

    function computeAddress(uint256 salt, bytes32 bytecodeHash) external view returns (address addr) {
        addr = Create2.computeAddress(bytes32(salt), bytecodeHash);
    }
}
