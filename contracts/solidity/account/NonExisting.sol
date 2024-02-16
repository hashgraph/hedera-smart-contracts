// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import { NonExtDup } from "./NonExtDup.sol";

contract NonExisting {
    NonExtDup duplicate;

    constructor(address addr) {
        // solhint-disable-previous-line no-empty-blocks
        duplicate = NonExtDup(addr);
    }

    function balanceOf(address addr) external view returns (uint256) {
        return addr.balance;
    }

    function callOnNonExistingAccount(address nonExistingAddr) external returns (bool) {
        (bool success, ) = nonExistingAddr.call(
            abi.encodeWithSignature("doesNotExist()")
        );

        return success;
    }

    function delegatecallOnNonExistingAccount(address nonExistingAddr) external returns (bool) {
        (bool success, ) = nonExistingAddr.delegatecall(
            abi.encodeWithSignature("doesNotExist()")
        );

        return success;
    }

    function staticcallOnNonExistingAccount(address nonExistingAddr) external view returns (bool) {
        (bool success, ) = nonExistingAddr.staticcall(
            abi.encodeWithSignature("doesNotExist()")
        );

        return success;
    }

    function balanceNoneExistingAddr(address nonExistingAddr) external view returns (uint256) {
        return nonExistingAddr.balance;
    }
}
