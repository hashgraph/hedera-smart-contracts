//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract MyBeacon is UpgradeableBeacon {

    constructor(address implementation_, address owner) UpgradeableBeacon(implementation_, owner) {}
}
