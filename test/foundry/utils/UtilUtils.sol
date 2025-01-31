// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import 'forge-std/Test.sol';

import '../mocks/prng-system-contract/PRNGSytemContractMock.sol';
import './CommonUtils.sol';
import '../../../contracts/libraries/Constants.sol';

/// for testing actions of the util precompiled/system contract
abstract contract UtilUtils is Test, CommonUtils, Constants {

    PRNGSytemContractMock utilPrecompile = PRNGSytemContractMock(UTIL_PRECOMPILE);

    function _setUpPRNGSytemContractMock() internal {
        PRNGSytemContractMock prngSytemContractMock = new PRNGSytemContractMock();
        bytes memory code = address(prngSytemContractMock).code;
        vm.etch(UTIL_PRECOMPILE, code);
    }

    function _doCallPseudorandomSeed(address sender) internal setPranker(sender) returns (bytes32 seed) {
        seed = utilPrecompile.getPseudorandomSeed();
    }
}
