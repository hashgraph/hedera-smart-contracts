// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

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
