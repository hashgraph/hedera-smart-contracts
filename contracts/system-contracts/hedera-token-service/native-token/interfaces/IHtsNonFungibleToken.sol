// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

/**
 * @title IHtsNonFungibleToken
 * @dev This interface defines a native fungible HTS token that supports ERC721 functions. Currently it does not yet support all the IHTSTokenService functions.
 */
interface IHtsNonFungibleToken is IERC721Metadata {
}
