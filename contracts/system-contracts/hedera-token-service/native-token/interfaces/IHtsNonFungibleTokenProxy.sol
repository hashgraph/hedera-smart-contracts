// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./IHtsNonFungibleToken.sol";
import "../../IHRC719.sol";

/**
 * @title IHtsNonFungibleTokenProxy
 * @dev This interface defines a native fungible HTS token that supports ERC721 and IHRC719 functions.
 */
interface IHtsNonFungibleTokenProxy is IHtsNonFungibleToken, IHRC719 {
}
