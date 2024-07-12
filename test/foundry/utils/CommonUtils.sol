// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import 'forge-std/Test.sol';

import '../../../contracts/system-contracts/hedera-token-service/KeyHelper.sol';

/// generic test utils
abstract contract CommonUtils is Test, KeyHelper {

    address internal alice = vm.addr(1);
    address internal bob = vm.addr(2);
    address internal carol = vm.addr(3);
    address internal dave = vm.addr(4);

    uint256 public constant NUM_OF_ACCOUNTS = 4;

    modifier setPranker(address pranker) {
        vm.startPrank(pranker);
        _;
        vm.stopPrank();
    }

    function _setUpAccounts() internal {
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(dave, 100 ether);
    }

    function _getAccount(uint index) internal returns (address) {
        if (index == 0) {
            return alice;
        }
        if (index == 1) {
            return bob;
        }
        if (index == 2) {
            return carol;
        }

        return dave; // return dave by default
    }

    function _getKeyTypeValue(KeyHelper.KeyType keyType) internal pure returns (uint256 keyTypeValue) {
        keyTypeValue = 2 ** uint(keyType);
    }

}
