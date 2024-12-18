// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MinimalERC20
 * @dev An ERC-20 implementation without `name()`, `symbol()`, `decimals()`, and `totalSupply()`.
 */
contract MinimalERC20 is ERC20 {
    constructor() ERC20("", "") {}

    /**
     * @notice Override the `name()` function to remove it.
     * @dev Reverts on call to prevent exposing the name of the token.
     */
    function name() public pure override returns (string memory) {
        revert("Name not supported");
    }

    /**
     * @notice Override the `symbol()` function to remove it.
     * @dev Reverts on call to prevent exposing the symbol of the token.
     */
    function symbol() public pure override returns (string memory) {
        revert("Symbol not supported");
    }

    /**
     * @notice Override the `decimals()` function to remove it.
     * @dev Reverts on call to prevent exposing the decimals of the token.
     */
    function decimals() public pure override returns (uint8) {
        revert("Decimals not supported");
    }

    /**
     * @notice Override the `totalSupply()` function to remove it.
     * @dev Reverts on call to prevent exposing the total supply of the token.
     */
    function totalSupply() public pure override returns (uint256) {
        revert("Total supply not supported");
    }
}
