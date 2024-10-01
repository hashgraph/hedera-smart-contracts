// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "./Counter.sol";

contract CounterV2 is Counter {
    function changeName(string memory _name) public {
        name = _name;
    }
}
