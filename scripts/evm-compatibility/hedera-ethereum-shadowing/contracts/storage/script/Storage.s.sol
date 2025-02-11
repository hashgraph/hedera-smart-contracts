// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/Storage.sol";

contract StorageScript is Script {
    Storage public counter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        counter = new Storage();

        vm.stopBroadcast();
    }
}
