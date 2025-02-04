// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import '../../../../contracts/system-contracts/HederaResponseCodes.sol';
import '../../../../contracts/system-contracts/hedera-token-service/KeyHelper.sol';
import './HederaFungibleToken.sol';
import './HederaNonFungibleToken.sol';
import '../../../../contracts/base/NoDelegateCall.sol';
import '../../../../contracts/libraries/Constants.sol';

import '../interfaces/IHtsSystemContractMock.sol';
import '../libraries/HederaTokenValidation.sol';

contract HtsSystemContractMock is NoDelegateCall, KeyHelper, IHtsSystemContractMock {

    error HtsPrecompileError(int64 responseCode);

    /// @dev only for Fungible tokens
    // Fungible token -> FungibleTokenInfo
    mapping(address => FungibleTokenInfo) internal _fungibleTokenInfos;
    // Fungible token -> _isFungible
    mapping(address => bool) internal _isFungible;

    /// @dev only for NonFungibleToken
    // NFT token -> TokenInfo; TokenInfo is used instead of NonFungibleTokenInfo as the former is common to all NFT instances whereas the latter is for a specific NFT instance(uniquely identified by its serialNumber)
    mapping(address => TokenInfo) internal _nftTokenInfos;
    // NFT token -> serialNumber -> PartialNonFungibleTokenInfo
    mapping(address => mapping(int64 => PartialNonFungibleTokenInfo)) internal _partialNonFungibleTokenInfos;
    // NFT token -> _isNonFungible
    mapping(address => bool) internal _isNonFungible;

    /// @dev common to both NFT and Fungible HTS tokens
    // HTS token -> account -> isAssociated
    mapping(address => mapping(address => bool)) internal _association;
    // HTS token -> account -> isKyced
    mapping(address => mapping(address => TokenConfig)) internal _kyc; // is KYCed is the positive case(i.e. explicitly requires KYC approval); see defaultKycStatus
    // HTS token -> account -> isFrozen
    mapping(address => mapping(address => TokenConfig)) internal _unfrozen; // is unfrozen is positive case(i.e. explicitly requires being unfrozen); see freezeDefault
    // HTS token -> keyType -> key address(contractId) e.g. tokenId -> 16 -> 0x123 means that the SUPPLY key for tokenId is account 0x123
    mapping(address => mapping(uint => address)) internal _tokenKeys; /// @dev faster access then getting keys via {FungibleTokenInfo|NonFungibleTokenInfo}#TokenInfo.HederaToken.tokenKeys[]; however only supports KeyValueType.CONTRACT_ID
    // HTS token -> deleted
    mapping(address => bool) internal _tokenDeleted;
    // HTS token -> paused
    mapping(address => TokenConfig) internal _tokenPaused;

    // - - - - - - EVENTS - - - - - -

    // emitted for convenience of having the token address accessible in a Hardhat environment
    event TokenCreated(address indexed token);

    constructor() NoDelegateCall(HTS_PRECOMPILE) {}

    // peripheral internal helpers:
    // Concatenate metadata bytes arrays
    function _concatenate(bytes[] memory metadata) internal pure returns (bytes memory) {
        // Calculate the total length of concatenated bytes
        uint totalLength = 0;
        for (uint i = 0; i < metadata.length; i++) {
            totalLength += metadata[i].length;
        }

        // Create a new bytes variable with the total length
        bytes memory result = new bytes(totalLength);

        // Concatenate bytes from metadata array into result
        uint currentIndex = 0;
        for (uint i = 0; i < metadata.length; i++) {
            for (uint j = 0; j < metadata[i].length; j++) {
                result[currentIndex] = metadata[i][j];
                currentIndex++;
            }
        }

        return result;
    }

    modifier onlyHederaToken() {
        require(_isToken(msg.sender), 'NOT_HEDERA_TOKEN');
        _;
    }

    // Check if the address is a token
    function _isToken(address token) internal view returns (bool) {
        return _isFungible[token] || _isNonFungible[token];
    }

    /// @dev Hedera appears to have phased out authorization from the EOA with https://github.com/hashgraph/hedera-services/releases/tag/v0.36.0
    function _isAccountOriginOrSender(address account) internal view returns (bool) {
        return _isAccountOrigin(account) || _isAccountSender(account);
    }

    function _isAccountOrigin(address account) internal view returns (bool) {
        return account == tx.origin;
    }

    function _isAccountSender(address account) internal view returns (bool) {
        return account == msg.sender;
    }

    // Get the treasury account for a token
    function _getTreasuryAccount(address token) internal view returns (address treasury) {
        if (_isFungible[token]) {
            treasury = _fungibleTokenInfos[token].tokenInfo.token.treasury;
        } else {
            treasury = _nftTokenInfos[token].token.treasury;
        }
    }

    // Check if the treasury signature is valid
    function _hasTreasurySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getTreasuryAccount(token);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    // Check if the admin key signature is valid
    function _hasAdminKeySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getKey(token, KeyHelper.KeyType.ADMIN);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    // Check if the kyc key signature is valid
    function _hasKycKeySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getKey(token, KeyHelper.KeyType.KYC);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    // Check if the freeze key signature is valid
    function _hasFreezeKeySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getKey(token, KeyHelper.KeyType.FREEZE);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    // Check if the wipe key signature is valid
    function _hasWipeKeySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getKey(token, KeyHelper.KeyType.WIPE);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    // Check if the supply key signature is valid
    function _hasSupplyKeySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getKey(token, KeyHelper.KeyType.SUPPLY);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    // Check if the fee schedule key signature is valid
    function _hasFeeScheduleKeySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getKey(token, KeyHelper.KeyType.FEE);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    // Check if the pause key signature is valid
    function _hasPauseKeySig(address token) internal view returns (bool validKey, bool noKey) {
        address key = _getKey(token, KeyHelper.KeyType.PAUSE);
        noKey = key == ADDRESS_ZERO;
        validKey = _isAccountSender(key);
    }

    function _setFungibleTokenInfoToken(address token, HederaToken memory hederaToken) internal {
        _fungibleTokenInfos[token].tokenInfo.token.name = hederaToken.name;
        _fungibleTokenInfos[token].tokenInfo.token.symbol = hederaToken.symbol;
        _fungibleTokenInfos[token].tokenInfo.token.treasury = hederaToken.treasury;
        _fungibleTokenInfos[token].tokenInfo.token.memo = hederaToken.memo;
        _fungibleTokenInfos[token].tokenInfo.token.tokenSupplyType = hederaToken.tokenSupplyType;
        _fungibleTokenInfos[token].tokenInfo.token.maxSupply = hederaToken.maxSupply;
        _fungibleTokenInfos[token].tokenInfo.token.freezeDefault = hederaToken.freezeDefault;
    }

    function _setFungibleTokenExpiry(address token, Expiry memory expiryInfo) internal {
        _fungibleTokenInfos[token].tokenInfo.token.expiry.second = expiryInfo.second;
        _fungibleTokenInfos[token].tokenInfo.token.expiry.autoRenewAccount = expiryInfo.autoRenewAccount;
        _fungibleTokenInfos[token].tokenInfo.token.expiry.autoRenewPeriod = expiryInfo.autoRenewPeriod;
    }

    function _setFungibleTokenInfo(address token, TokenInfo memory tokenInfo) internal {
        _fungibleTokenInfos[token].tokenInfo.totalSupply = tokenInfo.totalSupply;
        _fungibleTokenInfos[token].tokenInfo.deleted = tokenInfo.deleted;
        _fungibleTokenInfos[token].tokenInfo.defaultKycStatus = tokenInfo.defaultKycStatus;
        _fungibleTokenInfos[token].tokenInfo.pauseStatus = tokenInfo.pauseStatus;
        _fungibleTokenInfos[token].tokenInfo.ledgerId = tokenInfo.ledgerId;

        // TODO: Handle copying of other arrays (fixedFees, fractionalFees, and royaltyFees) if needed
    }

    function _setFungibleTokenKeys(address token, TokenKey[] memory tokenKeys) internal {

        // Copy the tokenKeys array
        uint256 length = tokenKeys.length;
        for (uint256 i = 0; i < length; i++) {
            TokenKey memory tokenKey = tokenKeys[i];
            _fungibleTokenInfos[token].tokenInfo.token.tokenKeys.push(tokenKey);

            /// @dev contractId can in fact be any address including an EOA address
            ///      The KeyHelper lists 5 types for KeyValueType; however only CONTRACT_ID is considered
            _tokenKeys[token][tokenKey.keyType] = tokenKey.key.contractId;
        }

    }

    function _setFungibleTokenInfo(FungibleTokenInfo memory fungibleTokenInfo) internal returns (address treasury) {
        address tokenAddress = msg.sender;
        treasury = fungibleTokenInfo.tokenInfo.token.treasury;

        _setFungibleTokenInfoToken(tokenAddress, fungibleTokenInfo.tokenInfo.token);
        _setFungibleTokenExpiry(tokenAddress, fungibleTokenInfo.tokenInfo.token.expiry);
        _setFungibleTokenKeys(tokenAddress, fungibleTokenInfo.tokenInfo.token.tokenKeys);
        _setFungibleTokenInfo(tokenAddress, fungibleTokenInfo.tokenInfo);

        _fungibleTokenInfos[tokenAddress].decimals = fungibleTokenInfo.decimals;
    }

    function _setNftTokenInfoToken(address token, HederaToken memory hederaToken) internal {
        _nftTokenInfos[token].token.name = hederaToken.name;
        _nftTokenInfos[token].token.symbol = hederaToken.symbol;
        _nftTokenInfos[token].token.treasury = hederaToken.treasury;
        _nftTokenInfos[token].token.memo = hederaToken.memo;
        _nftTokenInfos[token].token.tokenSupplyType = hederaToken.tokenSupplyType;
        _nftTokenInfos[token].token.maxSupply = hederaToken.maxSupply;
        _nftTokenInfos[token].token.freezeDefault = hederaToken.freezeDefault;
    }

    function _setNftTokenExpiry(address token, Expiry memory expiryInfo) internal {
        _nftTokenInfos[token].token.expiry.second = expiryInfo.second;
        _nftTokenInfos[token].token.expiry.autoRenewAccount = expiryInfo.autoRenewAccount;
        _nftTokenInfos[token].token.expiry.autoRenewPeriod = expiryInfo.autoRenewPeriod;
    }


    function _setNftTokenInfo(address token, TokenInfo memory nftTokenInfo) internal {
        _nftTokenInfos[token].totalSupply = nftTokenInfo.totalSupply;
        _nftTokenInfos[token].deleted = nftTokenInfo.deleted;
        _nftTokenInfos[token].defaultKycStatus = nftTokenInfo.defaultKycStatus;
        _nftTokenInfos[token].pauseStatus = nftTokenInfo.pauseStatus;
        _nftTokenInfos[token].ledgerId = nftTokenInfo.ledgerId;

        // TODO: Handle copying of other arrays (fixedFees, fractionalFees, and royaltyFees) if needed
    }

    function _setNftTokenKeys(address token, TokenKey[] memory tokenKeys) internal {
        // Copy the tokenKeys array
        uint256 length = tokenKeys.length;
        for (uint256 i = 0; i < length; i++) {
            TokenKey memory tokenKey = tokenKeys[i];
            _nftTokenInfos[token].token.tokenKeys.push(tokenKey);

            /// @dev contractId can in fact be any address including an EOA address
            ///      The KeyHelper lists 5 types for KeyValueType; however only CONTRACT_ID is considered
            _tokenKeys[token][tokenKey.keyType] = tokenKey.key.contractId;
        }
    }

    function _setNftTokenInfo(TokenInfo memory nftTokenInfo) internal returns (address treasury) {
        address tokenAddress = msg.sender;
        treasury = nftTokenInfo.token.treasury;

        _setNftTokenInfoToken(tokenAddress, nftTokenInfo.token);
        _setNftTokenKeys(tokenAddress, nftTokenInfo.token.tokenKeys);
        _setNftTokenExpiry(tokenAddress, nftTokenInfo.token.expiry);
        _setNftTokenInfo(tokenAddress, nftTokenInfo);
    }

    // TODO: implement _post{Action} "internal" functions called inside and at the end of the pre{Action} functions is success == true
    // for getters implement _get{Data} "view internal" functions that have the exact same name as the HTS getter function name that is called after the precheck

    function _precheckCreateToken(
        address sender,
        HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals
    ) internal view returns (int64 responseCode) {
        bool validTreasurySig = sender == token.treasury;

        // if admin key is specified require admin sig
        KeyValue memory key = _getTokenKey(token.tokenKeys, _getKeyTypeValue(KeyHelper.KeyType.ADMIN));

        if (key.contractId != ADDRESS_ZERO) {
            if (sender != key.contractId) {
                return HederaResponseCodes.INVALID_ADMIN_KEY;
            }
        }

        for (uint256 i = 0; i < token.tokenKeys.length; i++) {
            TokenKey memory tokenKey = token.tokenKeys[i];

            if (tokenKey.key.contractId != ADDRESS_ZERO) {
                bool accountExists = _doesAccountExist(tokenKey.key.contractId);

                if (!accountExists) {

                    if (tokenKey.keyType == 1) { // KeyType.ADMIN
                        return HederaResponseCodes.INVALID_ADMIN_KEY;
                    }

                    if (tokenKey.keyType == 2) { // KeyType.KYC
                        return HederaResponseCodes.INVALID_KYC_KEY;
                    }

                    if (tokenKey.keyType == 4) { // KeyType.FREEZE
                        return HederaResponseCodes.INVALID_FREEZE_KEY;
                    }

                    if (tokenKey.keyType == 8) { // KeyType.WIPE
                        return HederaResponseCodes.INVALID_WIPE_KEY;
                    }

                    if (tokenKey.keyType == 16) { // KeyType.SUPPLY
                        return HederaResponseCodes.INVALID_SUPPLY_KEY;
                    }

                    if (tokenKey.keyType == 32) { // KeyType.FEE
                        return HederaResponseCodes.INVALID_CUSTOM_FEE_SCHEDULE_KEY;
                    }

                    if (tokenKey.keyType == 64) { // KeyType.PAUSE
                        return HederaResponseCodes.INVALID_PAUSE_KEY;
                    }
                }
            }
        }

        // TODO: add additional validation on token; validation most likely required on only tokenKeys(if an address(contract/EOA) has a zero-balance then consider the tokenKey invalid since active accounts on Hedera must have a positive HBAR balance)
        if (!validTreasurySig) {
            return HederaResponseCodes.AUTHORIZATION_FAILED;
        }

        if (decimals < 0 || decimals > 18) {
            return HederaResponseCodes.INVALID_TOKEN_DECIMALS;
        }

        if (initialTotalSupply < 0) {
            return HederaResponseCodes.INVALID_TOKEN_INITIAL_SUPPLY;
        }

        uint256 tokenNameLength = _getStringLength(token.name);
        uint256 tokenSymbolLength = _getStringLength(token.symbol);

        if (tokenNameLength == 0) {
            return HederaResponseCodes.MISSING_TOKEN_NAME;
        }

        // TODO: investigate correctness of max length conditionals
        // solidity strings use UTF-8 encoding, Hedera restricts the name and symbol to 100 bytes
        // in ASCII that is 100 characters
        // however in UTF-8 it is 100/4 = 25 UT-8 characters
        if (tokenNameLength > 100) {
            return HederaResponseCodes.TOKEN_NAME_TOO_LONG;
        }

        if (tokenSymbolLength == 0) {
            return HederaResponseCodes.MISSING_TOKEN_SYMBOL;
        }

        if (tokenSymbolLength > 100) {
            return HederaResponseCodes.TOKEN_SYMBOL_TOO_LONG;
        }

        return HederaResponseCodes.SUCCESS;
    }

    function _precheckDeleteToken(address sender, address token) internal view returns (bool success, int64 responseCode) {

        /// @dev success is initialised to true such that the sequence of any of the validation functions below can be easily rearranged
        ///      the rearrangement of the functions may be done to more closely align the response codes with the actual response codes returned by Hedera
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (bool validKey, bool noKey) = _hasAdminKeySig(token);
        (success, responseCode) = success ? HederaTokenValidation._validateAdminKey(validKey, noKey) : (success, responseCode);
    }

    /// @dev handles precheck logic for both freeze and unfreeze
    function _precheckFreezeToken(address sender, address token, address account) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (bool validKey, bool noKey) = _hasFreezeKeySig(token);
        (success, responseCode) = success ? HederaTokenValidation._validateFreezeKey(validKey, noKey) : (success, responseCode);
    }

    /// @dev handles precheck logic for both pause and unpause
    function _precheckPauseToken(address sender, address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (bool validKey, bool noKey) = _hasPauseKeySig(token);
        (success, responseCode) = success ? HederaTokenValidation._validatePauseKey(validKey, noKey) : (success, responseCode);
    }

    /// @dev handles precheck logic for both kyc grant and revoke
    function _precheckKyc(address sender, address token, address account) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateKycKey(token) : (success, responseCode);
    }

    function _precheckUpdateTokenExpiryInfo(address sender, address token, Expiry memory expiryInfo) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateAdminKey(token) : (success, responseCode);
        // TODO: validate expiryInfo; move validation into common HederaTokenValidation contract that exposes validation functions
    }

    function _precheckUpdateTokenInfo(address sender, address token, HederaToken memory tokenInfo) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateAdminKey(token) : (success, responseCode);
        // TODO: validate tokenInfo; move validation into common HederaTokenValidation contract that exposes validation functions
    }

    function _precheckUpdateTokenKeys(address sender, address token, TokenKey[] memory keys) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateAdminKey(token) : (success, responseCode);
        // TODO: validate keys; move validation into common HederaTokenValidation contract that exposes validation functions
    }

    function _validateAdminKey(address token) internal view returns (bool success, int64 responseCode) {
        (bool validKey, bool noKey) = _hasAdminKeySig(token);
        (success, responseCode) = HederaTokenValidation._validateAdminKey(validKey, noKey);
    }

    function _validateKycKey(address token) internal view returns (bool success, int64 responseCode) {
        (bool validKey, bool noKey) = _hasKycKeySig(token);
        (success, responseCode) = HederaTokenValidation._validateKycKey(validKey, noKey);
    }

    function _validateSupplyKey(address token) internal view returns (bool success, int64 responseCode) {
        (bool validKey, bool noKey) = _hasSupplyKeySig(token);
        (success, responseCode) = HederaTokenValidation._validateSupplyKey(validKey, noKey);
    }

    function _validateFreezeKey(address token) internal view returns (bool success, int64 responseCode) {
        (bool validKey, bool noKey) = _hasFreezeKeySig(token);
        (success, responseCode) = HederaTokenValidation._validateFreezeKey(validKey, noKey);
    }

    function _validateTreasuryKey(address token) internal view returns (bool success, int64 responseCode) {
        (bool validKey, bool noKey) = _hasTreasurySig(token);
        (success, responseCode) = HederaTokenValidation._validateTreasuryKey(validKey, noKey);
    }

    function _validateWipeKey(address token) internal view returns (bool success, int64 responseCode) {
        (bool validKey, bool noKey) = _hasWipeKeySig(token);
        (success, responseCode) = HederaTokenValidation._validateWipeKey(validKey, noKey);
    }

    function _validateAccountKyc(address token, address account) internal view returns (bool success, int64 responseCode) {
        bool isKyced;
        (responseCode, isKyced) = isKyc(token, account);
        success = _doesAccountPassKyc(responseCode, isKyced);
        (success, responseCode) = HederaTokenValidation._validateAccountKyc(success);
    }

    function _validateAccountUnfrozen(address token, address account) internal view returns (bool success, int64 responseCode) {
        bool isAccountFrozen;
        (responseCode, isAccountFrozen) = isFrozen(token, account);
        success = _doesAccountPassUnfrozen(responseCode, isAccountFrozen);
        (success, responseCode) = success ? HederaTokenValidation._validateAccountFrozen(success) : (success, responseCode);
    }

    /// @dev the following internal _precheck functions are called in either of the following 2 scenarios:
    ///      1. before the HtsSystemContractMock calls any of the HederaFungibleToken or HederaNonFungibleToken functions that specify the onlyHtsPrecompile modifier
    ///      2. in any of HtsSystemContractMock functions that specifies the onlyHederaToken modifier which is only callable by a HederaFungibleToken or HederaNonFungibleToken contract

    /// @dev for both Fungible and NonFungible
    function _precheckApprove(
        address token,
        address sender, // sender should be owner in order to approve
        address spender,
        uint256 amountOrSerialNumber /// for Fungible is the amount and for NonFungible is the serialNumber
    ) internal view returns (bool success, int64 responseCode) {

        success = true;

        /// @dev Hedera does not require an account to be associated with a token in be approved an allowance
        // if (!_association[token][owner] || !_association[token][spender]) {
        //     return HederaResponseCodes.TOKEN_NOT_ASSOCIATED_TO_ACCOUNT;
        // }

        (success, responseCode) = success ? _validateAccountKyc(token, sender) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountKyc(token, spender) : (success, responseCode);

        (success, responseCode) = success ? _validateAccountUnfrozen(token, sender) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountUnfrozen(token, spender) : (success, responseCode);

        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateNftOwnership(token, sender, amountOrSerialNumber, _isNonFungible, _partialNonFungibleTokenInfos) : (success, responseCode);
    }

    function _precheckSetApprovalForAll(
        address token,
        address owner,
        address operator,
        bool approved
    ) internal view returns (bool success, int64 responseCode) {

        success = true;

        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);

        (success, responseCode) = success ? HederaTokenValidation._validateTokenAssociation(token, owner, _association) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateTokenAssociation(token, operator, _association) : (success, responseCode);

        (success, responseCode) = success ? _validateAccountKyc(token, owner) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountKyc(token, operator) : (success, responseCode);

        (success, responseCode) = success ? _validateAccountUnfrozen(token, owner) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountUnfrozen(token, operator) : (success, responseCode);

        (success, responseCode) = success ? HederaTokenValidation._validateIsNonFungible(token, _isNonFungible) : (success, responseCode);
    }

    function _precheckMint(
        address token,
        int64 amount,
        bytes[] memory metadata
    ) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateSupplyKey(token) : (success, responseCode);
    }

    // TODO: implement multiple NFTs being burnt instead of just index 0
    function _precheckBurn(
        address token,
        int64 amount,
        int64[] memory serialNumbers // since only 1 NFT can be burnt at a time; expect length to be 1
    ) internal view returns (bool success, int64 responseCode) {
        success = true;

        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateTreasuryKey(token) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateTokenSufficiency(token, _getTreasuryAccount(token), amount, serialNumbers[0], _isFungible, _isNonFungible, _partialNonFungibleTokenInfos) : (success, responseCode);
    }

    // TODO: implement multiple NFTs being wiped, instead of just index 0
    function _precheckWipe(
        address sender,
        address token,
        address account,
        int64 amount,
        int64[] memory serialNumbers // since only 1 NFT can be wiped at a time; expect length to be 1
    ) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validBurnInput(token, _isFungible, _isNonFungible, amount, serialNumbers) : (success, responseCode);
        (success, responseCode) = success ? _validateWipeKey(token) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateTokenSufficiency(token, account, amount, serialNumbers[0], _isFungible, _isNonFungible, _partialNonFungibleTokenInfos) : (success, responseCode);
    }

    function _precheckGetApproved(
        address token,
        uint256 serialNumber
    ) internal view returns (bool success, int64 responseCode) {
        // TODO: do additional validation that serialNumber exists and is not burnt
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetFungibleTokenInfo(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateIsFungible(token, _isFungible) : (success, responseCode);
    }

    function _precheckGetNonFungibleTokenInfo(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateIsNonFungible(token, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetTokenCustomFees(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetTokenDefaultFreezeStatus(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetTokenDefaultKycStatus(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetTokenExpiryInfo(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetTokenInfo(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetTokenKey(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckGetTokenType(address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckIsFrozen(address token, address account) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateFreezeKey(token) : (success, responseCode);
    }

    function _precheckIsKyc(address token, address account) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? _validateKycKey(token) : (success, responseCode);
    }

    function _precheckAllowance(
        address token,
        address owner,
        address spender
    ) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
    }

    function _precheckAssociateToken(address account, address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);

        // TODO: consider extending HederaTokenValidation#_validateTokenAssociation with TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT
        if (success) {
            if (_association[token][account]) {
                return (false, HederaResponseCodes.TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT);
            }
        }

    }

    function _precheckDissociateToken(address account, address token) internal view returns (bool success, int64 responseCode) {
        success = true;
        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateTokenAssociation(token, account, _association) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateTokenDissociation(token, account, _association, _isFungible, _isNonFungible) : (success, responseCode);
    }

    /// @dev doesPassKyc if KYC is not enabled or if enabled then account is KYCed explicitly or by default
    function _doesAccountPassKyc(int64 responseCode, bool isKyced) internal pure returns (bool doesPassKyc) {
        doesPassKyc = responseCode == HederaResponseCodes.SUCCESS ? isKyced : true;
    }

    /// @dev doesPassUnfrozen if freeze is not enabled or if enabled then account is unfrozen explicitly or by default
    function _doesAccountPassUnfrozen(int64 responseCode, bool isFrozen) internal pure returns (bool doesPassUnfrozen) {
        doesPassUnfrozen = responseCode == HederaResponseCodes.SUCCESS ? !isFrozen : true;
    }

    function _precheckTransfer(
        address token,
        address spender,
        address from,
        address to,
        uint256 amountOrSerialNumber
    ) internal view returns (bool success, int64 responseCode, bool isRequestFromOwner) {

        success = true;

        (success, responseCode) = success ? HederaTokenValidation._validateToken(token, _tokenDeleted, _isFungible, _isNonFungible) : (success, responseCode);

        (success, responseCode) = success ? HederaTokenValidation._validateTokenAssociation(token, from, _association) : (success, responseCode);
        (success, responseCode) = success ? HederaTokenValidation._validateTokenAssociation(token, to, _association) : (success, responseCode);

        (success, responseCode) = success ? _validateAccountKyc(token, spender) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountKyc(token, from) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountKyc(token, to) : (success, responseCode);

        (success, responseCode) = success ? _validateAccountUnfrozen(token, spender) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountUnfrozen(token, from) : (success, responseCode);
        (success, responseCode) = success ? _validateAccountUnfrozen(token, to) : (success, responseCode);

        // If transfer request is not from owner then check allowance of msg.sender
        bool shouldAssumeRequestFromOwner = spender == ADDRESS_ZERO;
        isRequestFromOwner = _isAccountSender(from) || shouldAssumeRequestFromOwner;

        (success, responseCode) = success ? HederaTokenValidation._validateTokenSufficiency(token, from, amountOrSerialNumber, amountOrSerialNumber, _isFungible, _isNonFungible, _partialNonFungibleTokenInfos) : (success, responseCode);

        if (isRequestFromOwner || !success) {
            return (success, responseCode, isRequestFromOwner);
        }

        (success, responseCode) = success ? HederaTokenValidation._validateApprovalSufficiency(token, spender, from, amountOrSerialNumber, _isFungible, _isNonFungible) : (success, responseCode);

        return (success, responseCode, isRequestFromOwner);
    }

    function _postTransfer(
        address token,
        address spender,
        address from,
        address to,
        uint256 amountOrSerialNumber
    ) internal {
        if (_isNonFungible[token]) {
            int64 serialNumber = int64(uint64(amountOrSerialNumber));
            _partialNonFungibleTokenInfos[token][serialNumber].ownerId = to;
            delete _partialNonFungibleTokenInfos[token][serialNumber].spenderId;
        }
    }

    function _postAssociate(
        address token,
        address sender
    ) internal {
        _association[token][sender] = true;
    }

    function _postDissociate(
        address token,
        address sender
    ) internal {
        _association[token][sender] = false;
    }

    function _postIsAssociated(
        address token,
        address sender
    ) internal view returns (bool associated) {
        associated = _association[token][sender];
    }

    function _postApprove(
        address token,
        address sender,
        address spender,
        uint256 amountOrSerialNumber
    ) internal {
        if (_isNonFungible[token]) {
            int64 serialNumber = int64(uint64(amountOrSerialNumber));
            _partialNonFungibleTokenInfos[token][serialNumber].spenderId = spender;
        }
    }

    function _postMint(
        address token,
        int64 amountOrSerialNumber,
        bytes[] memory metadata
    ) internal {
        if (_isNonFungible[token]) {
            _partialNonFungibleTokenInfos[token][amountOrSerialNumber] = PartialNonFungibleTokenInfo({
                ownerId: _getTreasuryAccount(token),
                creationTime: int64(int(block.timestamp)),
                metadata: _concatenate(metadata),
                spenderId: ADDRESS_ZERO
            });
        }
    }

    function _postBurn(
        address token,
        int64 amount,
        int64[] memory serialNumbers
    ) internal {
        if (_isNonFungible[token]) {
            int64 serialNumber;
            uint burnCount = serialNumbers.length;
            for (uint256 i = 0; i < burnCount; i++) {
                serialNumber = serialNumbers[i];
                delete _partialNonFungibleTokenInfos[token][serialNumber].ownerId;
                delete _partialNonFungibleTokenInfos[token][serialNumber].spenderId;

                // TODO: remove the break statement below once multiple NFT burns are enabled in a single call
                break; // only delete the info at index 0 since only 1 NFT is burnt at a time
            }
        }
    }

    function preAssociate(
        address sender // msg.sender in the context of the Hedera{Non|}FungibleToken; it should be owner for SUCCESS
    ) external onlyHederaToken returns (int64 responseCode) {
        address token = msg.sender;
        bool success;
        (success, responseCode) = _precheckAssociateToken(sender, token);
        if (success) {
            _postAssociate(token, sender);
        }
    }

    function preIsAssociated(
        address sender // msg.sender in the context of the Hedera{Non|}FungibleToken; it should be owner for SUCCESS
    ) external view onlyHederaToken returns (bool associated) {
        address token = msg.sender;
        int64 responseCode;
        bool success;
        (success, responseCode) = _precheckAssociateToken(sender, token);
        if (success) {
            associated = _postIsAssociated(token, sender);
        }
    }

    function preDissociate(
        address sender // msg.sender in the context of the Hedera{Non|}FungibleToken; it should be owner for SUCCESS
    ) external onlyHederaToken returns (int64 responseCode) {
        address token = msg.sender;
        bool success;
        (success, responseCode) = _precheckDissociateToken(sender, token);
        if (success) {
            _postDissociate(token, sender);
        }
    }

    function preApprove(
        address sender, // msg.sender in the context of the Hedera{Non|}FungibleToken; it should be owner for SUCCESS
        address spender,
        uint256 amountOrSerialNumber /// for Fungible is the amount and for NonFungible is the serialNumber
    ) external onlyHederaToken returns (int64 responseCode) {
        address token = msg.sender;
        bool success;
        (success, responseCode) = _precheckApprove(token, sender, spender, amountOrSerialNumber);
        if (success) {
            _postApprove(token, sender, spender, amountOrSerialNumber);
        }
    }

    function preSetApprovalForAll(
        address sender, // msg.sender in the context of the Hedera{Non|}FungibleToken; it should be owner for SUCCESS
        address operator,
        bool approved
    ) external onlyHederaToken returns (int64 responseCode) {
        address token = msg.sender;
        bool success;
        (success, responseCode) = _precheckSetApprovalForAll(token, sender, operator, approved);
    }

    /// @dev not currently called by Hedera{}Token
    function preMint(
        address token,
        int64 amount,
        bytes[] memory metadata
    ) external onlyHederaToken returns (int64 responseCode) {
        address token = msg.sender;
        bool success;
        (success, responseCode) = _precheckMint(token, amount, metadata);

        if (success) {

            int64 amountOrSerialNumber;

            if (_isFungible[token]) {
                amountOrSerialNumber = amount;
            } else {
                amountOrSerialNumber = HederaNonFungibleToken(token).mintCount() + 1;
            }

            _postMint(token, amountOrSerialNumber, metadata);
        }
    }

    /// @dev not currently called by Hedera{}Token
    function preBurn(int64 amount, int64[] memory serialNumbers) external onlyHederaToken returns (int64 responseCode) {
        address token = msg.sender;
        bool success;
        (success, responseCode) = _precheckBurn(token, amount, serialNumbers);

        if (success) {
            _postBurn(token, amount, serialNumbers);
        }
    }

    function preTransfer(
        address spender, /// @dev if spender == ADDRESS_ZERO then assume ERC20#transfer(i.e. msg.sender is attempting to spend their balance) otherwise ERC20#transferFrom(i.e. msg.sender is attempting to spend balance of "from" using allowance)
        address from,
        address to,
        uint256 amountOrSerialNumber
    ) external onlyHederaToken returns (int64 responseCode) {
        address token = msg.sender;
        bool success;
        (success, responseCode, ) = _precheckTransfer(token, spender, from, to, amountOrSerialNumber);
        if (success) {
            _postTransfer(token, spender, from, to, amountOrSerialNumber);
        }
    }

    /// @dev register HederaFungibleToken; msg.sender is the HederaFungibleToken
    ///      can be called by any contract; however assumes msg.sender is a HederaFungibleToken
    function registerHederaFungibleToken(address caller, FungibleTokenInfo memory fungibleTokenInfo) external {

        /// @dev if caller is this contract(i.e. the HtsSystemContractMock) then no need to call _precheckCreateToken since it was already called when the createFungibleToken or other relevant method was called
        bool doPrecheck = caller != address(this);

        int64 responseCode = doPrecheck ? _precheckCreateToken(caller, fungibleTokenInfo.tokenInfo.token, fungibleTokenInfo.tokenInfo.totalSupply, fungibleTokenInfo.decimals) : HederaResponseCodes.SUCCESS;

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("PRECHECK_FAILED"); // TODO: revert with custom error that includes response code
        }

        address tokenAddress = msg.sender;
        _isFungible[tokenAddress] = true;
        address treasury = _setFungibleTokenInfo(fungibleTokenInfo);
        associateToken(treasury, tokenAddress);
    }

    /// @dev register HederaNonFungibleToken; msg.sender is the HederaNonFungibleToken
    ///      can be called by any contract; however assumes msg.sender is a HederaNonFungibleToken
    function registerHederaNonFungibleToken(address caller, TokenInfo memory nftTokenInfo) external {

        /// @dev if caller is this contract(i.e. the HtsSystemContractMock) then no need to call _precheckCreateToken since it was already called when the createNonFungibleToken or other relevant method was called
        bool doPrecheck = caller != address(this);

        int64 responseCode = doPrecheck ? _precheckCreateToken(caller, nftTokenInfo.token, 0, 0) : HederaResponseCodes.SUCCESS;

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("PRECHECK_FAILED"); // TODO: revert with custom error that includes response code
        }

        address tokenAddress = msg.sender;
        _isNonFungible[tokenAddress] = true;
        address treasury = _setNftTokenInfo(nftTokenInfo);

        associateToken(treasury, tokenAddress);
    }

    // IHederaTokenService public/external view functions:
    function getApproved(
        address token,
        uint256 serialNumber
    ) external view returns (int64 responseCode, address approved) {

        bool success;
        (success, responseCode) = _precheckGetApproved(token, serialNumber);

        if (!success) {
            return (responseCode, approved);
        }

        // TODO: abstract logic into _get{Data} function
        approved = HederaNonFungibleToken(token).getApproved(serialNumber);
    }

    function getFungibleTokenInfo(
        address token
    ) external view returns (int64 responseCode, FungibleTokenInfo memory fungibleTokenInfo) {

        bool success;
        (success, responseCode) = _precheckGetFungibleTokenInfo(token);

        if (!success) {
            return (responseCode, fungibleTokenInfo);
        }

        // TODO: abstract logic into _get{Data} function
        fungibleTokenInfo = _fungibleTokenInfos[token];
    }

    function getNonFungibleTokenInfo(
        address token,
        int64 serialNumber
    ) external view returns (int64 responseCode, NonFungibleTokenInfo memory nonFungibleTokenInfo) {

        bool success;
        (success, responseCode) = _precheckGetNonFungibleTokenInfo(token);

        if (!success) {
            return (responseCode, nonFungibleTokenInfo);
        }

        // TODO: abstract logic into _get{Data} function
        TokenInfo memory nftTokenInfo = _nftTokenInfos[token];
        PartialNonFungibleTokenInfo memory partialNonFungibleTokenInfo = _partialNonFungibleTokenInfos[token][
            serialNumber
        ];

        nonFungibleTokenInfo.tokenInfo = nftTokenInfo;

        nonFungibleTokenInfo.serialNumber = serialNumber;

        nonFungibleTokenInfo.ownerId = partialNonFungibleTokenInfo.ownerId;
        nonFungibleTokenInfo.creationTime = partialNonFungibleTokenInfo.creationTime;
        nonFungibleTokenInfo.metadata = partialNonFungibleTokenInfo.metadata;
        nonFungibleTokenInfo.spenderId = partialNonFungibleTokenInfo.spenderId;
    }

    function getTokenCustomFees(
        address token
    )
        external
        view
        returns (
            int64 responseCode,
            FixedFee[] memory fixedFees,
            FractionalFee[] memory fractionalFees,
            RoyaltyFee[] memory royaltyFees
        )
    {

        bool success;
        (success, responseCode) = _precheckGetTokenCustomFees(token);

        if (!success) {
            return (responseCode, fixedFees, fractionalFees, royaltyFees);
        }

        // TODO: abstract logic into _get{Data} function
        if (_isFungible[token]) {
            fixedFees = _fungibleTokenInfos[token].tokenInfo.fixedFees;
            fractionalFees = _fungibleTokenInfos[token].tokenInfo.fractionalFees;
            royaltyFees = _fungibleTokenInfos[token].tokenInfo.royaltyFees;
        } else {
            fixedFees = _nftTokenInfos[token].fixedFees;
            fractionalFees = _nftTokenInfos[token].fractionalFees;
            royaltyFees = _nftTokenInfos[token].royaltyFees;
        }
    }

    function getTokenDefaultFreezeStatus(
        address token
    ) external view returns (int64 responseCode, bool defaultFreezeStatus) {

        bool success;
        (success, responseCode) = _precheckGetTokenDefaultFreezeStatus(token);

        if (!success) {
            return (responseCode, defaultFreezeStatus);
        }

        // TODO: abstract logic into _get{Data} function
        if (_isFungible[token]) {
            defaultFreezeStatus = _fungibleTokenInfos[token].tokenInfo.token.freezeDefault;
        } else {
            defaultFreezeStatus = _nftTokenInfos[token].token.freezeDefault;
        }
    }

    function getTokenDefaultKycStatus(address token) external view returns (int64 responseCode, bool defaultKycStatus) {

        bool success;
        (success, responseCode) = _precheckGetTokenDefaultKycStatus(token);

        if (!success) {
            return (responseCode, defaultKycStatus);
        }

        // TODO: abstract logic into _get{Data} function
        if (_isFungible[token]) {
            defaultKycStatus = _fungibleTokenInfos[token].tokenInfo.defaultKycStatus;
        } else {
            defaultKycStatus = _nftTokenInfos[token].defaultKycStatus;
        }
    }

    function getTokenExpiryInfo(address token) external view returns (int64 responseCode, Expiry memory expiry) {

        bool success;
        (success, responseCode) = _precheckGetTokenExpiryInfo(token);

        if (!success) {
            return (responseCode, expiry);
        }

        // TODO: abstract logic into _get{Data} function
        if (_isFungible[token]) {
            expiry = _fungibleTokenInfos[token].tokenInfo.token.expiry;
        } else {
            expiry = _nftTokenInfos[token].token.expiry;
        }
    }

    function getTokenInfo(address token) external view returns (int64 responseCode, TokenInfo memory tokenInfo) {

        bool success;
        (success, responseCode) = _precheckGetTokenInfo(token);

        if (!success) {
            return (responseCode, tokenInfo);
        }

        // TODO: abstract logic into _get{Data} function
        if (_isFungible[token]) {
            tokenInfo = _fungibleTokenInfos[token].tokenInfo;
        } else {
            tokenInfo = _nftTokenInfos[token];
        }
    }

    function getTokenKey(address token, uint keyType) external view returns (int64 responseCode, KeyValue memory key) {

        bool success;
        (success, responseCode) = _precheckGetTokenKey(token);

        if (!success) {
            return (responseCode, key);
        }

        // TODO: abstract logic into _get{Data} function
        /// @dev the key can be retrieved using either of the following methods
        // method 1: gas inefficient
        // key = _getTokenKey(_fungibleTokenInfos[token].tokenInfo.token.tokenKeys, keyType);

        // method 2: more gas efficient and works for BOTH token types; however currently only considers contractId
        address keyValue = _tokenKeys[token][keyType];
        key.contractId = keyValue;
    }

    function _getTokenKey(IHederaTokenService.TokenKey[] memory tokenKeys, uint keyType) internal view returns (KeyValue memory key) {
        uint256 length = tokenKeys.length;

        for (uint256 i = 0; i < length; i++) {
            IHederaTokenService.TokenKey memory tokenKey = tokenKeys[i];
            if (tokenKey.keyType == keyType) {
                key = tokenKey.key;
                break;
            }
        }
    }

    function getTokenType(address token) external view returns (int64 responseCode, int32 tokenType) {

        bool success;
        (success, responseCode) = _precheckGetTokenType(token);

        if (!success) {
            return (responseCode, tokenType);
        }

        // TODO: abstract logic into _get{Data} function
        bool isFungibleToken = _isFungible[token];
        bool isNonFungibleToken = _isNonFungible[token];
        tokenType = isFungibleToken ? int32(0) : int32(1);
    }

    function grantTokenKyc(address token, address account) external returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckKyc(msg.sender, token, account);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _kyc[token][account].explicit = true;
        _kyc[token][account].value = true;
    }

    /// @dev Applicable ONLY to NFT Tokens; accessible via IERC721
    function isApprovedForAll(
        address token,
        address owner,
        address operator
    ) external view returns (int64 responseCode, bool approved) {}

    function isFrozen(address token, address account) public view returns (int64 responseCode, bool frozen) {

        bool success = true;
        (success, responseCode) = _precheckIsFrozen(token, account);

        if (!success) {
            return (responseCode, frozen);
        }

        bool isFungible = _isFungible[token];
        bool isNonFungible = _isNonFungible[token];
        // TODO: abstract logic into _isFrozen function
        bool freezeDefault;
        if (isFungible) {
            FungibleTokenInfo memory fungibleTokenInfo = _fungibleTokenInfos[token];
            freezeDefault = fungibleTokenInfo.tokenInfo.token.freezeDefault;
        } else {
            TokenInfo memory nftTokenInfo = _nftTokenInfos[token];
            freezeDefault = nftTokenInfo.token.freezeDefault;
        }

        TokenConfig memory unfrozenConfig = _unfrozen[token][account];

        /// @dev if unfrozenConfig.explicit is false && freezeDefault is true then an account must explicitly be unfrozen otherwise assume unfrozen
        frozen = unfrozenConfig.explicit ? !(unfrozenConfig.value) : (freezeDefault ? !(unfrozenConfig.value) : false);
    }

    function isKyc(address token, address account) public view returns (int64 responseCode, bool kycGranted) {

        bool success;
        (success, responseCode) = _precheckIsKyc(token, account);

        if (!success) {
            return (responseCode, kycGranted);
        }

        // TODO: abstract logic into _isKyc function
        bool isFungible = _isFungible[token];
        bool isNonFungible = _isNonFungible[token];
        bool defaultKycStatus;
        if (isFungible) {
            FungibleTokenInfo memory fungibleTokenInfo = _fungibleTokenInfos[token];
            defaultKycStatus = fungibleTokenInfo.tokenInfo.defaultKycStatus;
        } else {
            TokenInfo memory nftTokenInfo = _nftTokenInfos[token];
            defaultKycStatus = nftTokenInfo.defaultKycStatus;
        }

        TokenConfig memory kycConfig = _kyc[token][account];

        /// @dev if kycConfig.explicit is false && defaultKycStatus is true then an account must explicitly be KYCed otherwise assume KYCed
        kycGranted = kycConfig.explicit ? kycConfig.value : (defaultKycStatus ? kycConfig.value : true);
    }

    function isToken(address token) public view returns (int64 responseCode, bool isToken) {
        isToken = _isToken(token);
        responseCode = isToken ? HederaResponseCodes.SUCCESS : HederaResponseCodes.INVALID_TOKEN_ID;
    }

    function allowance(
        address token,
        address owner,
        address spender
    ) public view returns (int64 responseCode, uint256 allowance) {

        bool success;
        (success, responseCode) = _precheckAllowance(token, owner, spender);

        if (!success) {
            return (responseCode, allowance);
        }

        // TODO: abstract logic into _allowance function
        allowance = HederaFungibleToken(token).allowance(owner, spender);
    }

    // Additional(not in IHederaTokenService) public/external view functions:
    /// @dev KeyHelper.KeyType is an enum; whereas KeyHelper.keyTypes is a mapping that maps the enum index to a uint256
    /// keyTypes[KeyType.ADMIN] = 1;
    /// keyTypes[KeyType.KYC] = 2;
    /// keyTypes[KeyType.FREEZE] = 4;
    /// keyTypes[KeyType.WIPE] = 8;
    /// keyTypes[KeyType.SUPPLY] = 16;
    /// keyTypes[KeyType.FEE] = 32;
    /// keyTypes[KeyType.PAUSE] = 64;
    /// i.e. the relation is 2^(uint(KeyHelper.KeyType)) = keyType
    function _getKey(address token, KeyHelper.KeyType keyType) internal view returns (address keyOwner) {
        /// @dev the following relation is used due to the below described issue with KeyHelper.getKeyType
        uint _keyType = _getKeyTypeValue(keyType);
        /// @dev the following does not work since the KeyHelper has all of its storage/state cleared/defaulted once vm.etch is used
        ///      to fix this KeyHelper should expose a function that does what it's constructor does i.e. initialise the keyTypes mapping
        // uint _keyType = getKeyType(keyType);
        keyOwner = _tokenKeys[token][_keyType];
    }

    // TODO: move into a common util contract as it's used elsewhere
    function _getKeyTypeValue(KeyHelper.KeyType keyType) internal pure returns (uint256 keyTypeValue) {
        keyTypeValue = 2 ** uint(keyType);
    }

    function _getBalance(address account) internal view returns (uint256 balance) {
        balance = account.balance;
    }

    // TODO: validate account exists wherever applicable; transfers, mints, burns, etc
    // is account(either an EOA or contract) has a non-zero balance then assume it exists
    function _doesAccountExist(address account) internal view returns (bool exists) {
        exists = _getBalance(account) > 0;
    }

    // IHederaTokenService public/external state-changing functions:
    function createFungibleToken(
        HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals
    ) external payable noDelegateCall returns (int64 responseCode, address tokenAddress) {
        responseCode = _precheckCreateToken(msg.sender, token, initialTotalSupply, decimals);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            return (responseCode, ADDRESS_ZERO);
        }

        FungibleTokenInfo memory fungibleTokenInfo;
        TokenInfo memory tokenInfo;

        tokenInfo.token = token;
        tokenInfo.totalSupply = initialTotalSupply;

        fungibleTokenInfo.decimals = decimals;
        fungibleTokenInfo.tokenInfo = tokenInfo;

        /// @dev no need to register newly created HederaFungibleToken in this context as the constructor will call HtsSystemContractMock#registerHederaFungibleToken
        HederaFungibleToken hederaFungibleToken = new HederaFungibleToken(fungibleTokenInfo);
        emit TokenCreated(address(hederaFungibleToken));
        return (HederaResponseCodes.SUCCESS, address(hederaFungibleToken));
    }

    function createNonFungibleToken(
        HederaToken memory token
    ) external payable noDelegateCall returns (int64 responseCode, address tokenAddress) {
        responseCode = _precheckCreateToken(msg.sender, token, 0, 0);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            return (responseCode, ADDRESS_ZERO);
        }

        TokenInfo memory tokenInfo;
        tokenInfo.token = token;

        /// @dev no need to register newly created HederaNonFungibleToken in this context as the constructor will call HtsSystemContractMock#registerHederaNonFungibleToken
        HederaNonFungibleToken hederaNonFungibleToken = new HederaNonFungibleToken(tokenInfo);
        emit TokenCreated(address(hederaNonFungibleToken));
        return (HederaResponseCodes.SUCCESS, address(hederaNonFungibleToken));
    }

    // TODO: implement logic that considers fixedFees, fractionalFees where applicable such as on transfers
    function createFungibleTokenWithCustomFees(
        HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals,
        FixedFee[] memory fixedFees,
        FractionalFee[] memory fractionalFees
    ) external payable noDelegateCall returns (int64 responseCode, address tokenAddress) {
        responseCode = _precheckCreateToken(msg.sender, token, initialTotalSupply, decimals);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            return (responseCode, ADDRESS_ZERO);
        }

        FungibleTokenInfo memory fungibleTokenInfo;
        TokenInfo memory tokenInfo;

        tokenInfo.token = token;
        tokenInfo.totalSupply = initialTotalSupply;
        tokenInfo.fixedFees = fixedFees;
        tokenInfo.fractionalFees = fractionalFees;

        fungibleTokenInfo.decimals = decimals;
        fungibleTokenInfo.tokenInfo = tokenInfo;

        /// @dev no need to register newly created HederaFungibleToken in this context as the constructor will call HtsSystemContractMock#registerHederaFungibleToken
        HederaFungibleToken hederaFungibleToken = new HederaFungibleToken(fungibleTokenInfo);
        emit TokenCreated(address(hederaFungibleToken));
        return (HederaResponseCodes.SUCCESS, address(hederaFungibleToken));
    }

    // TODO: implement logic that considers fixedFees, royaltyFees where applicable such as on transfers
    function createNonFungibleTokenWithCustomFees(
        HederaToken memory token,
        FixedFee[] memory fixedFees,
        RoyaltyFee[] memory royaltyFees
    ) external payable noDelegateCall returns (int64 responseCode, address tokenAddress) {
        responseCode = _precheckCreateToken(msg.sender, token, 0, 0);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            return (responseCode, ADDRESS_ZERO);
        }

        TokenInfo memory tokenInfo;
        tokenInfo.token = token;
        tokenInfo.fixedFees = fixedFees;
        tokenInfo.royaltyFees = royaltyFees;

        /// @dev no need to register newly created HederaNonFungibleToken in this context as the constructor will call HtsSystemContractMock#registerHederaNonFungibleToken
        HederaNonFungibleToken hederaNonFungibleToken = new HederaNonFungibleToken(tokenInfo);
        emit TokenCreated(address(hederaNonFungibleToken));
        return (HederaResponseCodes.SUCCESS, address(hederaNonFungibleToken));
    }

    // TODO
    function cryptoTransfer(
        TransferList memory transferList,
        TokenTransferList[] memory tokenTransfers
    ) external noDelegateCall returns (int64 responseCode) {}

    function deleteToken(address token) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckDeleteToken(msg.sender, token);

        if (!success) {
            return responseCode;
        }

        _tokenDeleted[token] = true;
    }

    function approve(
        address token,
        address spender,
        uint256 amount
    ) external noDelegateCall returns (int64 responseCode) {
        address owner = msg.sender;
        bool success;
        (success, responseCode) = _precheckApprove(token, owner, spender, amount); // _precheckApprove works for BOTH token types

        if (!success) {
            return responseCode;
        }

        _postApprove(token, owner, spender, amount);
        HederaFungibleToken(token).approveRequestFromHtsPrecompile(owner, spender, amount);
    }

    function approveNFT(
        address token,
        address approved,
        uint256 serialNumber
    ) external noDelegateCall returns (int64 responseCode) {
        address owner = msg.sender;
        address spender = approved;
        int64 _serialNumber = int64(int(serialNumber));
        bool success;
        (success, responseCode) = _precheckApprove(token, owner, spender, serialNumber); // _precheckApprove works for BOTH token types

        if (!success) {
            return responseCode;
        }

        _postApprove(token, owner, spender, serialNumber);
        HederaNonFungibleToken(token).approveRequestFromHtsPrecompile(spender, _serialNumber, owner);
    }

    function associateToken(address account, address token) public noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckAssociateToken(account, token);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _association[token][account] = true;
    }

    function associateTokens(
        address account,
        address[] memory tokens
    ) external noDelegateCall returns (int64 responseCode) {
        for (uint256 i = 0; i < tokens.length; i++) {
            responseCode = associateToken(account, tokens[i]);
            if (responseCode != HederaResponseCodes.SUCCESS) {
                return responseCode;
            }
        }
    }

    function dissociateTokens(
        address account,
        address[] memory tokens
    ) external noDelegateCall returns (int64 responseCode) {
        for (uint256 i = 0; i < tokens.length; i++) {
            int64 responseCode = dissociateToken(account, tokens[i]);
            if (responseCode != HederaResponseCodes.SUCCESS) {
                return responseCode;
            }
        }
    }

    function dissociateToken(address account, address token) public noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckDissociateToken(account, token);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _association[token][account] = false;
    }

    function freezeToken(address token, address account) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckFreezeToken(msg.sender, token, account);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _unfrozen[token][account].explicit = true;
        _unfrozen[token][account].value = false;
    }

    function mintToken(
        address token,
        int64 amount,
        bytes[] memory metadata
    ) external noDelegateCall returns (int64 responseCode, int64 newTotalSupply, int64[] memory serialNumbers) {
        bool success;
        (success, responseCode) = _precheckMint(token, amount, metadata);

        if (!success) {
            return (responseCode, 0, new int64[](0));
        }

        int64 amountOrSerialNumber;

        if (_isFungible[token]) {
            amountOrSerialNumber = amount;
            HederaFungibleToken hederaFungibleToken = HederaFungibleToken(token);
            hederaFungibleToken.mintRequestFromHtsPrecompile(amount);
            newTotalSupply = int64(int(hederaFungibleToken.totalSupply()));
        }

        if (_isNonFungible[token]) {
            serialNumbers = new int64[](1); // since you can only mint 1 NFT at a time
            int64 serialNumber;
            (newTotalSupply, serialNumber) = HederaNonFungibleToken(token).mintRequestFromHtsPrecompile(metadata);
            serialNumbers[0] = serialNumber;
            amountOrSerialNumber = serialNumber;
        }

        _postMint(token, amountOrSerialNumber, metadata);
        return (responseCode, newTotalSupply, serialNumbers);
    }

    function burnToken(
        address token,
        int64 amount,
        int64[] memory serialNumbers
    ) external noDelegateCall returns (int64 responseCode, int64 newTotalSupply) {
        bool success;
        (success, responseCode) = _precheckBurn(token, amount, serialNumbers);

        if (!success) {
            return (responseCode, 0);
        }

        // TODO: abstract logic into _post{Action} function
        if (_isFungible[token]) {
            HederaFungibleToken hederaFungibleToken = HederaFungibleToken(token);
            hederaFungibleToken.burnRequestFromHtsPrecompile(amount);
            newTotalSupply = int64(int(hederaFungibleToken.totalSupply()));
        }

        if (_isNonFungible[token]) { // this conditional is redundant but added for code readibility
            newTotalSupply = HederaNonFungibleToken(token).burnRequestFromHtsPrecompile(serialNumbers);
        }

        _postBurn(token, amount, serialNumbers);
    }

    function pauseToken(address token) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckPauseToken(msg.sender, token);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _tokenPaused[token].explicit = true;
        _tokenPaused[token].value = true;
    }

    function revokeTokenKyc(address token, address account) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckKyc(msg.sender, token, account);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _kyc[token][account].explicit = true;
        _kyc[token][account].value = false;
    }

    function setApprovalForAll(
        address token,
        address operator,
        bool approved
    ) external noDelegateCall returns (int64 responseCode) {
        address owner = msg.sender;
        bool success;
        (success, responseCode) = _precheckSetApprovalForAll(token, owner, operator, approved);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        HederaNonFungibleToken(token).setApprovalForAllFromHtsPrecompile(owner, operator, approved);
    }

    function transferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) external noDelegateCall returns (int64 responseCode) {
        /// @dev spender is set to non-zero address such that shouldAssumeRequestFromOwner always evaluates to false if HtsSystemContractMock#transferFrom is called
        address spender = msg.sender;
        bool isRequestFromOwner;

        bool success;
        (success, responseCode, isRequestFromOwner) = _precheckTransfer(token, spender, from, to, amount);

        if (!success) {
            return responseCode;
        }

        _postTransfer(token, spender, from, to, amount);
        responseCode = HederaFungibleToken(token).transferRequestFromHtsPrecompile(
            isRequestFromOwner,
            spender,
            from,
            to,
            amount
        );
    }

    function transferFromNFT(
        address token,
        address from,
        address to,
        uint256 serialNumber
    ) external noDelegateCall returns (int64 responseCode) {
        address spender = msg.sender;
        bool isRequestFromOwner;

        bool success;
        (success, responseCode, isRequestFromOwner) = _precheckTransfer(token, spender, from, to, serialNumber);

        if (!success) {
            return responseCode;
        }

        _postTransfer(token, spender, from, to, serialNumber);
        HederaNonFungibleToken(token).transferRequestFromHtsPrecompile(
            isRequestFromOwner,
            spender,
            from,
            to,
            serialNumber
        );
    }

    /// TODO implementation is currently identical to transferFromNFT; investigate the differences between the 2 functions
    function transferNFT(
        address token,
        address sender,
        address recipient,
        int64 serialNumber
    ) public noDelegateCall returns (int64 responseCode) {
        address spender = msg.sender;
        uint256 _serialNumber = uint64(serialNumber);
        bool isRequestFromOwner;

        bool success;
        (success, responseCode, isRequestFromOwner) = _precheckTransfer(token, spender, sender, recipient, _serialNumber);

        if (!success) {
            return responseCode;
        }

        _postTransfer(token, spender, sender, recipient, _serialNumber);
        responseCode = HederaNonFungibleToken(token).transferRequestFromHtsPrecompile(
            isRequestFromOwner,
            spender,
            sender,
            recipient,
            _serialNumber
        );
    }

    function transferNFTs(
        address token,
        address[] memory sender,
        address[] memory receiver,
        int64[] memory serialNumber
    ) external noDelegateCall returns (int64 responseCode) {
        uint length = sender.length;
        uint receiverCount = receiver.length;
        uint serialNumberCount = serialNumber.length;

        require(length == receiverCount && length == serialNumberCount, 'UNEQUAL_ARRAYS');

        address _sender;
        address _receiver;
        int64 _serialNumber;

        for (uint256 i = 0; i < length; i++) {
            _sender = sender[i];
            _receiver = receiver[i];
            _serialNumber = serialNumber[i];

            responseCode = transferNFT(token, _sender, _receiver, _serialNumber);

            // TODO: instead of reverting return responseCode; this will require prechecks on each individual transfer before enacting the transfer of all NFTs
            // alternatively consider reverting but catch error and extract responseCode from the error and return the responseCode
            if (responseCode != HederaResponseCodes.SUCCESS) {
                revert HtsPrecompileError(responseCode);
            }
        }
    }

    /// TODO implementation is currently identical to transferFrom; investigate the differences between the 2 functions
    function transferToken(
        address token,
        address sender,
        address recipient,
        int64 amount
    ) public noDelegateCall returns (int64 responseCode) {
        address spender = msg.sender;
        bool isRequestFromOwner;
        uint _amount = uint(int(amount));

        bool success;
        (success, responseCode, isRequestFromOwner) = _precheckTransfer(token, spender, sender, recipient, _amount);

        if (!success) {
            return responseCode;
        }

        _postTransfer(token, spender, sender, recipient, _amount);
        responseCode = HederaFungibleToken(token).transferRequestFromHtsPrecompile(
            isRequestFromOwner,
            spender,
            sender,
            recipient,
            _amount
        );
    }

    function transferTokens(
        address token,
        address[] memory accountId,
        int64[] memory amount
    ) external noDelegateCall returns (int64 responseCode) {
        uint length = accountId.length;
        uint amountCount = amount.length;

        require(length == amountCount, 'UNEQUAL_ARRAYS');

        address spender = msg.sender;
        address receiver;
        int64 _amount;

        for (uint256 i = 0; i < length; i++) {
            receiver = accountId[i];
            _amount = amount[i];

            responseCode = transferToken(token, spender, receiver, _amount);

            // TODO: instead of reverting return responseCode; this will require prechecks on each individual transfer before enacting the transfer of all NFTs
            // alternatively consider reverting but catch error and extract responseCode from the error and return the responseCode
            if (responseCode != HederaResponseCodes.SUCCESS) {
                revert HtsPrecompileError(responseCode);
            }
        }
    }

    function unfreezeToken(address token, address account) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckFreezeToken(msg.sender, token, account);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _unfrozen[token][account].explicit = true;
        _unfrozen[token][account].value = true;
    }

    function unpauseToken(address token) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckPauseToken(msg.sender, token);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        _tokenPaused[token].explicit = true;
        _tokenPaused[token].value = false;
    }

    function updateTokenExpiryInfo(
        address token,
        Expiry memory expiryInfo
    ) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckUpdateTokenExpiryInfo(msg.sender, token, expiryInfo);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        if (_isFungible[token]) {
            _setFungibleTokenExpiry(token, expiryInfo);
        }

        if (_isNonFungible[token]) {
            _setNftTokenExpiry(token, expiryInfo);
        }
    }

    function updateTokenInfo(
        address token,
        HederaToken memory tokenInfo
    ) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckUpdateTokenInfo(msg.sender, token, tokenInfo);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        if (_isFungible[token]) {
            _setFungibleTokenInfoToken(token, tokenInfo);
        }

        if (_isNonFungible[token]) {
            _setNftTokenInfoToken(token, tokenInfo);
        }
    }

    function updateTokenKeys(
        address token,
        TokenKey[] memory keys
    ) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckUpdateTokenKeys(msg.sender, token, keys);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        if (_isFungible[token]) {
            _setFungibleTokenKeys(token, keys);
        }

        if (_isNonFungible[token]) {
            _setNftTokenKeys(token, keys);
        }

    }

    function wipeTokenAccount(
        address token,
        address account,
        int64 amount
    ) external noDelegateCall returns (int64 responseCode) {

        int64[] memory nullArray;

        bool success;
        (success, responseCode) = _precheckWipe(msg.sender, token, account, amount, nullArray);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        HederaFungibleToken hederaFungibleToken = HederaFungibleToken(token);
        hederaFungibleToken.wipeRequestFromHtsPrecompile(account, amount);
    }

    function wipeTokenAccountNFT(
        address token,
        address account,
        int64[] memory serialNumbers
    ) external noDelegateCall returns (int64 responseCode) {

        bool success;
        (success, responseCode) = _precheckWipe(msg.sender, token, account, 0, serialNumbers);

        if (!success) {
            return responseCode;
        }

        // TODO: abstract logic into _post{Action} function
        int64 serialNumber;
        uint burnCount = serialNumbers.length;
        for (uint256 i = 0; i < burnCount; i++) {
            serialNumber = serialNumbers[i];
            delete _partialNonFungibleTokenInfos[token][serialNumber].ownerId;
            delete _partialNonFungibleTokenInfos[token][serialNumber].spenderId;
        }
    }

    function updateFungibleTokenCustomFees(address token,  IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.FractionalFee[] memory fractionalFees) external returns (int64 responseCode){}
    function updateNonFungibleTokenCustomFees(address token, IHederaTokenService.FixedFee[] memory fixedFees, IHederaTokenService.RoyaltyFee[] memory royaltyFees) external returns (int64 responseCode){}
    
    // TODO
    function redirectForToken(address token, bytes memory encodedFunctionSelector) external noDelegateCall override returns (int64 responseCode, bytes memory response) {}

    // Additional(not in IHederaTokenService) public/external state-changing functions:
    function isAssociated(address account, address token) external view returns (bool associated) {
        associated = _association[token][account];
    }

    function getTreasuryAccount(address token) external view returns (address treasury) {
        return _getTreasuryAccount(token);
    }

    function _getStringLength(string memory _string) internal pure returns (uint length) {
        length = bytes(_string).length;
    }

    function airdropTokens(TokenTransferList[] memory tokenTransfers) external returns (int64 responseCode) {}

    function cancelAirdrops(PendingAirdrop[] memory pendingAirdrops) external returns (int64 responseCode) {}

    function claimAirdrops(PendingAirdrop[] memory pendingAirdrops) external returns (int64 responseCode) {}

    function rejectTokens(address rejectingAddress, address[] memory ftAddresses, NftID[] memory nftIDs) external returns (int64 responseCode) {}
}
