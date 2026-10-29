// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AccessControlContract is AccessControl {
    // Define roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    constructor() {
        // Assign the deployer (msg.sender) the admin role
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Function that can only be called by users with the admin role
    function adminFunction() public view onlyRole(ADMIN_ROLE) returns (string memory) {
        return "This function can only be called by administrators";
    }

    // Function that can only be called by users with the manager role
    function managerFunction() public view onlyRole(MANAGER_ROLE) returns (string memory) {
        return "This function can only be called by managers";
    }

    // Function to grant the manager role to an address
    function grantManagerRole(address account) public onlyRole(ADMIN_ROLE) {
        _grantRole(MANAGER_ROLE, account);
    }
}
