// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../hts-precompile/IHederaTokenService.sol";
import "./HederaResponseCodes.sol";

library SafeHTS {

    address constant precompileAddress = address(0x167);
    // 90 days in seconds
    uint32 constant defaultAutoRenewPeriod = 7776000;

    function safeCryptoTransfer(IHederaTokenService.TokenTransferList[] memory tokenTransfers) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.cryptoTransfer.selector, tokenTransfers));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe crypto transfer failed!");
    }

    function safeMintToken(address token, uint64 amount, bytes[] memory metadata) internal
    returns (uint64 newTotalSupply, int64[] memory serialNumbers) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector,
            token, amount, metadata));
        (responseCode, newTotalSupply, serialNumbers) =
        success
        ? abi.decode(result, (int32, uint64, int64[]))
        : (HederaResponseCodes.UNKNOWN, 0, new int64[](0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe mint failed!");
    }

    function safeBurnToken(address token, uint64 amount, int64[] memory serialNumbers) internal
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
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe burn failed!");
    }

    function safeAssociateTokens(address account, address[] memory tokens) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.associateTokens.selector,
            account, tokens));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe multiple associations failed!");
    }

    function safeAssociateToken(address token, address account) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.associateToken.selector,
            account, token));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe single association failed!");
    }

    function safeDissociateTokens(address account, address[] memory tokens) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.dissociateTokens.selector,
            account, tokens));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe multiple dissociations failed!");
    }

    function safeDissociateToken(address token, address account) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.dissociateToken.selector,
            account, token));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe single dissociation failed!");
    }

    function safeTransferTokens(address token, address[] memory accountIds, int64[] memory amounts) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferTokens.selector,
            token, accountIds, amounts));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe tokens transfer failed!");
    }

    function safeTransferNFTs(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFTs.selector,
            token, sender, receiver, serialNumber));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe NFTs transfer failed!");
    }

    function safeTransferToken(address token, address sender, address receiver, int64 amount) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferToken.selector,
            token, sender, receiver, amount));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe token transfer failed!");
    }

    function safeTransferNFT(address token, address sender, address receiver, int64 serialNumber) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFT.selector,
            token, sender, receiver, serialNumber));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe NFT transfer failed!");
    }

    function safeCreateFungibleToken(IHederaTokenService.HederaToken memory token, uint initialTotalSupply,
        uint decimals) nonEmptyExpiry(token) internal returns (address tokenAddress){
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createFungibleToken.selector,
            token, initialTotalSupply, decimals));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe create fungible token failed!");
    }

    function safeCreateFungibleTokenWithCustomFees(IHederaTokenService.HederaToken memory token,
        uint initialTotalSupply,
        uint decimals,
        IHederaTokenService.FixedFee[] memory fixedFees,
        IHederaTokenService.FractionalFee[] memory fractionalFees) nonEmptyExpiry(token) internal returns
    (address tokenAddress){
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createFungibleTokenWithCustomFees.selector,
            token, initialTotalSupply, decimals, fixedFees, fractionalFees));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe create fungible token with custom fees failed!");
    }

    function safeCreateNonFungibleToken(IHederaTokenService.HederaToken memory token) nonEmptyExpiry(token) internal returns
    (address tokenAddress){
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createNonFungibleToken.selector, token));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe create non fungible token failed!");
    }

    function safeCreateNonFungibleTokenWithCustomFees(IHederaTokenService.HederaToken memory token,
        IHederaTokenService.FixedFee[] memory fixedFees,
        IHederaTokenService.RoyaltyFee[] memory royaltyFees) nonEmptyExpiry(token) internal returns
    (address tokenAddress){
        int responseCode;
        (bool success, bytes memory result) = precompileAddress.call{value: msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createNonFungibleTokenWithCustomFees.selector,
            token, fixedFees, royaltyFees));
        (responseCode, tokenAddress) =
        success
        ? abi.decode(result, (int32, address))
        : (HederaResponseCodes.UNKNOWN, address(0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe create non fungible token with custom fees failed!");
    }

    function safeApprove(address token, address spender, uint256 amount) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.approve.selector, token, spender, amount));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe approve failed!");
    }

    function safeAllowance(address token, address owner, address spender) internal
    returns (uint256 allowance)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.allowance.selector, token, owner, spender));
        (responseCode, allowance) = success ? abi.decode(result, (int32, uint256)) : (HederaResponseCodes.UNKNOWN, 0);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe allowance failed!");
    }

    function safeApproveNFT(address token, address approved, int64 serialNumber) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.approveNFT.selector, token, approved, serialNumber));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe NFT approve failed!");
    }

    function safeGetApproved(address token, int64 serialNumber) internal
    returns (address approved)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getApproved.selector, token, serialNumber));
        (responseCode, approved) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get approved failed!");
    }

    function safeSetApprovalForAll(address token, address operator, bool approved) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.setApprovalForAll.selector, token, operator, approved));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe set token approval for all failed!");
    }

    function safeIsApprovedForAll(address token, address owner, address operator) internal
    returns (bool approved)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isApprovedForAll.selector, token, owner, operator));
        (responseCode, approved) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe is approved for all failed!");
    }

    function safeIsFrozen(address token, address account) internal
    returns (bool frozen)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isFrozen.selector, token, account));
        (responseCode, frozen) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe is frozen failed!");
    }

    function safeIsKyc(address token, address account) internal
    returns (bool kycGranted)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isKyc.selector, token, account));
        (responseCode, kycGranted) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe is KYC granted failed!");
    }

    function safeDeleteToken(address token) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.deleteToken.selector, token));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe token delete failed!");
    }

    function safeGetTokenCustomFees(address token) internal
    returns (IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.FractionalFee[] memory fractionalFees, IHederaTokenService.RoyaltyFee[] memory royaltyFees)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenCustomFees.selector, token));
        (responseCode, fixedFees, fractionalFees, royaltyFees) =
        success
        ? abi.decode(result, (int32, IHederaTokenService.FixedFee[], IHederaTokenService.FractionalFee[], IHederaTokenService.RoyaltyFee[]))
        : (HederaResponseCodes.UNKNOWN, fixedFees, fractionalFees, royaltyFees);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get token custom fees failed!");
    }

    function safeGetTokenDefaultFreezeStatus(address token) internal
    returns (bool defaultFreezeStatus)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenDefaultFreezeStatus.selector, token));
        (responseCode, defaultFreezeStatus) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get token default freeze status failed!");
    }

    function safeGetTokenDefaultKycStatus(address token) internal
    returns (bool defaultKycStatus)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenDefaultKycStatus.selector, token));
        (responseCode, defaultKycStatus) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get token default KYC status failed!");
    }

    function safeGetTokenExpiryInfo(address token) internal
    returns (IHederaTokenService.Expiry memory expiry)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenExpiryInfo.selector, token));
        (responseCode, expiry) = success ? abi.decode(result, (int32, IHederaTokenService.Expiry)) : (HederaResponseCodes.UNKNOWN, expiry);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get token expiry info failed!");
    }

    function safeGetFungibleTokenInfo(address token) internal
    returns (IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getFungibleTokenInfo.selector, token));
        (responseCode, fungibleTokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.FungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, fungibleTokenInfo);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get fungible token info failed!");
    }

    function safeGetTokenInfo(address token) internal
    returns (IHederaTokenService.TokenInfo memory tokenInfo)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenInfo.selector, token));
        (responseCode, tokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.TokenInfo)) : (HederaResponseCodes.UNKNOWN, tokenInfo);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get token info failed!");
    }

    function safeGetTokenKey(address token, uint keyType) internal
    returns (IHederaTokenService.KeyValue memory key)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenKey.selector, token, keyType));
        (responseCode, key) = success ? abi.decode(result, (int32, IHederaTokenService.KeyValue)) : (HederaResponseCodes.UNKNOWN, key);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get token key failed!");
    }

    function safeGetNonFungibleTokenInfo(address token, int64 serialNumber) internal
    returns (IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getNonFungibleTokenInfo.selector, token, serialNumber));
        (responseCode, nonFungibleTokenInfo) = success ? abi.decode(result, (int32, IHederaTokenService.NonFungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, nonFungibleTokenInfo);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get non fungible token info failed!");
    }

    function safeFreezeToken(address token, address account) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.freezeToken.selector, token, account));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe freeze token failed!");
    }

    function safeUnfreezeToken(address token, address account) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.unfreezeToken.selector, token, account));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe unfreeze token failed!");
    }

    function safeGrantTokenKyc(address token, address account) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.grantTokenKyc.selector, token, account));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe grant token KYC failed!");
    }

    function safeRevokeTokenKyc(address token, address account) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.revokeTokenKyc.selector, token, account));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe revoke token KYC failed!");
    }

    function safePauseToken(address token) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.pauseToken.selector, token));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe pause token failed!");
    }

    function safeUnpauseToken(address token) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.unpauseToken.selector, token));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe unpause token failed!");
    }

    function safeWipeTokenAccount(address token, address account, uint32 amount) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.wipeTokenAccount.selector, token, account, amount));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe wipe token account failed!");
    }

    function safeWipeTokenAccountNFT(address token, address account, int64[] memory serialNumbers) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.wipeTokenAccountNFT.selector, token, account, serialNumbers));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe wipe token account NFT failed!");
    }

    function safeUpdateTokenInfo(address token, IHederaTokenService.HederaToken memory tokenInfo) nonEmptyExpiry(tokenInfo) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenInfo.selector, token, tokenInfo));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe update token info failed!");
    }

    function safeUpdateTokenExpiryInfo(address token, IHederaTokenService.Expiry memory expiryInfo) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenExpiryInfo.selector, token, expiryInfo));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe update token expiry info failed!");
    }

    function safeUpdateTokenKeys(address token, IHederaTokenService.TokenKey[] memory keys) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.updateTokenKeys.selector, token, keys));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe update token keys failed!");
    }

    function safeIsToken(address token) internal
    returns (bool isToken)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.isToken.selector, token));
        (responseCode, isToken) = success ? abi.decode(result, (int32, bool)) : (HederaResponseCodes.UNKNOWN, false);
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe isToken failed!");
    }

    function safeGetTokenType(address token) internal
    returns (int32 tokenType)
    {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getTokenType.selector, token));
        (responseCode, tokenType) = success ? abi.decode(result, (int32, int32)) : (HederaResponseCodes.UNKNOWN, int32(0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe get token type failed!");
    }

    modifier nonEmptyExpiry(IHederaTokenService.HederaToken memory token)
    {
        if (token.expiry.second == 0 && token.expiry.autoRenewPeriod == 0) {
            token.expiry.autoRenewPeriod = defaultAutoRenewPeriod;
            token.expiry.autoRenewAccount = address(this);
        }
        _;
    }
}
