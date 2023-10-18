// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NonExisting {
    function callOnNonExistingAccount(address nonExistingAddr) external {
        nonExistingAddr.call(
            abi.encodeWithSignature("doesNotExist()")
        );
    }

    function delegatecallOnNoneExistingAccount(address nonExistingAddr) external {
        nonExistingAddr.delegatecall(
            abi.encodeWithSignature("doesNotExist()")
        );
    }

    function staticcallOnNoneExistingAccount(address nonExistingAddr) external {
        nonExistingAddr.staticcall(
            abi.encodeWithSignature("doesNotExist()")
        );
    }
}
