// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "./Exchange.sol";

contract ExchangeV2 is Exchange {
    function version() public pure returns (string memory) {
        return "V2";
    }
}
