// SPDX-License-Identifier: Apache-2.0

// The version is hardcoded because all of the executed tests against besu's node are compiled with 0.8.23 compiler. If
// we want to change this version, first we need to re-compile the OpcodeLogger.sol contract with a newer version,
// then re-run the tests against besu's node to get the opcodes response. Once we've got the updated json, we can run opcode
// logger tests against hedera and compare the output with the besu's one. We can not make the solidity version dynamic
// because each new solidity version could introduce/remove/replace opcodes which could lead to outputs mismatching.
//
// This "problem" could be resolved with creating a new CI pipeline with the following steps:
//   - compile the contract with the solidity version described in current hardhat.config.js
//   - start the besu node
//   - run the tests against besu and save the output in opcodeLoggerBesuResults.json
//   - stop the besu node
//   - start the hedera node
//   - run the tests against hedera and compare the output with the besu's one (saved from the steps above)

pragma solidity 0.8.23;

contract OpcodeLogger {
    address public owner;
    mapping(address => uint256) public callsCounter;

    constructor() {
        owner = msg.sender;
        callsCounter[owner]++;
    }

    function updateOwner() external returns (address) {
        owner = msg.sender;
        callsCounter[owner]++;

        return owner;
    }

    function resetCounter() external {
        callsCounter[msg.sender] = 0;
    }

    function call(address payable _target, bytes memory _calldata) external payable returns (bool, uint256) {
        bool isSuccess;
        uint256 res;

        assembly {
            let resPlaceholder := mload(0x40)
            isSuccess := call(gas(), _target, callvalue(), add(_calldata, 0x20), mload(_calldata), resPlaceholder, 0x20)
            res := mload(resPlaceholder)
        }

        callsCounter[msg.sender]++;

        return (isSuccess, res);
    }

    function delegateCall(address payable _target, bytes memory _calldata) external returns (bool) {
        bool isSuccess;

        assembly {
            isSuccess := delegatecall(gas(), _target, add(_calldata, 0x20), mload(_calldata), 0, 0)
        }

        callsCounter[msg.sender]++;

        return isSuccess;
    }

    function staticCall(address payable _target, bytes memory _calldata) external returns (bool, uint256) {
        bool isSuccess;
        uint256 res;

        assembly {
            let resPlaceholder := mload(0x40)
            isSuccess := staticcall(gas(), _target, add(_calldata, 0x20), mload(_calldata), resPlaceholder, 0x20)
            res := mload(resPlaceholder)
        }

        callsCounter[msg.sender]++;

        return (isSuccess, res);
    }

    function callCode(address payable _target, bytes memory _calldata) external payable returns (bool) {
        bool isSuccess;

        assembly {
            isSuccess := callcode(gas(), _target, callvalue(), add(_calldata, 0x20), mload(_calldata), 0, 0)
        }

        callsCounter[msg.sender]++;

        return isSuccess;
    }
}
