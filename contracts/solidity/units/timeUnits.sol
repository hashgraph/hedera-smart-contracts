// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract TimeUnits {
    constructor() {
    }

    function get1Second() public pure returns (uint) {
      return 1 seconds;
    }

    function get1Minute() public pure returns (uint) {
      return 1 minutes;
    }

    function get1Hour() public pure returns (uint) {
      return 1 hours;
    }

    function get1Day() public pure returns (uint) {
      return 1 days;
    }

    function get1Week() public pure returns (uint) {
      return 1 weeks;
    }
}
