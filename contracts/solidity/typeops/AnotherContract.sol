// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "./MyInterface.sol";

contract AnotherContract is MyInterface {
    function sayHelloWorld() external pure returns (string memory) {
        return "Hello World";
    }

    function myFunction() external pure override returns (uint) {
        return 123;
    }
}
