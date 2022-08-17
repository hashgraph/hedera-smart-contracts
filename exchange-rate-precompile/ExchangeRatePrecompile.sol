// SPDX-License-Identifier: Apache-2.0

import "./SelfFunding.sol";


contract ExchangeRatePrecompile is SelfFunding {
    // The USD in cents that must be sent as msg.value
    uint256 toll;
    // ExchangeRate system contract address with ContractID 0.0.360
    address constant PRECOMPILE_ADDRESS = address(0x168);

    constructor(uint256 _toll) {
        toll = _toll;
    }

    function gatedAccess() external payable costsCents(toll) {
        // Hope it was worth it!
    }

    function approxUsdValue() external payable returns (uint256 tinycents) {
        tinycents = tinybarsToTinycents(msg.value);
    }

    function invalidCall() external payable {
        // Should fail, this is not a valid selector 
        (bool success, bytes memory result) = PRECOMPILE_ADDRESS.call(
            abi.encodeWithSelector(ExchangeRatePrecompile.approxUsdValue.selector));
        require(success);
    }
}
