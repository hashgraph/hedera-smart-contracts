// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract BlockInfo {
    
    function getBlockBaseFee() public view returns (uint256) {
        return block.basefee;
    }

    function getBlockHash(uint256 blockNumber) public view returns (bytes32) {
        return blockhash(blockNumber);
    }

    function getCurrentMinerAddress() public view returns (address) {
        return block.coinbase;
    }
}