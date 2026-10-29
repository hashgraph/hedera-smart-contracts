// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;
import { Functions } from "./Functions.sol";

contract FunctionsChild is Functions {
    string public message;

    constructor() {
        message = getMessage();
    }

    function getMessageString() external view returns (string memory) {
        return message;
    }
}
