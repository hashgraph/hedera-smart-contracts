// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@hiero-ledger/hiero-contracts/token-service/HederaTokenService.sol";
import "@hiero-ledger/hiero-contracts/token-service/IHederaTokenService.sol";
import "@hiero-ledger/hiero-contracts/token-service/KeyHelper.sol";
import "./HTSConnector.sol";

contract ExampleHTSConnector is Ownable, HTSConnector {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) payable HTSConnector(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {}
}
