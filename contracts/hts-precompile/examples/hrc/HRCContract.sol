// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "../../IHRC.sol";

contract HRCContract {
    function associate(address token) public returns (uint256 responseCode) {
        return IHRC(token).associate();
    }

    function dissociate(address token) public returns (uint256 responseCode) {
        return IHRC(token).dissociate();
    }
}