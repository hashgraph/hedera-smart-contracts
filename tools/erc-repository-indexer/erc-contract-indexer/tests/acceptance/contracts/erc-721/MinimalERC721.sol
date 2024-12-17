// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MinimalERC721 is ERC721 {
    constructor() ERC721("", "") {}

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
}