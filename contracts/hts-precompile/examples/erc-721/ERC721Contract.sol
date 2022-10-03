// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

contract ERC721Contract {

    function balanceOf(address token, address owner) external view returns (uint256) {
        return IERC721(token).balanceOf(owner);
    }

    function ownerOf(address token, uint256 tokenId) external view returns (address) {
        return IERC721(token).ownerOf(tokenId);
    }

    function name(address token) public view returns (string memory) {
        return IERC721Metadata(token).name();
    }

    function symbol(address token) public view returns (string memory) {
        return IERC721Metadata(token).symbol();
    }

    function tokenURI(address token, uint256 tokenId) public view returns (string memory) {
        return IERC721Metadata(token).tokenURI(tokenId);
    }

    function totalSupply(address token) external view returns (uint256) {
        return IERC721Enumerable(token).totalSupply();
    }

    function approve(address token, address to, uint256 tokenId) external payable {
        IERC721(token).approve(to, tokenId);
    }

    function setApprovalForAll(address token, address operator, bool approved) external {
        IERC721(token).setApprovalForAll(operator, approved);
    }

    function getApproved(address token, uint256 tokenId) external view returns (address) {
        return IERC721(token).getApproved(tokenId);
    }

    function isApprovedForAll(address token, address owner, address operator) public view returns (bool) {
        return IERC721(token).isApprovedForAll(owner, operator);
    }

    function transferFrom(address token, address from, address to, uint256 tokenId) external payable {
        IERC721(token).transferFrom(from, to, tokenId);
    }

    // Not supported operations - should return a failure

    function safeTransferFrom(address token, address from, address to, uint256 tokenId) external payable {
        IERC721(token).safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFromWithData(address token, address from, address to, uint256 tokenId, bytes calldata data) external payable {
        IERC721(token).safeTransferFrom(from, to, tokenId, data);
    }

    function tokenByIndex(address token, uint256 index) external view returns (uint256) {
        return IERC721Enumerable(token).tokenByIndex(index);
    }

    function tokenOfOwnerByIndex(address token, address owner, uint256 index) external view returns (uint256) {
        return IERC721Enumerable(token).tokenOfOwnerByIndex(owner, index);
    }
}
