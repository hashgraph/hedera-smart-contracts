// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "./Counter.sol";

contract CounterV2 is Counter {
    function changeName(string memory _name) public {
        name = _name;
    }
}
