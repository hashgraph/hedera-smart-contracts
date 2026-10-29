// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

contract ERC1155Token is Context, ERC1155, Ownable, ERC1155Burnable, ERC1155Supply {

    /**
     * @dev emitted after minted new token to an address
     */
    event Minted(address account, uint256 id, uint256 amount, bytes data);

    /**
     * @dev emitted after minted new tokens in batch to an address
     */
    event MintedBatch(address to, uint256[] ids, uint256[] amounts, bytes data);

    /**
     * @dev initialize new ERC1155 token
     */
    constructor(string memory _tokenUri) ERC1155(_tokenUri) Ownable(_msgSender()) {}


    /**
     * @dev set a new uri for the token
     */
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    /**
     * dev only allow the owner of the contract to mint new tokens to an address
     */
    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
        emit Minted(account, id, amount, data);
    }

    /**
     * @dev only allow the owner of the contract to mint new tokens in batch to an address
     */
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
        emit MintedBatch(to, ids, amounts, data);
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
