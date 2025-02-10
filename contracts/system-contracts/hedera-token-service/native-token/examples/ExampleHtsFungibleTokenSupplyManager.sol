// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "../HtsFungibleTokenSupplyManager.sol";

contract ExampleHtsFungibleTokenSupplyManager is HtsFungibleTokenSupplyManager {
    constructor(
        string memory name,
        string memory symbol,
        int64 _initialTotalSupply,
        uint8 _decimals
    ) HtsFungibleTokenSupplyManager(name, symbol, _initialTotalSupply, _decimals, msg.sender) payable {}
}
