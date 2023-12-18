// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Multicall.sol";

contract MulticallTest is Multicall {
    function foo() public pure returns (uint256) {
        return 123;
    }

    function bar() public pure returns (uint256) {
        return 456;
    }
}
