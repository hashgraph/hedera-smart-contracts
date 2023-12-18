//SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

//Wrap the OZ contract so it can be instantiated in the hardhat tests
contract MyCustomTransparentUpgradeableProxy is TransparentUpgradeableProxy {
    constructor(address logic, address initialOwner, bytes memory data) TransparentUpgradeableProxy(logic, initialOwner, data) {}
}
