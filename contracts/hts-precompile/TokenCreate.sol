// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./FeeHelper.sol";

abstract contract TokenCreate is FeeHelper {

    string name = "tokenName";
    string symbol = "tokenSymbol";
    string memo = "memo";
    uint64 initialTotalSupply = 1000;
    int64 maxSupply = 1000;
    uint32 decimals = 8;
    bool freezeDefaultStatus = false;

    event CreatedToken(address tokenAddress);
    event ResponseCode(int responseCode);
    event MintedToken(uint64 newTotalSupply, int64[] serialNumbers);
    event NonFungibleTokenInfo(IHederaTokenService.NonFungibleTokenInfo tokenInfo);
    event TokenInfo(IHederaTokenService.TokenInfo tokenInfo);

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

        (int responseCode, address tokenAddress) =
        HederaTokenService.createNonFungibleToken(token);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }

        emit CreatedToken(tokenAddress);
    }

    function cryptoTransferTokenPublic(address account, address token, int64 amount) public returns (int responseCode) {
        IHederaTokenService.NftTransfer[] memory nftTransfers = new IHederaTokenService.NftTransfer[](0);

        IHederaTokenService.AccountAmount memory accountAmountNegative =
        IHederaTokenService.AccountAmount(msg.sender, - amount, false);
        IHederaTokenService.AccountAmount memory accountAmountPositive =
        IHederaTokenService.AccountAmount(account, amount, false);
        IHederaTokenService.AccountAmount[] memory transfers = new IHederaTokenService.AccountAmount[](2);
        transfers[0] = accountAmountNegative;
        transfers[1] = accountAmountPositive;

        IHederaTokenService.TokenTransferList memory tokenTransfer =
        IHederaTokenService.TokenTransferList(token, transfers, nftTransfers);
        IHederaTokenService.TokenTransferList[] memory tokenTransferList = new IHederaTokenService.TokenTransferList[](1);
        tokenTransferList[0] = tokenTransfer;

        IHederaTokenService.AccountAmount[] memory hbarAccounts; 
        IHederaTokenService.TransferList memory transferList = IHederaTokenService.TransferList(hbarAccounts);

        responseCode = HederaTokenService.cryptoTransfer(transferList, tokenTransferList);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function mintTokenPublic(address token, uint64 amount, bytes[] memory metadata) public
    returns (int responseCode, uint64 newTotalSupply, int64[] memory serialNumbers) {
        (responseCode, newTotalSupply, serialNumbers) = HederaTokenService.mintToken(token, amount, metadata);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit MintedToken(newTotalSupply, serialNumbers);
    }

    function transferNFTPublic(address token, address sender, address receiver, int64 serialNumber) public
    returns (int responseCode)
    {
        responseCode = HederaTokenService.transferNFT(token, sender, receiver, serialNumber);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function associateTokenPublic(address account, address token) public returns (int responseCode) {
        responseCode = HederaTokenService.associateToken(account, token);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function grantTokenKycPublic(address token, address account) external returns (int64 responseCode){
        (responseCode) = this.grantTokenKyc(token, account);

        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function getNonFungibleTokenInfoPublic(address token, int64 serialNumber) public returns (int responseCode, IHederaTokenService.NonFungibleTokenInfo memory tokenInfo) {
        (responseCode, tokenInfo) = HederaTokenService.getNonFungibleTokenInfo(token, serialNumber);

        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit NonFungibleTokenInfo(tokenInfo);
    }

    function getTokenInfoPublic(address token) public returns (int responseCode, IHederaTokenService.TokenInfo memory tokenInfo) {
        (responseCode, tokenInfo) = HederaTokenService.getTokenInfo(token);

        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        emit TokenInfo(tokenInfo);
    }

    function transferTokensPublic(address token, address[] memory accountId, int64[] memory amount) external returns (int256 responseCode) {
        responseCode = HederaTokenService.transferTokens(token, accountId, amount);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function transferNFTsPublic(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) external returns (int256 responseCode) {
        responseCode = HederaTokenService.transferNFTs(token, sender, receiver, serialNumber);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function burnTokenPublic(address token, uint64 amount, int64[] memory serialNumbers) external returns (int256 responseCode, uint64 newTotalSupply) {
        (responseCode, newTotalSupply) = HederaTokenService.burnToken(token, amount, serialNumbers);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function associateTokensPublic(address account, address[] memory tokens) external returns (int256 responseCode) {
        (responseCode) = HederaTokenService.associateTokens(account, tokens);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function dissociateTokensPublic(address account, address[] memory tokens) external returns (int256 responseCode) {
        (responseCode) = HederaTokenService.dissociateTokens(account, tokens);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function dissociateTokenPublic(address account, address token) public returns (int responseCode) {
        responseCode = HederaTokenService.dissociateToken(account, token);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }
}
