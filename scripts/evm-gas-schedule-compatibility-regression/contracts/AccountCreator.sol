// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccountCreator {
    constructor() payable { }
    function send(address account) external {
        (bool ok, bytes memory status) = payable(account).call{value: 1}("");
        require(ok, string(status));
    }
}
