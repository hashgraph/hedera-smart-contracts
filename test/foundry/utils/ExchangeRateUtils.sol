// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.9;

import 'forge-std/Test.sol';

import '../mocks/exchange-rate-system-contract/ExchangeRateSystemContractMock.sol';
import './CommonUtils.sol';
import '../../../contracts/libraries/Constants.sol';

/// for testing actions of the exchange rate precompiled/system contract
abstract contract ExchangeRateUtils is Test, CommonUtils, Constants {

    ExchangeRateSystemContractMock exchangeRateSystemContract = ExchangeRateSystemContractMock(EXCHANGE_RATE_PRECOMPILE);

    function _setUpExchangeRateSystemContractMock() internal {
        ExchangeRateSystemContractMock exchangeRateSystemContractMock = new ExchangeRateSystemContractMock();
        bytes memory code = address(exchangeRateSystemContractMock).code;
        vm.etch(EXCHANGE_RATE_PRECOMPILE, code);
        _doUpdateRate(1e7);
    }

    function _doConvertTinycentsToTinybars(uint256 tinycents) internal returns (uint256 tinybars) {

        tinybars = exchangeRateSystemContract.tinycentsToTinybars(tinycents);

    }

    function _doConvertTinybarsToTinycents(uint256 tinybars) internal returns (uint256 tinycents) {

        tinycents = exchangeRateSystemContract.tinybarsToTinycents(tinybars);

    }

    function _doUpdateRate(uint256 newRate) internal {

        exchangeRateSystemContract.updateRate(newRate);

    }

}
