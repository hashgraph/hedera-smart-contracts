// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../../HederaTokenService.sol";
import "../../ExpiryHelper.sol";
import "../../KeyHelper.sol";

contract TokenCreateCustomContract is HederaTokenService, ExpiryHelper, KeyHelper {

    event ResponseCode(int responseCode);
    event CreatedToken(address tokenAddress);

    function createFungibleTokenPublic(
        string memory name,
        string memory symbol,
        string memory memo,
        int64 initialTotalSupply,
        int64 maxSupply,
        int32 decimals,
        bool freezeDefaultStatus,
        address treasury,
        bytes memory key
    ) public payable {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](5);
        keys[0] = getSingleKey(KeyType.PAUSE, KeyValueType.SECP256K1, key);
        keys[1] = getSingleKey(KeyType.KYC, KeyValueType.SECP256K1, key);
        keys[2] = getSingleKey(KeyType.FREEZE, KeyValueType.SECP256K1, key);
        keys[3] = getSingleKey(KeyType.SUPPLY, KeyValueType.SECP256K1, key);
        keys[4] = getSingleKey(KeyType.WIPE, KeyValueType.SECP256K1, key);

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(
            0, treasury, 8000000
        );

        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken(
            name, symbol, treasury, memo, true, maxSupply, freezeDefaultStatus, keys, expiry
        );

        (int responseCode, address tokenAddress) =
        HederaTokenService.createFungibleToken(token, initialTotalSupply, decimals);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }

        emit CreatedToken(tokenAddress);
    }
}
