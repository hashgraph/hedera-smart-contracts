// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../HederaAccountService.sol";


contract AliasAccountUtility is HederaAccountService { 
    event ResponseCode(int responseCode);
    event IsAuthorizedRaw(address account, bool response);
    event AddressAliasResponse(int64 responseCode, address evmAddressAlias);



    // Returns the EVM address alias for the given Hedera account.
    /// @param accountNumAlias The Hedera account to get the EVM address alias for.
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return evmAddressAlias The EVM address alias for the given Hedera account.
    function getEvmAddressAliasPublic(address accountNumAlias) public returns (int64 responseCode, address evmAddressAlias) 
    {
        (responseCode, evmAddressAlias) = HederaAccountService.getEvmAddressAlias(accountNumAlias);
        // emit AddressAliasResponse(responseCode, accountNumAlias);
        emit AddressAliasResponse(responseCode, evmAddressAlias);
        // if (responseCode != HederaResponseCodes.SUCCESS) {
        //     revert();
        // }
    }

    /// Returns the Hedera Account ID (as account num alias) for the given EVM address alias
    /// @param evmAddressAlias The EVM address alias to get the Hedera account for.
    /// @return responseCode The response code for the status of the request.  SUCCESS is 22.
    /// @return accountNumAlias The Hedera account's num for the given EVM address alias.
    function getHederaAccountNumAliasPublic(address evmAddressAlias) public returns (int64 responseCode, address accountNumAlias) {
        (responseCode, accountNumAlias) = HederaAccountService.getHederaAccountNumAlias(evmAddressAlias);
        emit AddressAliasResponse(responseCode, accountNumAlias);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    /// @notice Verifies if a signature was signed by the account's key(s)
    /// @param account The account address to verify the signature against
    /// @param messageHash The hash of the message that was signed
    /// @param signature The signature to verify
    /// @return responseCode The response code indicating success or failure
    /// @return response True if the signature is valid for the account, false otherwise
    function isAuthorizedRawPublic(address account, bytes memory messageHash, bytes memory signature) public returns (int64 responseCode, bool response) {
        (responseCode, response) = HederaAccountService.isAuthorizedRaw(account, messageHash, signature);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        emit IsAuthorizedRaw(account, response);
    }
}
