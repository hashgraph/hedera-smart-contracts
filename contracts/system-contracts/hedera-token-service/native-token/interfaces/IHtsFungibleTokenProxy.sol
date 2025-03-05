// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./IHtsFungibleToken.sol";
import "../../IHRC719.sol";

/**
 * @title IHtsFungibleTokenProxy
 * @dev This interface defines a native fungible HTS token that supports ERC20 and IHRC719 functions.
 */
interface IHtsFungibleTokenProxy is IHtsFungibleToken, IHRC719 {
}
