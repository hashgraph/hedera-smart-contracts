// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/Storage.sol";

contract CounterTest is Test {
    Storage public counter;

    function setUp() public {
        counter = new Storage();
        counter.store(0);
    }

    function test_Increment() public {
        counter.store(1);
        assertEq(counter.retrieve(), 1);
    }

    function testFuzz_SetNumber(uint256 x) public {
        counter.store(x);
        assertEq(counter.retrieve(), x);
    }

}
