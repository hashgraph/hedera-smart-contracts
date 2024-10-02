// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import './utils/UtilUtils.sol';

contract PRNGSytemContractMockTest is UtilUtils {

    mapping(bytes32 => bool) private seeds; // use mapping over list as it's much faster to index

    // setUp is executed before each and every test function
    function setUp() public {
        _setUpPRNGSytemContractMock();
        _setUpAccounts();
    }

    function test_CallPseudoRandomSeed() public {

        uint256 iterations = 10000;

        address sender = alice;
        bytes32 seed;

        for (uint256 i = 0; i < iterations; i++) {
            seed = _doCallPseudorandomSeed(sender);

            if (seeds[seed]) {
                revert("seed already exists");
            }

            seeds[seed] = true;

            sender = _getAccount(uint256(seed) % NUM_OF_ACCOUNTS);
        }
    }

}

// forge test --match-contract PRNGSytemContractMockTest -vv
