// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

function itoa(uint value) pure returns (string memory) {
  uint length = 1;
  uint v = value;
  while ((v /= 10) != 0) { length++; }
  bytes memory result = new bytes(length);
  while (true) {
    length--;
    result[length] = bytes1(uint8(0x30 + (value % 10)));
    value /= 10;
    if (length == 0) {
        break;
    }
  }
  return string(result);
}

contract EcrecoverCheck {
    function verifySignature(
        string memory message,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public pure returns (address) {
        bytes memory prefixedMessage = abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            itoa(bytes(message).length),
            message
        );
        bytes32 digest = keccak256(prefixedMessage);
        address recoveredAddress = ecrecover(digest, v, r, s);
        return recoveredAddress;
    }

    function getSender() public view returns (address) {
        return msg.sender;
    }
}
