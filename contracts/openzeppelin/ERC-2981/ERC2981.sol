// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract ERC2981Test is ERC2981 {
    constructor() ERC2981() {}

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator)
        external
    {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function feeDenominator()
        pure
        external
        returns (uint256)
    {
       return _feeDenominator();
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function resetTokenRoyalty(uint256 tokenId)
        external
    {
        _resetTokenRoyalty(tokenId);
    }
}