// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import '../../../contracts/util-precompile/IPrngSystemContract.sol';

contract UtilPrecompileMock is IPrngSystemContract {

  address internal constant UTIL_PRECOMPILE = address(0x169);

  bytes32 internal lastSeed; // to increase pseudorandomness by feeding in the previous seed into latest seed

  function getPseudorandomSeed() external returns (bytes32) {
    lastSeed = keccak256(abi.encodePacked(lastSeed, block.timestamp, block.number, block.difficulty, msg.sender));
    return lastSeed;
  }
}
