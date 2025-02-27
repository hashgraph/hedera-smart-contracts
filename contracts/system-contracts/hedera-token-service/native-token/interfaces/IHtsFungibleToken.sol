// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../../IHTSStructs.sol";

/**
 * @title IHtsFungibleToken
 * @dev This interface defines a native fungible HTS token that supports ERC20 functions. Currently it does not yet support all the IHTSTokenService functions.
 */
interface IHtsFungibleToken is IERC20Metadata, IHTSStructs {
    /// Query fungible token info
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return fungibleTokenInfo FungibleTokenInfo info for `token`
    function getFungibleTokenInfo()
        external
        returns (int64 responseCode, FungibleTokenInfo memory fungibleTokenInfo);
}
