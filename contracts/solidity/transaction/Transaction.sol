// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import { Secondary } from "./Secondary.sol";

contract Transaction {
    string public message;
    uint myInteger;
    address secondaryAddr;
    Secondary secondaryContract;
    event MsgValue(uint256);

    constructor(address secondaryAddress) {
       secondaryAddr = secondaryAddress;
       secondaryContract = Secondary(payable(secondaryAddress));
    }

    function checkGasleft() external view returns (uint256) {
        return gasleft();
    }

    function getMessageData(uint integer, string memory inputMessage) external returns (bytes memory) {
        message = inputMessage;
        myInteger = integer;

        return msg.data;
    }

    function getMessageSender() external view returns (address) {
        return msg.sender;
    }

    function getMessageSignature() external pure returns (bytes4) {
        return msg.sig;
    }

    function getMessageValue() external payable {
        emit MsgValue(msg.value);
    }

    function getGasPrice() external view returns (uint256) {
        return tx.gasprice;
    }

    function getTxOriginFromSecondary() external view returns (address) {
        return secondaryContract.getTxOrigin();
    }

    function getMsgSenderFromSecondary() external view returns (address) {
        return secondaryContract.getMsgSender();
    }
}
