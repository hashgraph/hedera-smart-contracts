// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "contracts/system-contracts/hedera-token-service/HederaTokenService.sol";
import "contracts/system-contracts/hedera-token-service/ExpiryHelper.sol";
import "contracts/system-contracts/hedera-token-service/KeyHelper.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TokenCreateOpcodeLogger is HederaTokenService, ExpiryHelper, KeyHelper {

    string name = "tokenName";
    string symbol = "tokenSymbol";
    string memo = "memo";
    int64 initialTotalSupply = 10000;
    int64 maxSupply = 10000;
    int32 decimals = 8;
    bool freezeDefaultStatus = false;

    event ResponseCode(int responseCode);
    event CreatedToken(address tokenAddress);
    event MintedToken(int64 newTotalSupply, int64[] serialNumbers);
    event KycGranted(bool kycGranted);

    function createFungibleTokenPublic(
        address treasury
    ) public payable {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](5);
        keys[0] = getSingleKey(KeyType.ADMIN, KeyType.PAUSE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[1] = getSingleKey(KeyType.KYC, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[2] = getSingleKey(KeyType.FREEZE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[3] = getSingleKey(KeyType.WIPE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[4] = getSingleKey(KeyType.SUPPLY, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));

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


    function createNonFungibleTokenPublic(
        address treasury
    ) public payable {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](5);
        keys[0] = getSingleKey(KeyType.ADMIN, KeyType.PAUSE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[1] = getSingleKey(KeyType.KYC, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[2] = getSingleKey(KeyType.FREEZE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[3] = getSingleKey(KeyType.SUPPLY, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));
        keys[4] = getSingleKey(KeyType.WIPE, KeyValueType.INHERIT_ACCOUNT_KEY, bytes(""));

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(
            0, treasury, 8000000
        );

        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken(
            name, symbol, treasury, memo, true, maxSupply, freezeDefaultStatus, keys, expiry
        );

        (int responseCode, address tokenAddress) = HederaTokenService.createNonFungibleToken(token);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }

        emit CreatedToken(tokenAddress);
    }

    function mintTokenPublic(address token, int64 amount, bytes[] memory metadata) public
    returns (int responseCode, int64 newTotalSupply, int64[] memory serialNumbers)  {
        (responseCode, newTotalSupply, serialNumbers) = HederaTokenService.mintToken(token, amount, metadata);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            if (responseCode == HederaResponseCodes.INVALID_TOKEN_ID) {
                revert(string(abi.encodePacked("Minting reverted with INVALID_TOKEN_ID")));
            } else if (responseCode == HederaResponseCodes.TOKEN_MAX_SUPPLY_REACHED) {
                revert(string(abi.encodePacked("Minting ", Strings.toString((uint256(uint64(amount)))), " tokens reverted with TOKEN_MAX_SUPPLY_REACHED")));
            }

            revert (string(abi.encodePacked("Minting was reverted with responseCode: ", Strings.toString(uint256(responseCode)))));
        }
        emit MintedToken(newTotalSupply, serialNumbers);
    }

    function associateTokenPublic(address account, address token) public returns (int responseCode) {
        responseCode = HederaTokenService.associateToken(account, token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            if (responseCode == HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT) {
                revert(string(abi.encodePacked("Association reverted with TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT")));
            }
            revert ("Default associateTokenPublic() revert reason");
        }
    }
}
