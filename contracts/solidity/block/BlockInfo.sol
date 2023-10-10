// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract BlockInfo {
    
    function getBlockBaseFee() public view returns (uint256) {
        return block.basefee;
    }

    function getBlockHash(uint256 blockNumber) public view returns (bytes32) {
        return blockhash(blockNumber);
    }

    function getMinerAddress() public view returns (address) {
        return block.coinbase;
    }

    function getBlockPrevrando() external view returns (uint256) {
        return block.prevrandao;
    }

    function getBlockGasLimit() external view returns (uint256) {
        return block.gaslimit;
    }

    function getBlockNumber() external view returns (uint256) {
        return block.number;
    }

    function getBlockTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    // should behave like prevrandao
    function getBlockDifficulty() external view returns (uint256) {
        return block.difficulty;
    }
}