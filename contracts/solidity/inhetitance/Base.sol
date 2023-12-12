// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Base {
    receive() external payable {}
    function classIdentifier() public pure virtual returns (string memory) {
        return "Base";
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
