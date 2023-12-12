// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract CryptoUnits {
    constructor() {
    }

    function get1Wei() public pure returns (uint) {
      return 1 wei;
    }

    function get1GWei() public pure returns (uint256) {
      return 1 gwei;
    }

    function get1Eth() public pure returns (uint256) {
      return 1 ether;
    }
}
