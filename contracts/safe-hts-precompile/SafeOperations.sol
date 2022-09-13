// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./SafeHTS.sol";

contract SafeOperations {

    event TokenCreated(address token);
    event TokenInfoEvent(IHederaTokenService.TokenInfo tokenInfo);
    event FungibleTokenInfoEvent(IHederaTokenService.FungibleTokenInfo fungibleTokenInfo);

    function safeAssociateToken(address sender, address tokenAddress) external {
        SafeHTS.safeAssociateToken(tokenAddress, sender);
    }

    function safeDissociateToken(address sender, address tokenAddress) external {
        SafeHTS.safeDissociateToken(tokenAddress, sender);
    }

    function safeAssociateTokens(address account, address[] memory tokens) external {
        SafeHTS.safeAssociateTokens(account, tokens);
    }

    function safeDissociateTokens(address account, address[] memory tokens) external {
        SafeHTS.safeDissociateTokens(account, tokens);
    }

    function safeTransferTokens(address token, address[] memory accountIds, int64[] memory amounts) external {
        SafeHTS.safeTransferTokens(token, accountIds, amounts);
    }

    function safeTransferNFTs(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) external {
        SafeHTS.safeTransferNFTs(token, sender, receiver, serialNumber);
    }

    function safeTransferToken(address token, address sender, address receiver, int64 amount) external {
        SafeHTS.safeTransferToken(token, sender, receiver, amount);
    }

    function safeTransferNFT(address token, address sender, address receiver, int64 serialNum) external {
        SafeHTS.safeTransferNFT(token, sender, receiver, serialNum);
    }

    function safeCryptoTransfer(IHederaTokenService.TokenTransferList[] memory tokenTransfers) external {
        SafeHTS.safeCryptoTransfer(tokenTransfers);
    }

    function safeMintToken(address token, uint64 amount, bytes[] memory metadata) external
    returns (uint64 newTotalSupply, int64[] memory serialNumbers)
    {
        (newTotalSupply, serialNumbers) = SafeHTS.safeMintToken(token, amount, metadata);
    }

    function safeBurnToken(address token, uint64 amount, int64[] memory serialNumbers) external
    returns (uint64 newTotalSupply)
    {
        (newTotalSupply) = SafeHTS.safeBurnToken(token, amount, serialNumbers);
    }

    function safeCreateFungibleToken() external payable returns (address tokenAddress){
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.treasury = address(this);

        (tokenAddress) = SafeHTS.safeCreateFungibleToken(token, 200, 8);
        emit TokenCreated(tokenAddress);
    }

    function safeCreateFungibleTokenWithCustomFees(
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

    function safeCreateNonFungibleToken() external payable returns (address tokenAddress){
        IHederaTokenService.HederaToken memory token;
        token.name = "tokenName";
        token.symbol = "tokenSymbol";
        token.memo = "memo";
        token.treasury = address(this);
        (tokenAddress) = SafeHTS.safeCreateNonFungibleToken(token);
    }

    function safeCreateNonFungibleTokenWithCustomFees(
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

    function safeApprove(address token, address spender, uint256 amount) external {
        SafeHTS.safeApprove(token, spender, amount);
    }

    function safeAllowance(address token, address owner, address spender) external
    returns (uint256 allowance)
    {
        allowance = SafeHTS.safeAllowance(token, owner, spender);
    }

    function safeApproveNFT(address token, address approved, int64 serialNumber) external {
        SafeHTS.safeApproveNFT(token, approved, serialNumber);
    }

    function safeGetApproved(address token, int64 serialNumber) external
    returns (address approved)
    {
        approved = SafeHTS.safeGetApproved(token, serialNumber);
    }

    function safeSetApprovalForAll(address token, address operator, bool approved) external {
        SafeHTS.safeSetApprovalForAll(token, operator, approved);
    }

    function safeIsApprovedForAll(address token, address owner, address operator) external
    returns (bool approved)
    {
        approved = SafeHTS.safeIsApprovedForAll(token, owner, operator);
    }

    function safeIsFrozen(address token, address account) external
    returns (bool frozen)
    {
       frozen = SafeHTS.safeIsFrozen(token, account);
    }

    function safeIsKyc(address token, address account) external
    returns (bool kycGranted)
    {
       kycGranted = SafeHTS.safeIsKyc(token, account);
    }

    function safeDeleteToken(address token) external {
       SafeHTS.safeDeleteToken(token);
    }

    function safeGetTokenCustomFees(address token) external
    returns (IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.FractionalFee[] memory fractionalFees, IHederaTokenService.RoyaltyFee[] memory royaltyFees)
    {
        (fixedFees, fractionalFees, royaltyFees) = SafeHTS.safeGetTokenCustomFees(token);
    }

    function safeGetTokenDefaultFreezeStatus(address token) external
    returns (bool defaultFreezeStatus)
    {
        defaultFreezeStatus = SafeHTS.safeGetTokenDefaultFreezeStatus(token);
    }

    function safeGetTokenDefaultKycStatus(address token) external
    returns (bool defaultKycStatus)
    {
       defaultKycStatus = SafeHTS.safeGetTokenDefaultKycStatus(token);
    }

    function safeGetTokenExpiryInfo(address token) external
    returns (IHederaTokenService.Expiry memory expiry)
    {
       expiry = SafeHTS.safeGetTokenExpiryInfo(token);
    }

   function safeGetFungibleTokenInfo(address token) external
   returns (IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo)
   {
       fungibleTokenInfo = SafeHTS.safeGetFungibleTokenInfo(token);
       emit FungibleTokenInfoEvent(fungibleTokenInfo);
   }

    function safeGetTokenInfo(address token) external
    returns (IHederaTokenService.TokenInfo memory tokenInfo)
    {
        tokenInfo = SafeHTS.safeGetTokenInfo(token);
        emit TokenInfoEvent(tokenInfo);
    }

    function safeGetTokenKey(address token, uint keyType) external
    returns (IHederaTokenService.KeyValue memory key)
    {
       key = SafeHTS.safeGetTokenKey(token, keyType);
    }

    function safeGetNonFungibleTokenInfo(address token, int64 serialNumber) external
    returns (IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo)
    {
       nonFungibleTokenInfo = SafeHTS.safeGetNonFungibleTokenInfo(token, serialNumber);
    }

    function safeFreezeToken(address token, address account) external {
        SafeHTS.safeFreezeToken(token, account);
    }

    function safeUnfreezeToken(address token, address account) external {
       SafeHTS.safeUnfreezeToken(token, account);
    }

    function safeGrantTokenKyc(address token, address account) external {
       SafeHTS.safeGrantTokenKyc(token, account);
    }

    function safeRevokeTokenKyc(address token, address account) external {
       SafeHTS.safeRevokeTokenKyc(token, account);
    }

    function safePauseToken(address token) external {
       SafeHTS.safePauseToken(token);
    }

    function safeUnpauseToken(address token) external {
       SafeHTS.safeUnpauseToken(token);
    }

    function safeWipeTokenAccount(address token, address account, uint32 amount) external {
        SafeHTS.safeWipeTokenAccount(token, account, amount);
    }

    function safeWipeTokenAccountNFT(address token, address account, int64[] memory serialNumbers) external {
        SafeHTS.safeWipeTokenAccountNFT(token, account, serialNumbers);
    }

    function safeUpdateTokenInfo(address token, IHederaTokenService.HederaToken memory tokenInfo) external {
        SafeHTS.safeUpdateTokenInfo(token, tokenInfo);
    }

    function safeUpdateTokenExpiryInfo(address token, IHederaTokenService.Expiry memory expiryInfo) external {
        SafeHTS.safeUpdateTokenExpiryInfo(token, expiryInfo);
    }

    function safeUpdateTokenKeys(address token, IHederaTokenService.TokenKey[] memory keys) external {
        SafeHTS.safeUpdateTokenKeys(token, keys);
    }

    function safeIsToken(address token) external
    returns (bool isToken)
    {
        isToken = SafeHTS.safeIsToken(token);
    }

    function safeGetTokenType(address token) external
    returns (int32 tokenType)
    {
       tokenType = SafeHTS.safeGetTokenType(token);
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
