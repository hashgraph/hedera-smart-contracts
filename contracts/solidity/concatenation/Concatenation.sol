// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Concatenation {
    function byteConcatenation(bytes calldata first, bytes calldata second, bytes calldata third) public pure returns (uint256) {
        bytes memory concatenated = bytes.concat(first, second, third);
        return concatenated.length;
    }

    function stringConcatenation(string memory first, string memory second, string memory  third) public pure returns (string memory) {
        return string.concat(first, second, third);
    }

    function byteConcatenationEmpty() public pure returns (bytes memory) {
        return bytes.concat();
    }

    function stringConcatenationEmpty() public pure returns (string memory) {
        return string.concat();
    }

}
