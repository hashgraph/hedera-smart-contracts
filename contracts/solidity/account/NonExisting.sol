// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { NonExtDup } from "./NonExtDup.sol";

contract NonExisting {
    NonExtDup duplicate;

    constructor(address addr) {
        // solhint-disable-previous-line no-empty-blocks
        duplicate = NonExtDup(addr);
    }

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

    function balanceNoneExistingAddr(address nonExistingAddr) external view returns (uint256) {
        return nonExistingAddr.balance;
    }
}
