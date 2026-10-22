// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Mock is ERC1155 {
    constructor(string memory uri) ERC1155(uri) {}

    function mint(address to, uint256 id, uint256 amount, bytes memory data) public {
        _mint(to, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory id, uint256[] memory amount, bytes memory data) public {
        _mintBatch(to, id, amount, data);
    }
}
