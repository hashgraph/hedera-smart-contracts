//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract DestructuringReturns {
    function f() public pure returns (uint, bool, uint) {
        return (7, true, 2);
    }

    function testDestructuredReturnParams() external pure returns(uint, bool, uint) {
        (uint x, bool y, uint z) = f();

        return (x, y, z);
    }
}
