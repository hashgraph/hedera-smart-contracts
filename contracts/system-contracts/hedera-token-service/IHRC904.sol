// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./IHTSStructs.sol";

interface IHRC904 is IHTSStructs {
    /// @notice Airdrop one or more tokens to one or more accounts
    /// @notice Recipients will receive tokens in one of these ways:
    /// @notice     - Immediately if already associated with the token
    /// @notice     - Immediately with auto-association if they have available slots
    /// @notice     - As a pending airdrop requiring claim if they have "receiver signature required" 
    /// @notice     - As a pending airdrop requiring claim if they have no available auto-association slots
    /// @notice Immediate airdrops are irreversible, pending airdrops can be canceled
    /// @notice All transfer fees and auto-renewal rent costs are charged to the transaction submitter
    /// @param tokenTransfers Array of token transfer lists containing token addresses and recipient details
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function airdropTokens(TokenTransferList[] memory tokenTransfers) external returns (int64 responseCode);

    /// @notice Cancels pending airdrops that have not yet been claimed
    /// @param pendingAirdrops Array of pending airdrops to cancel
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function cancelAirdrops(PendingAirdrop[] memory pendingAirdrops) external returns (int64 responseCode);

    /// @notice Claims pending airdrops that were sent to the calling account
    /// @param pendingAirdrops Array of pending airdrops to claim
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function claimAirdrops(PendingAirdrop[] memory pendingAirdrops) external returns (int64 responseCode);

    /// @notice Rejects one or more tokens by transferring their full balance from the requesting account to the treasury
    /// @notice This transfer does not charge any custom fees or royalties defined for the tokens
    /// @notice For fungible tokens, the requesting account's balance will become 0 and the treasury balance will increase by that amount
    /// @notice For non-fungible tokens, the requesting account will no longer hold the rejected serial numbers and they will be transferred to the treasury
    /// @param rejectingAddress The address rejecting the tokens
    /// @param ftAddresses Array of fungible token addresses to reject
    /// @param nftIDs Array of NFT IDs to reject
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    function rejectTokens(address rejectingAddress, address[] memory ftAddresses, NftID[] memory nftIDs) external returns (int64 responseCode);
}