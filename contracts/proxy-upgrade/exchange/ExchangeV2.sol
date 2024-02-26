// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

import "./Exchange.sol";

contract ExchangeV2 is Exchange {
    function version() public pure returns (string memory) {
        return "V2";
    }
}
