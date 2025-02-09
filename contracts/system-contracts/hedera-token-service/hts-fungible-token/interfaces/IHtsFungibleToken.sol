// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "../IHRC719.sol";
// import "../IHRC904TokenFacade.sol";

/**
 * @title IHtsFungibleToken
 * @dev This interface defines a native fungible HTS token that supports ERC20 functions. Currently it does not yet support all the IHTSTokenService functions.
 */
interface IHtsFungibleToken is IERC20 {

}