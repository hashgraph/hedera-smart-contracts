// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

// Helper used by test/solo/WHBAR.js to call WHBAR.withdraw() from a contract.
contract Target {
    string public message;

    function setMessage(string calldata _message) external {
        message = _message;
    }

    event WithdrawResponse(bool, bytes);

    function tryToWithdraw(address to, uint wad) external {
        (bool success, bytes memory res) = to.call(abi.encodeWithSignature("withdraw(uint256)", wad));
        emit WithdrawResponse(success, res);
    }
}
