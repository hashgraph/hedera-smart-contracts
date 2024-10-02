// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import '../../../../contracts/system-contracts/pseudo-random-number-generator/IPrngSystemContract.sol';

contract PRNGSytemContractMock is IPrngSystemContract {

  address internal constant PRNG_PRECOMPILE_ADDRESS = address(0x169);

  bytes32 internal lastSeed; // to increase pseudorandomness by feeding in the previous seed into latest seed

  function getPseudorandomSeed() external returns (bytes32) {
    lastSeed = keccak256(abi.encodePacked(lastSeed, block.timestamp, block.number, msg.sender));
    return lastSeed;
  }
}
