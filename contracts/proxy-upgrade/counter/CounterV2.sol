// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


contract CounterV2 is OwnableUpgradeable, UUPSUpgradeable{
    string public name;
    int256 public count;

    using SafeMath for int256;

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function changeName(string memory _name) public{
        name = _name;
    }

    function decrement() public returns (int256) {
        count--;
        return count;
    }
    
    function increment() public returns (int256) {
        count++;
        return count;
    }
}