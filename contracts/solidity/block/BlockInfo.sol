// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

contract BlockInfo {
    
    function getBlockBaseFee() public view returns (uint256) {
        return block.basefee;
    }

    function getBlockHash() public view returns (bytes32) {
        return blockhash(block.number - 1);
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
