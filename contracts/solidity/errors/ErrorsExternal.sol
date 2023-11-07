// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract ErrorsExternal {
    error InsufficientBalance(uint256 available, uint256 required);

    function revertWithCustomError() external pure returns (bool) {
        revert InsufficientBalance(1, 100);
    }

    function revertSimple() external pure returns (bool) {
        revert();
    }

    function revertWithErrorMessage(string memory message) external pure returns (bool) {
        revert(message);
    }

    function panic() external pure returns (uint) {
        return uint(4)/uint(0);
    }
}
