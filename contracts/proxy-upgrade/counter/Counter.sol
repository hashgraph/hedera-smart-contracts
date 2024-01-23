// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Counter is OwnableUpgradeable, UUPSUpgradeable {
    string public name;
    int256 public count;

    using Math for int256;

    function initialize(string memory _name) public initializer {
        name = _name;
        __Ownable_init(msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function decrement() public returns (int256) {
        count--;
        return count;
    }

    function increment() public returns (int256) {
        count++;
        return count;
    }
}
