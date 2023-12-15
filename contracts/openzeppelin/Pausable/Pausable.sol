// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Pausable.sol";

contract PausableTest is Pausable {
    string public message;

    function setPausedMessage(string calldata _message) external whenNotPaused {
        message = _message;
    }

    function getPausedMessage() external view whenPaused returns (string memory) {
        return message;
    }

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }
}