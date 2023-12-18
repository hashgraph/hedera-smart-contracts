// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "./MyInterface.sol";
import "./AnotherContract.sol";

contract TypeOps {

    // type(C).name where C is a contract
    function typeContractName() external pure returns (string memory) {
        // get the contract name
        return type(TypeOps).name;
    }

    // `type(C).creationCode` where `C` is a contract
    function typeContractCreationCode() external pure returns (bytes memory) {
        // get the contract creation code
        return type(AnotherContract).creationCode;
    }

    // `type(C).runtimeCode` where `C` is a contract
    function typeContractRuntimeCode() external pure returns (bytes memory) {
        // get the contract runtime code
        return type(AnotherContract).runtimeCode;
    }

    // type(I).interfaceId where I is an interface
    function typeInterfaceId() external pure returns (bytes4) {
        // get the interface id
        return type(MyInterface).interfaceId;
    }

    // `type(I).min` where `T` is an integer type
    function typeIntegerMin() external pure returns (int) {
        // get the minimum value of int
        return type(int).min;
    }
    
    // `type(T).max` where `T` is an integer type
    function typeIntegerMax() external pure returns (int) {
        // get the minimum value of int
        return type(int).max;
    }

    // `type(T).min` where `T` is an unsigned integer type
    function typeUintMin() external pure returns (uint) {
        // get the minimum value of uint
        return type(uint).min;
    }

    // `type(T).max` where `T` is an unsigned integer type
    function typeUintMax() external pure returns (uint) {
        // get the maximum value of uint
        return type(uint).max;
    }

}
