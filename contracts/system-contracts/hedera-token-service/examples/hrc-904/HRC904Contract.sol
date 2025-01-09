// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import {IHRC719} from "../../IHRC719.sol";
import {IHRC904TokenFacade} from "../../IHRC904TokenFacade.sol";
import {IHRC904AccountFacade} from "../../../hedera-account-service/IHRC904AccountFacade.sol";

// @title HRC904 Contract
// @notice Provides interface for token airdrop, claim, reject and association operations
// @dev Implements HRC-904 standard for token management operations
//
// Supports the following token operations:
// - Cancelling pending airdrops for fungible and non-fungible tokens
// - Claiming pending airdrops for fungible and non-fungible tokens  
// - Rejecting tokens and NFTs
// - Managing token associations and auto-association settings
contract HRC904Contract {
    event IsAssociated(bool status);

    // @notice Cancels a pending fungible token airdrop to a receiver
    // @dev Calls cancelAirdropFT on the token's HRC904 facade
    // @param token The token address to cancel airdrop for
    // @param receiver The address that was to receive the tokens
    // @return responseCode The response code from the cancel operation (22 = success)
    function cancelAirdropFT(address token, address receiver) public returns (int64 responseCode) {
        return IHRC904TokenFacade(token).cancelAirdropFT(receiver);
    }

    // @notice Cancels a pending non-fungible token airdrop to a receiver
    // @dev Calls cancelAirdropNFT on the token's HRC904 facade
    // @param token The NFT token address
    // @param receiver The address that was to receive the NFT
    // @param serial The serial number of the NFT
    // @return responseCode The response code from the cancel operation (22 = success)
    function cancelAirdropNFT(address token, address receiver, int64 serial) public returns (int64 responseCode) {
        return IHRC904TokenFacade(token).cancelAirdropNFT(receiver, serial);
    }

    // @notice Claims a pending fungible token airdrop from a sender
    // @dev Calls claimAirdropFT on the token's HRC904 facade
    // @param token The token address to claim airdrop from
    // @param sender The address that sent the tokens
    // @return responseCode The response code from the claim operation (22 = success)
    function claimAirdropFT(address token, address sender) public returns (int64 responseCode) {
        return IHRC904TokenFacade(token).claimAirdropFT(sender);
    }

    // @notice Claims a pending non-fungible token airdrop from a sender
    // @dev Calls claimAirdropNFT on the token's HRC904 facade
    // @param token The NFT token address
    // @param sender The address that sent the NFT
    // @param serial The serial number of the NFT
    // @return responseCode The response code from the claim operation (22 = success)
    function claimAirdropNFT(address token, address sender, int64 serial) public returns (int64 responseCode) {
        return IHRC904TokenFacade(token).claimAirdropNFT(sender, serial);
    }

    // @notice Rejects a fungible token
    // @dev Calls rejectTokenFT on the token's HRC904 facade
    // @param token The token address to reject
    // @return responseCode The response code from the reject operation (22 = success)
    function rejectTokenFT(address token) public returns (int64 responseCode) {
        return IHRC904TokenFacade(token).rejectTokenFT();
    }

    // @notice Rejects multiple non-fungible tokens
    // @dev Calls rejectTokenNFTs on the token's HRC904 facade
    // @param token The NFT token address
    // @param serialNumbers Array of NFT serial numbers to reject
    // @return responseCode The response code from the reject operation (22 = success)
    function rejectTokenNFTs(address token, int64[] memory serialNumbers) public returns (int64 responseCode) {
        return IHRC904TokenFacade(token).rejectTokenNFTs(serialNumbers);
    }

    // @notice Sets whether an account can have unlimited automatic token associations
    // @dev Calls setUnlimitedAutomaticAssociations on the account's HRC904 facade
    // @param account The account address to modify
    // @param enableAutoAssociations True to enable unlimited associations, false to disable
    // @return responseCode The response code from the operation (22 = success)
    function setUnlimitedAssociations(address account, bool enableAutoAssociations) public returns (int64 responseCode) {
        return IHRC904AccountFacade(account).setUnlimitedAutomaticAssociations(enableAutoAssociations);
    }

    // @notice Associates the caller's account with a token
    // @dev Calls associate on the HRC719 token interface
    // @param token The token address to associate with
    // @return responseCode The response code from the associate operation (22 = success)
    function associate(address token) public returns (uint256 responseCode) {
        return IHRC719(token).associate();
    }

    // @notice Dissociates the caller's account from a token
    // @dev Calls dissociate on the HRC719 token interface
    // @param token The token address to dissociate from
    // @return responseCode The response code from the dissociate operation (22 = success)
    function dissociate(address token) public returns (uint256 responseCode) {
        return IHRC719(token).dissociate();
    }

    // @notice Checks if the caller's account is associated with a token
    // @dev Calls isAssociated on the HRC719 token interface
    // @param token The token address to check association status
    // @return associated True if the account is associated with the token
    function isAssociated(address token) public view returns (bool associated) {
        return IHRC719(token).isAssociated();
    }
}