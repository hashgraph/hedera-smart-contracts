// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "../../IHTSStructs.sol";

/**
 * @title IHtsNonFungibleToken
 * @dev This interface defines a native fungible HTS token that supports ERC721 functions. Currently it does not yet support all the IHTSTokenService functions.
 */
interface IHtsNonFungibleToken is IERC721Metadata, IHTSStructs {
    /// Query non fungible token info
    /// @param serialNumber The NFT serialNumber to check
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return nonFungibleTokenInfo NonFungibleTokenInfo info for `token` `serialNumber`
    function getNonFungibleTokenInfo(int64 serialNumber)
        external
        returns (int64 responseCode, NonFungibleTokenInfo memory nonFungibleTokenInfo);
}
