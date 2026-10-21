// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@hiero-ledger/hiero-contracts/token-service/HederaTokenService.sol";
import "@hiero-ledger/hiero-contracts/token-service/IHederaTokenService.sol";
import "@hiero-ledger/hiero-contracts/token-service/KeyHelper.sol";

contract CreateHTS is Ownable, KeyHelper, HederaTokenService {
    address public htsTokenAddress;

    constructor(string memory _name, string memory _symbol, address _delegate) payable Ownable(_delegate) {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](2);
        keys[0] = getSingleKey(
            KeyType.ADMIN,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );
        keys[1] = getSingleKey(
            KeyType.SUPPLY,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(0, address(this), 8000000);
        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken(
            _name, _symbol, address(this), "memo", true, 5000, false, keys, expiry
        );

        (int responseCode, address tokenAddress) = HederaTokenService.createFungibleToken(
            token, 1000, int32(int256(uint256(8)))
        );
        require(responseCode == HederaResponseCodes.SUCCESS, "Failed to create HTS token");

        int256 transferResponse = HederaTokenService.transferToken(tokenAddress, address(this), msg.sender, 1000);
        require(transferResponse == HederaResponseCodes.SUCCESS, "HTS: Transfer failed");

        htsTokenAddress = tokenAddress;
    }

    function updateTokenKeysPublic(IHederaTokenService.TokenKey[] memory keys) public returns (int64 responseCode) {
        (responseCode) = HederaTokenService.updateTokenKeys(htsTokenAddress, keys);

        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: Update keys reverted");
    }
}
