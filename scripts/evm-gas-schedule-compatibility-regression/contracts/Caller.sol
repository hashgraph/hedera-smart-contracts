// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Caller {
    uint256 public number;

    function callIncrement(address counter) external {
        (bool success,) = counter.delegatecall(abi.encodeWithSignature("increment()"));
        require(success, "Delegatecall failed");
    }
}
