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

    function safeMintToken(IHederaTokenService token, uint64 amount, bytes[] memory metadata) internal
    returns (uint64 newTotalSupply, int64[] memory serialNumbers) {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.delegatecall(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector,
            token, amount, metadata));
        (responseCode, newTotalSupply, serialNumbers) =
        success
        ? abi.decode(result, (int32, uint64, int64[]))
        : (HederaResponseCodes.UNKNOWN, 0, new int64[](0));
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe mint failed!");
    }

    function safeBurnToken(IHederaTokenService token, uint64 amount, int64[] memory serialNumbers) internal
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

    function safeAssociateToken(IHederaTokenService token, address account) internal {
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

    function safeDissociateToken(IHederaTokenService token, address account) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.dissociateToken.selector,
            account, token));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe single dissociation failed!");
    }

    function safeTransferTokens(IHederaTokenService token, address[] memory accountIds, int64[] memory amounts) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferTokens.selector,
            token, accountIds, amounts));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe tokens transfer failed!");
    }

    function safeTransferNFTs(IHederaTokenService token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferNFTs.selector,
            token, sender, receiver, serialNumber));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe NFTs transfer failed!");
    }

    function safeTransferToken(IHederaTokenService token, address sender, address receiver, int64 amount) internal {
        int32 responseCode;
        (bool success, bytes memory result) = precompileAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferToken.selector,
            token, sender, receiver, amount));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "Safe token transfer failed!");
    }

    function safeTransferNFT(IHederaTokenService token, address sender, address receiver, int64 serialNumber) internal {
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

    modifier nonEmptyExpiry(IHTS.HederaToken memory token)
    {
        if (token.expiry.second == 0 && token.expiry.autoRenewPeriod == 0) {
            token.expiry.autoRenewPeriod = defaultAutoRenewPeriod;
        }
        _;
    }
}
