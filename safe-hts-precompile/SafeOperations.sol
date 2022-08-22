// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./SafeHTS.sol";

contract SafeOperations {

    function safeTokenAssociate(address sender, address tokenAddress) external {
        SafeHTS.safeAssociateToken(tokenAddress, sender);
    }

    function safeTokenDissociate(address sender, address tokenAddress) external {
        SafeHTS.safeDissociateToken(tokenAddress, sender);
    }

    function safeTokensAssociate(address account, address[] memory tokens) external {
        SafeHTS.safeAssociateTokens(account, tokens);
    }

    function safeTokensDissociate(address account, address[] memory tokens) external {
        SafeHTS.safeDissociateTokens(account, tokens);
    }

    function safeTokensTransfer(address token, address[] memory accountIds, int64[] memory amounts) external {
        SafeHTS.safeTransferTokens(token, accountIds, amounts);
    }

    function safeNFTsTransfer(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) external {
        SafeHTS.safeTransferNFTs(token, sender, receiver, serialNumber);
    }

    function safeTokenTransfer(address token, address sender, address receiver, int64 amount) external {
        SafeHTS.safeTransferToken(token, sender, receiver, amount);
    }

    function safeNFTTransfer(address token, address sender, address receiver, int64 serialNum) external {
        SafeHTS.safeTransferNFT(token, sender, receiver, serialNum);
    }

    function safeTransferCrypto(IHederaTokenService.TokenTransferList[] memory tokenTransfers) external {
        SafeHTS.safeCryptoTransfer(tokenTransfers);
    }

    function safeTokenMint(address token, uint64 amount, bytes[] memory metadata) external
    returns (uint64 newTotalSupply, int64[] memory serialNumbers)
    {
        (newTotalSupply, serialNumbers) = SafeHTS.safeMintToken(token, amount, metadata);
    }

    function safeTokenBurn(address token, uint64 amount, int64[] memory serialNumbers) external
    returns (uint64 newTotalSupply)
    {
        (newTotalSupply) = SafeHTS.safeBurnToken(token, amount, serialNumbers);
    }

    function safeCreateOfFungibleToken() external payable returns (address tokenAddress){
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.treasury = address(this);

        (tokenAddress) = SafeHTS.safeCreateFungibleToken(token, 200, 8);
    }

    function safeCreateFungibleOfTokenWithCustomFees(
        address feeCollector,
        address existingTokenAddress)
    external payable returns (address tokenAddress){
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.treasury = address(this);

        IHederaTokenService.FixedFee[] memory fixedFees =
        createFixedFeesWithAllTypes(1, existingTokenAddress, feeCollector);
        IHederaTokenService.FractionalFee[] memory fractionalFees =
        createSingleFractionalFeeWithLimits(4, 5, 10, 30, true, feeCollector);
        (tokenAddress) = SafeHTS.safeCreateFungibleTokenWithCustomFees(token, 200, 8, fixedFees, fractionalFees);
    }

    function safeCreateOfNonFungibleToken() external payable returns (address tokenAddress){
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.memo = "memo";
        token.treasury = address(this);
        (tokenAddress) = SafeHTS.safeCreateNonFungibleToken(token);
    }

    function safeCreateOfNonFungibleTokenWithCustomFees(
        address feeCollector,
        address existingTokenAddress) external payable returns (address tokenAddress){
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.memo = "memo";
        token.treasury = address(this);
        IHederaTokenService.RoyaltyFee[] memory royaltyFees =
        createRoyaltyFeesWithAllTypes(4, 5, 10, existingTokenAddress, feeCollector);
        (tokenAddress) = SafeHTS.safeCreateNonFungibleTokenWithCustomFees(token, new IHederaTokenService.FixedFee[](0), royaltyFees);
    }

    function createRoyaltyFeesWithAllTypes(
        uint32 numerator,
        uint32 denominator,
        uint32 amount,
        address tokenId,
        address feeCollector)
    internal pure returns (IHederaTokenService.RoyaltyFee[] memory royaltyFees) {
        royaltyFees = new IHederaTokenService.RoyaltyFee[](3);
        IHederaTokenService.RoyaltyFee memory royaltyFeeWithoutFallback = createRoyaltyFee(numerator, denominator, feeCollector);
        IHederaTokenService.RoyaltyFee memory royaltyFeeWithFallbackHbar = createRoyaltyFeeWithFallbackFee(numerator, denominator, amount, address(0x0), true, feeCollector);
        IHederaTokenService.RoyaltyFee memory royaltyFeeWithFallbackToken = createRoyaltyFeeWithFallbackFee(numerator, denominator, amount, tokenId, false, feeCollector);
        royaltyFees[0] = royaltyFeeWithoutFallback;
        royaltyFees[1] = royaltyFeeWithFallbackHbar;
        royaltyFees[2] = royaltyFeeWithFallbackToken;
    }

    function createRoyaltyFee(uint32 numerator, uint32 denominator, address feeCollector) internal pure returns (IHederaTokenService.RoyaltyFee memory royaltyFee) {
        royaltyFee.numerator = numerator;
        royaltyFee.denominator = denominator;
        royaltyFee.feeCollector = feeCollector;
    }

    function createRoyaltyFeeWithFallbackFee(uint32 numerator, uint32 denominator, uint32 amount, address tokenId, bool useHbarsForPayment,
        address feeCollector) internal pure returns (IHederaTokenService.RoyaltyFee memory royaltyFee) {
        royaltyFee.numerator = numerator;
        royaltyFee.denominator = denominator;
        royaltyFee.amount = amount;
        royaltyFee.tokenId = tokenId;
        royaltyFee.useHbarsForPayment = useHbarsForPayment;
        royaltyFee.feeCollector = feeCollector;
    }

    function createFixedFeesWithAllTypes(uint32 amount, address tokenId, address feeCollector) internal pure returns (IHederaTokenService.FixedFee[] memory fixedFees) {
        fixedFees = new IHederaTokenService.FixedFee[](3);
        IHederaTokenService.FixedFee memory fixedFeeForToken = createFixedFeeForToken(amount, tokenId, feeCollector);
        IHederaTokenService.FixedFee memory fixedFeeForHbars = createFixedFeeForHbars(amount*2, feeCollector);
        IHederaTokenService.FixedFee memory fixedFeeForCurrentToken = createFixedFeeForCurrentToken(amount*4, feeCollector);
        fixedFees[0] = fixedFeeForToken;
        fixedFees[1] = fixedFeeForHbars;
        fixedFees[2] = fixedFeeForCurrentToken;
    }

    function createFixedFeeForToken(uint32 amount, address tokenId, address feeCollector) internal pure returns (IHederaTokenService.FixedFee memory fixedFee) {
        fixedFee.amount = amount;
        fixedFee.tokenId = tokenId;
        fixedFee.feeCollector = feeCollector;
    }

    function createFixedFeeForHbars(uint32 amount, address feeCollector) internal pure returns (IHederaTokenService.FixedFee memory fixedFee) {
        fixedFee.amount = amount;
        fixedFee.useHbarsForPayment = true;
        fixedFee.feeCollector = feeCollector;
    }

    function createFixedFeeForCurrentToken(uint32 amount, address feeCollector) internal pure returns (IHederaTokenService.FixedFee memory fixedFee) {
        fixedFee.amount = amount;
        fixedFee.useCurrentTokenForPayment = true;
        fixedFee.feeCollector = feeCollector;
    }

    function createSingleFractionalFeeWithLimits(uint32 numerator, uint32 denominator, uint32 minimumAmount, uint32 maximumAmount,
        bool netOfTransfers,  address feeCollector) internal pure returns (IHederaTokenService.FractionalFee[] memory fractionalFees) {
        fractionalFees = new IHederaTokenService.FractionalFee[](1);
        IHederaTokenService.FractionalFee memory fractionalFee = createFractionalFeeWithLimits(numerator, denominator, minimumAmount, maximumAmount, netOfTransfers, feeCollector);
        fractionalFees[0] = fractionalFee;
    }

    function createFractionalFeeWithLimits(uint32 numerator, uint32 denominator, uint32 minimumAmount, uint32 maximumAmount,
        bool netOfTransfers,  address feeCollector) internal pure returns (IHederaTokenService.FractionalFee memory fractionalFee) {
        fractionalFee.numerator = numerator;
        fractionalFee.denominator = denominator;
        fractionalFee.minimumAmount = minimumAmount;
        fractionalFee.maximumAmount = maximumAmount;
        fractionalFee.netOfTransfers = netOfTransfers;
        fractionalFee.feeCollector = feeCollector;
    }
}
