// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import { ErrorsExternal } from "./ErrorsExternal.sol";

contract Errors {
    error InsufficientBalance(uint256 available, uint256 required);
    ErrorsExternal errorsExternal;
    event Result(uint code, string message);

    constructor(address errorsExternalAddr) {
        errorsExternal = ErrorsExternal(errorsExternalAddr);
    }

    function assertCheck(bool condition) external pure returns (bool) {
        assert(condition);
        return true;
    }

    function requireCheck(bool shouldRevert) external pure returns (bool) {
        require(shouldRevert);
        return true;
    }

    function revertCheck() external pure returns (bool) {
        revert();
    }

    function revertWithMessageCheck(string calldata message) external pure returns (bool) {
        revert(message);
    }

    function revertWithCustomError() external pure returns (bool) {
        revert InsufficientBalance(1, 100);
    }

    function tryCatchWithSimpleRevert() external returns (int value, bool success) {
        try errorsExternal.revertSimple() returns (bool v) {
            return (1, v);
        } catch (bytes memory) {
            emit Result(0, 'revertSimple');
        }
    }

    function tryCatchWithErrorMessageRevert(string memory message) external returns (int value, bool success) {
        try errorsExternal.revertWithErrorMessage(message) returns (bool v) {
            return (1, v);
        } catch Error(string memory _message) {
            emit Result(0, _message);
        }
    }

    function tryCatchWithPanic() external returns (uint value, bool success) {
        try errorsExternal.panic() returns (uint v) {
            return (v, false);
        } catch Panic(uint errorCode) {
            emit Result(errorCode, 'panic');
        }
    }
}
