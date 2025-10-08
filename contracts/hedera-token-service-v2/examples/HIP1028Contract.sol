// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../HederaResponseCodes.sol";
import "../HederaTokenService.sol";
import "../KeyHelper.sol";
import "../FeeHelper.sol";

contract HIP1028Contract is HederaTokenService, KeyHelper, FeeHelper {
    event TokenAddress(address);
    event TokenInfo(IHederaTokenService.TokenInfo);
    event FungibleTokenInfo(IHederaTokenService.FungibleTokenInfo);
    event NonFungibleTokenInfo(IHederaTokenService.NonFungibleTokenInfo);

    function createTokenWithMetadata(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "testToken";
        token.metadata = bytes(metadata);
        token.symbol = "test";
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](0);

        (int responseCode, address tokenAddress) = HederaTokenService.createFungibleToken(token, 100, 4);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        emit TokenAddress(createdAddress);
    }

    function createTokenWithMetadataAndCustomFees(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "testToken";
        token.metadata = bytes(metadata);
        token.symbol = "test";
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](0);
        IHederaTokenService.FixedFee[] memory fixedFees = createSingleFixedFeeForHbars(10, address(this));
        IHederaTokenService.FractionalFee[] memory fractionalFees = new IHederaTokenService.FractionalFee[](0);
        (int responseCode, address tokenAddress) = HederaTokenService.createFungibleTokenWithCustomFees(token, 100, 8, fixedFees, fractionalFees);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        emit TokenAddress(createdAddress);
    }

    function createTokenWithMetadataAndKey(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "testToken";
        token.metadata = bytes(metadata);
        token.symbol = "test";
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](1);
        IHederaTokenService.TokenKey memory tokenKey = super.getSingleKey(KeyType.METADATA, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys[0] = tokenKey;
        (int responseCode, address tokenAddress) = HederaTokenService.createFungibleToken(token, 100, 4);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        emit TokenAddress(createdAddress);
    }

    function createTokenWithMetadataAndKeyAndCustomFees(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "testToken";
        token.metadata = bytes(metadata);
        token.symbol = "test";
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](2);
        IHederaTokenService.TokenKey memory tokenKey = super.getSingleKey(KeyType.METADATA, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys[0] = tokenKey;
        IHederaTokenService.TokenKey memory adminKey = super.getSingleKey(KeyType.ADMIN, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys[1] = adminKey;
        IHederaTokenService.FixedFee[] memory fixedFees = createSingleFixedFeeForHbars(10, address(this));
        IHederaTokenService.FractionalFee[] memory fractionalFees = new IHederaTokenService.FractionalFee[](0);
        (int responseCode, address tokenAddress) = HederaTokenService.createFungibleTokenWithCustomFees(token, 100, 8, fixedFees, fractionalFees);


        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        emit TokenAddress(createdAddress);
    }

    function createNftWithMetadata(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "nft";
        token.symbol = "nft";
        token.metadata = bytes(metadata);
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](1);
        IHederaTokenService.TokenKey memory tokenSupplyKey = super.getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys[0] = tokenSupplyKey;
        (int responseCode, address tokenAddress) = HederaTokenService.createNonFungibleToken(token);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        emit TokenAddress(createdAddress);
    }

    function createNftWithMetadataAndCustomFees(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "nft";
        token.symbol = "nft";
        token.metadata = bytes(metadata);
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](1);
        IHederaTokenService.TokenKey memory tokenSupplyKey = super.getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys[0] = tokenSupplyKey;
        IHederaTokenService.FixedFee[] memory fixedFees = createSingleFixedFeeForHbars(10, address(this));
        IHederaTokenService.RoyaltyFee[] memory royaltyFees = new IHederaTokenService.RoyaltyFee[](0);
        (int responseCode, address tokenAddress) = HederaTokenService.createNonFungibleTokenWithCustomFees(token, fixedFees, royaltyFees);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        emit TokenAddress(createdAddress);
    }

    function createNftWithMetaAndKey(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "nft";
        token.symbol = "nft";
        token.metadata = bytes(metadata);
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](2);
        IHederaTokenService.TokenKey memory tokenKey = super.getSingleKey(KeyType.METADATA, KeyValueType.CONTRACT_ID, address(this));
        IHederaTokenService.TokenKey memory tokenSupplyKey = super.getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys[0] = tokenKey;
        token.tokenKeys[1] = tokenSupplyKey;
        (int responseCode, address tokenAddress) = HederaTokenService.createNonFungibleToken(token);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        emit TokenAddress(createdAddress);
    }

    function createNftWithMetaAndKeyAndCustomFees(string memory metadata) public payable returns (address createdAddress) {
        IHederaTokenService.HederaToken memory token;
        token.name = "nft";
        token.symbol = "nft";
        token.metadata = bytes(metadata);
        token.treasury = address(this);
        token.tokenKeys = new IHederaTokenService.TokenKey[](3);
        IHederaTokenService.TokenKey memory tokenMetaKey = super.getSingleKey(KeyType.METADATA, KeyValueType.CONTRACT_ID, address(this));
        IHederaTokenService.TokenKey memory tokenSupplyKey = super.getSingleKey(KeyType.SUPPLY, KeyValueType.CONTRACT_ID, address(this));
        IHederaTokenService.TokenKey memory adminKey = super.getSingleKey(KeyType.ADMIN, KeyValueType.CONTRACT_ID, address(this));
        token.tokenKeys[0] = tokenMetaKey;
        token.tokenKeys[1] = tokenSupplyKey;
        token.tokenKeys[2] = adminKey;
        IHederaTokenService.FixedFee[] memory fixedFees = createSingleFixedFeeForHbars(10, address(this));
        IHederaTokenService.RoyaltyFee[] memory royaltyFees = new IHederaTokenService.RoyaltyFee[](0);
        (int responseCode, address tokenAddress) = HederaTokenService.createNonFungibleTokenWithCustomFees(token, fixedFees, royaltyFees);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        createdAddress = tokenAddress;

        HederaTokenService.mintToken(createdAddress, 0, new bytes[](1));

        emit TokenAddress(createdAddress);
    }

    function getInformationForToken(address token) external returns (IHederaTokenService.TokenInfo memory tokenInfo) {
        (int responseCode, IHederaTokenService.TokenInfo memory retrievedTokenInfo) = HederaTokenService.getTokenInfo(token);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }

        tokenInfo = retrievedTokenInfo;

        emit TokenInfo(retrievedTokenInfo);
    }

    function getInformationForFungibleToken(address token) external returns (IHederaTokenService.FungibleTokenInfo memory fungibleTokenInfo) {
        (int responseCode, IHederaTokenService.FungibleTokenInfo memory retrievedTokenInfo) = HederaTokenService.getFungibleTokenInfo(token);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }

        fungibleTokenInfo = retrievedTokenInfo;

        emit FungibleTokenInfo(retrievedTokenInfo);
    }

    function getInformationForNonFungibleToken(address token, int64 serialNumber) external returns (IHederaTokenService.NonFungibleTokenInfo memory nonFungibleTokenInfo) {
        (int responseCode, IHederaTokenService.NonFungibleTokenInfo memory retrievedTokenInfo) = HederaTokenService.getNonFungibleTokenInfo(token, serialNumber);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }

        nonFungibleTokenInfo = retrievedTokenInfo;

        emit NonFungibleTokenInfo(retrievedTokenInfo);
    }

    function updateTokenMetadata(address token, string memory metadata) external {
        IHederaTokenService.HederaToken memory tokenInfo;
        tokenInfo.metadata = bytes(metadata);

        (int256 responseCode) = HederaTokenService.updateTokenInfo(token, tokenInfo);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function updateTokenKeys(address token, address contractID) public {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = getSingleKey(KeyType.METADATA, KeyValueType.CONTRACT_ID, contractID);

        (int256 responseCode) = HederaTokenService.updateTokenKeys(token, keys);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
}
