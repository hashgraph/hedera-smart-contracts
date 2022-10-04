// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../hts-precompile/IHederaTokenService.sol";
import "./HederaResponseCodes.sol";

library SafeHTS {

    address constant precompileAddress = address(0x167);
    // 90 days in seconds
    uint32 constant defaultAutoRenewPeriod = 7776000;

    error CryptoTransferFailed();
    error MintFailed();
    error BurnFailed();
    error MultipleAssociationsFailed();
    error SingleAssociationFailed();
    error MultipleDissociationsFailed();
    error SingleDissociationFailed();
    error TokensTransferFailed();
    error NFTsTransferFailed();
    error TokenTransferFailed();
    error NFTTransferFailed();
    error CreateFungibleTokenFailed();
    error CreateFungibleTokenWithCustomFeesFailed();
    error CreateNonFungibleTokenFailed();
    error CreateNonFungibleTokenWithCustomFeesFailed();
    error ApproveFailed();
    error AllowanceFailed();
    error NFTApproveFailed();
    error GetApprovedFailed();
    error SetTokenApprovalForAllFailed();
    error IsApprovedForAllFailed();
    error IsFrozenFailed();
    error IsKYCGrantedFailed();
    error TokenDeleteFailed();
    error GetTokenCustomFeesFailed();
    error GetTokenDefaultFreezeStatusFailed();
    error GetTokenDefaultKYCStatusFailed();
    error GetTokenExpiryInfoFailed();
    error GetFungibleTokenInfoFailed();
    error GetTokenInfoFailed();
    error GetTokenKeyFailed();
    error GetNonFungibleTokenInfoFailed();
    error FreezeTokenFailed();
    error UnfreezeTokenFailed();
    error GrantTokenKYCFailed();
    error RevokeTokenKYCFailed();
    error PauseTokenFailed();
    error UnpauseTokenFailed();
    error WipeTokenAccountFailed();
    error WipeTokenAccountNFTFailed();
    error UpdateTokenInfoFailed();
    error UpdateTokenExpiryInfoFailed();
    error UpdateTokenKeysFailed();
    error IsTokenFailed();
    error GetTokenTypeFailed();

    function safeCryptoTransfer(IHederaTokenService.TransferList memory transferList, IHederaTokenService.TokenTransferList[] memory tokenTransfers) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.cryptoTransfer.selector, transferList, tokenTransfers));
        if (!tryDecodeSuccessResponseCode(success, result)) revert CryptoTransferFailed();
    }

    function safeMintToken(address token, uint64 amount, bytes[] memory metadata) external
    returns (uint64 newTotalSupply, int64[] memory serialNumbers) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector,
            token, amount, metadata));
        (responseCode, newTotalSupply, serialNumbers) =
        success
        ? abi.decode(result, (int32, uint64, int64[]))
        : (HederaResponseCodes.UNKNOWN, 0, new int64[](0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert MintFailed();
    }

    function safeBurnToken(address token, uint64 amount, int64[] memory serialNumbers) external
    returns (uint64 newTotalSupply)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.burnToken.selector,
            token, amount, serialNumbers));
        (responseCode, newTotalSupply) =
        success
        ? abi.decode(result, (int32, uint64))
        : (HederaResponseCodes.UNKNOWN, 0);
        if (responseCode != HederaResponseCodes.SUCCESS) revert BurnFailed();
    }

    function safeAssociateTokens(address account, address[] memory tokens) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.associateTokens.selector,
            account, tokens));
        if (!tryDecodeSuccessResponseCode(success, result)) revert MultipleAssociationsFailed();
    }

    function safeAssociateToken(address token, address account) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.associateToken.selector,
            account, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert SingleAssociationFailed();
    }

    function safeDissociateTokens(address account, address[] memory tokens) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.dissociateTokens.selector,
            account, tokens));
        if (!tryDecodeSuccessResponseCode(success, result)) revert MultipleDissociationsFailed();
    }

    function safeDissociateToken(address token, address account) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.dissociateToken.selector,
            account, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert SingleDissociationFailed();
    }

    function safeTransferTokens(address token, address[] memory accountIds, int64[] memory amounts) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferTokens.selector,
            token, accountIds, amounts));
        if (!tryDecodeSuccessResponseCode(success, result)) revert TokensTransferFailed();
    }

    function safeTransferNFTs(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFTs.selector,
            token, sender, receiver, serialNumber));
        if (!tryDecodeSuccessResponseCode(success, result)) revert NFTsTransferFailed();
    }

    function safeTransferToken(address token, address sender, address receiver, int64 amount) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferToken.selector,
            token, sender, receiver, amount));
        if (!tryDecodeSuccessResponseCode(success, result)) revert TokenTransferFailed();
    }

    function safeTransferNFT(address token, address sender, address receiver, int64 serialNumber) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFT.selector,
            token, sender, receiver, serialNumber));
        if (!tryDecodeSuccessResponseCode(success, result)) revert NFTTransferFailed();
    }

    function safeCreateFungibleToken(IHederaTokenService.HederaToken memory token, uint initialTotalSupply,
        uint decimals) external returns (address tokenAddress){
        nonEmptyExpiry(token);
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createFungibleToken.selector,
            token, initialTotalSupply, decimals));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateFungibleTokenFailed();
    }

    function safeCreateFungibleTokenWithCustomFees(IHederaTokenService.HederaToken memory token,
        uint initialTotalSupply,
        uint decimals,
        IHederaTokenService.FixedFee[] memory fixedFees,
        IHederaTokenService.FractionalFee[] memory fractionalFees) external returns
    (address tokenAddress){
        nonEmptyExpiry(token);
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createFungibleTokenWithCustomFees.selector,
            token, initialTotalSupply, decimals, fixedFees, fractionalFees));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateFungibleTokenWithCustomFeesFailed();
    }

    function safeCreateNonFungibleToken(IHederaTokenService.HederaToken memory token) external returns
    (address tokenAddress){
        nonEmptyExpiry(token);
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createNonFungibleToken.selector, token));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateNonFungibleTokenFailed();
    }

    function safeCreateNonFungibleTokenWithCustomFees(IHederaTokenService.HederaToken memory token,
        IHederaTokenService.FixedFee[] memory fixedFees,
        IHederaTokenService.RoyaltyFee[] memory royaltyFees) external returns
    (address tokenAddress){
        nonEmptyExpiry(token);
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createNonFungibleTokenWithCustomFees.selector,
            token, fixedFees, royaltyFees));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert CreateNonFungibleTokenWithCustomFeesFailed();
    }

    function safeApprove(address token, address spender, uint256 amount) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.approve.selector, token, spender, amount));
        if (!tryDecodeSuccessResponseCode(success, result)) revert ApproveFailed();
    }

    function safeAllowance(address token, address owner, address spender) external
    returns (uint256 allowance)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.allowance.selector, token, owner, spender));
        (responseCode, allowance) = success ? abi.decode(result, (int32, uint256)) : (HederaResponseCodes.UNKNOWN, 0);
        if (responseCode != HederaResponseCodes.SUCCESS) revert AllowanceFailed();
    }

    function safeApproveNFT(address token, address approved, int64 serialNumber) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.approveNFT.selector, token, approved, serialNumber));
        if (!tryDecodeSuccessResponseCode(success, result)) revert NFTApproveFailed();
    }

    function safeGetApproved(address token, int64 serialNumber) external
    returns (address approved)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getApproved.selector, token, serialNumber));
        (responseCode, approved) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetApprovedFailed();
    }

    function safeSetApprovalForAll(address token, address operator, bool approved) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.setApprovalForAll.selector, token, operator, approved));
        if (!tryDecodeSuccessResponseCode(success, result)) revert SetTokenApprovalForAllFailed();
    }

    function safeIsApprovedForAll(address token, address owner, address operator) external
    returns (bool approved)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isApprovedForAll.selector, token, owner, operator));
        (responseCode, approved) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsApprovedForAllFailed();
    }

    function safeIsFrozen(address token, address account) external
    returns (bool frozen)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isFrozen.selector, token, account));
        (responseCode, frozen) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsFrozenFailed();
    }

    function safeIsKyc(address token, address account) external
    returns (bool kycGranted)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isKyc.selector, token, account));
        (responseCode, kycGranted) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsKYCGrantedFailed();
    }

    function safeDeleteToken(address token) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.deleteToken.selector, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert TokenDeleteFailed();
    }

    function safeGetTokenCustomFees(address token) external
    returns (IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.FractionalFee[] memory fractionalFees, IHederaTokenService.RoyaltyFee[] memory royaltyFees)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenCustomFees.selector, token));
        (responseCode, fixedFees, fractionalFees, royaltyFees) =
        success
        ? abi.decode(result, (int32, IHederaTokenService.FixedFee[], IHederaTokenService.FractionalFee[], IHederaTokenService.RoyaltyFee[]))
        : (HederaResponseCodes.UNKNOWN, fixedFees, fractionalFees, royaltyFees);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenCustomFeesFailed();
    }

    function safeGetTokenDefaultFreezeStatus(address token) external
    returns (bool defaultFreezeStatus)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenDefaultFreezeStatus.selector, token));
        (responseCode, defaultFreezeStatus) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenDefaultFreezeStatusFailed();
    }

    function safeGetTokenDefaultKycStatus(address token) external
    returns (bool defaultKycStatus)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenDefaultKycStatus.selector, token));
        (responseCode, defaultKycStatus) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenDefaultKYCStatusFailed();
    }

    function safeGetTokenExpiryInfo(address token) external
    returns (IHederaTokenService.Expiry memory expiry)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenExpiryInfo.selector, token));
        (responseCode, expiry) = success ? abi.decode(result, (int32, IHederaTokenService.Expiry)) : (HederaResponseCodes.UNKNOWN, expiry);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenExpiryInfoFailed();
    }

    function safeGetFungibleTokenInfo(address token) external
    returns (IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getFungibleTokenInfo.selector, token));
        (responseCode, fungibleTokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.FungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, fungibleTokenInfo);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetFungibleTokenInfoFailed();
    }

    function safeGetTokenInfo(address token) external
    returns (IHederaTokenService.TokenInfo memory tokenInfo)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenInfo.selector, token));
        (responseCode, tokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.TokenInfo)) : (HederaResponseCodes.UNKNOWN, tokenInfo);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenInfoFailed();
    }

    function safeGetTokenKey(address token, uint keyType) external
    returns (IHederaTokenService.KeyValue memory key)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenKey.selector, token, keyType));
        (responseCode, key) = success ? abi.decode(result, (int32, IHederaTokenService.KeyValue)) : (HederaResponseCodes.UNKNOWN, key);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenKeyFailed();
    }

    function safeGetNonFungibleTokenInfo(address token, int64 serialNumber) external
    returns (IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getNonFungibleTokenInfo.selector, token, serialNumber));
        (responseCode, nonFungibleTokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.NonFungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, nonFungibleTokenInfo);
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetNonFungibleTokenInfoFailed();
    }

    function safeFreezeToken(address token, address account) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.freezeToken.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert FreezeTokenFailed();
    }

    function safeUnfreezeToken(address token, address account) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.unfreezeToken.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UnfreezeTokenFailed();
    }

    function safeGrantTokenKyc(address token, address account) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.grantTokenKyc.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert GrantTokenKYCFailed();
    }

    function safeRevokeTokenKyc(address token, address account) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.revokeTokenKyc.selector, token, account));
        if (!tryDecodeSuccessResponseCode(success, result)) revert RevokeTokenKYCFailed();
    }

    function safePauseToken(address token) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.pauseToken.selector, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert PauseTokenFailed();
    }

    function safeUnpauseToken(address token) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.unpauseToken.selector, token));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UnpauseTokenFailed();
    }

    function safeWipeTokenAccount(address token, address account, uint32 amount) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.wipeTokenAccount.selector, token, account, amount));
        if (!tryDecodeSuccessResponseCode(success, result)) revert WipeTokenAccountFailed();
    }

    function safeWipeTokenAccountNFT(address token, address account, int64[] memory serialNumbers) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.wipeTokenAccountNFT.selector, token, account, serialNumbers));
        if (!tryDecodeSuccessResponseCode(success, result)) revert WipeTokenAccountNFTFailed();
    }

    function safeUpdateTokenInfo(address token, IHederaTokenService.HederaToken memory tokenInfo) external {
        nonEmptyExpiry(tokenInfo);
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenInfo.selector, token, tokenInfo));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UpdateTokenInfoFailed();
    }

    function safeUpdateTokenExpiryInfo(address token, IHederaTokenService.Expiry memory expiryInfo) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenExpiryInfo.selector, token, expiryInfo));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UpdateTokenExpiryInfoFailed();
    }

    function safeUpdateTokenKeys(address token, IHederaTokenService.TokenKey[] memory keys) external {
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenKeys.selector, token, keys));
        if (!tryDecodeSuccessResponseCode(success, result)) revert UpdateTokenKeysFailed();
    }

    function safeIsToken(address token) external
    returns (bool isToken)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isToken.selector, token));
        (responseCode, isToken) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        if (responseCode != HederaResponseCodes.SUCCESS) revert IsTokenFailed();
    }

    function safeGetTokenType(address token) external
    returns (int32 tokenType)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenType.selector, token));
        (responseCode, tokenType) = success ? abi.decode(result, (int32, int32)) : (HederaResponseCodes.UNKNOWN, int32(0));
        if (responseCode != HederaResponseCodes.SUCCESS) revert GetTokenTypeFailed();
    }

    function tryDecodeSuccessResponseCode(bool success, bytes memory result) private pure returns (bool) {
       return (success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN) == HederaResponseCodes.SUCCESS;
    }

    function nonEmptyExpiry(IHederaTokenService.HederaToken memory token) private view
    {
        if (token.expiry.second == 0 && token.expiry.autoRenewPeriod == 0) {
            token.expiry.autoRenewPeriod = defaultAutoRenewPeriod;
            token.expiry.autoRenewAccount = address(this);
        }
    }
}
