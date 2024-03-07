//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

/// @notice Beacon proxy using the Ticket contract as its implementation
contract MyProxy is BeaconProxy {
    /// @notice Simply passes the beacon address without any additional data to superior constructor
    constructor(address _beacon) payable BeaconProxy(_beacon, "") {}

    /// @return address The beacon managing the implementation of this proxy
    function beacon() public view returns (address) {
        return _getBeacon();
    }

    /// @return address The address of current implementation
    function implementation() public view returns (address) {
        return _implementation();
    }

    /// @notice required by Solidity
    receive() external payable {}
}
