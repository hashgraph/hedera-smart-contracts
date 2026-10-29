// Encoding.sol
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Encoding {
    event Added(uint256 result);

    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }
    
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

    function encodeAddFunction(uint256 a, uint256 b) public pure returns (bytes memory) {
        bytes4 selector = this.add.selector;
    
        return abi.encodeWithSelector(selector, a, b);
    }

    function getPackedData(address _addr, uint256 _amount, string memory _data) public pure returns (bytes memory) {
        return abi.encodePacked(_addr, _amount, _data);
    }

    function executeAddFunction(uint256 a, uint256 b) public {
        bytes memory data = encodeAddFunction(a, b);
        (bool success, bytes memory result) = address(this).call(data);
        
        require(success, "Call failed");
        emit Added(abi.decode(result, (uint256)));
    }
}
