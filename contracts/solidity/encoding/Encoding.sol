// Encoding.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Encoding {
    
    function decodeData(bytes memory encodedData) public pure returns (address, uint256) {
        address decodedAddress;
        uint256 decodedUint;
        assembly {
            decodedAddress := mload(add(encodedData, 32))
            decodedUint := mload(add(encodedData, 64))
        }
        return (decodedAddress, decodedUint);
    }

    function encodeData(address _address, uint256 _uint) public pure returns (bytes memory) {
        return abi.encode(_address, _uint);
    }

    function getPackedData(address _addr, uint256 _amount, string memory _data) public pure returns (bytes memory) {
        return abi.encodePacked(_addr, _amount, _data);
    }
}
