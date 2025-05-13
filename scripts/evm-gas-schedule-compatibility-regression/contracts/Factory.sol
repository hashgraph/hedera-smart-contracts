// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Factory {
    event Deployed(address addr, uint256 salt);

    function deploy2(bytes memory bytecode, uint256 salt) public returns (address) {
        address addr;
        assembly {
            addr := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(addr)) { revert(0, 0) }
        }
        emit Deployed(addr, salt);
        return addr;
    }

    function deploy(bytes memory bytecode) public returns (address addr) {
        assembly {
            addr := create(0, add(bytecode, 0x20), mload(bytecode))
            if iszero(extcodesize(addr)) { revert(0, 0) }
        }
        return addr;
    }

    function getPredictedAddress(bytes memory bytecode, uint256 salt) public view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));
        return address(uint160(uint256(hash)));
    }
}
