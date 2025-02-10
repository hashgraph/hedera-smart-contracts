// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IHtsFungibleToken
 * @dev This interface defines a native fungible HTS token that supports ERC20 functions. Currently it does not yet support all the IHTSTokenService functions.
 */
interface IHtsFungibleToken is IERC20 {
    function decimals() external view returns (uint8);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}
