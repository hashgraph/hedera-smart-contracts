// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract Errors {
    constructor() {
    }

    function assertCheck(bool condition) public pure returns (bool) {
        assert(condition);
        return true;
    }

    function requireCheck(bool shouldRevert) public pure returns (bool) {
        require(shouldRevert);
        return true;
    }

    function revertCheck() public pure returns (bool) {
        revert();
    }

    function revertWithMessageCheck(string calldata message) public pure returns (bool) {
        revert(message);
    }
}
