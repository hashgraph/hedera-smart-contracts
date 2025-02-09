// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;


import "../HtsFungibleTokenMintBurn.sol";

contract ExampleHtsFungibleTokenMintBurn is HtsFungibleTokenMintBurn {
    constructor(
        string memory name,
        string memory symbol,
        int64 _initialTotalSupply,
        uint8 _decimals
    ) HtsFungibleTokenMintBurn(name, symbol, _initialTotalSupply, _decimals, msg.sender) payable {}
}
