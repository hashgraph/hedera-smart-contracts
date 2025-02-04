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

    function executeHtsMintTokenRevertingCalls(address contractAddress, address tokenAddress, int64[] memory amounts, bytes[] memory metadata) external returns (bool success) {
        for (uint i = 0; i < amounts.length; i++) {
            if (amounts[i] < 0){
                // reverts with 'Minting reverted with INVALID_TOKEN_ID'
                (success,) = address(contractAddress).call(abiEncodeMintTokenPublic(contractAddress, 0, metadata));
            } else {
                // reverts with 'Minting <amount> tokens reverted with TOKEN_MAX_SUPPLY_REACHED'
                (success,) = address(contractAddress).call(abiEncodeMintTokenPublic(tokenAddress, amounts[i], metadata));
            }
        }
    }

    function executeHtsMintTokenRevertingCallsAndFailToAssociate(address contractAddress, address tokenAddress, int64[] memory amounts, bytes[] memory metadata) external returns (bool success) {
        for (uint i = 0; i < amounts.length; i++) {
            if (amounts[i] < 0){
                (success,) = address(contractAddress).call(abiEncodeMintTokenPublic(contractAddress, 0, metadata));
            } else {
                (success,) = address(contractAddress).call(abiEncodeMintTokenPublic(tokenAddress, amounts[i], metadata));
            }
        }

        // reverts with 'Association reverted with TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT'
        (success,) = address(contractAddress).call(abiEncodeAssociateTokenPublic(contractAddress, tokenAddress));
    }

    function nestEverySecondHtsMintTokenCall(address contractAddress, address token, int64[] memory amounts, bytes[] memory metadata) external returns (bool success) {
        for (uint i = 0; i < amounts.length; i++) {
            if (i % 2 == 0){
                (success,) = address(contractAddress).call(abiEncodeMintTokenPublic(token, amounts[i], metadata));
            } else {
                this.mintTokenExternalCall(contractAddress, token, amounts[i], metadata);
            }
        }
    }

    function mintTokenExternalCall(address contractAddress, address token, int64 amount, bytes[] memory metadata) external returns (bool success) {
        (success,) = address(contractAddress).call(abiEncodeMintTokenPublic(token, amount, metadata));
    }

    function abiEncodeMintTokenPublic(address token, int64 amount, bytes[] memory metadata) internal pure returns (bytes memory abiEncodedData) {
        return abi.encodeWithSignature("mintTokenPublic(address,int64,bytes[])", token, amount, metadata);
    }

    function abiEncodeAssociateTokenPublic(address account, address token) internal pure returns (bytes memory abiEncodedData) {
        return abi.encodeWithSignature("associateTokenPublic(address,address)", account, token);
    }
}
