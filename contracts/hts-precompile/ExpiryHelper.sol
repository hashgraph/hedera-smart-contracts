// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "./HederaTokenService.sol";
import "./FeeHelper.sol";

contract ExpiryHelper is FeeHelper {

    function createAutoRenewExpiry(
        address autoRenewAccount,
        int64 autoRenewPeriod
    ) internal view returns (IHederaTokenService.Expiry memory expiry) {
        expiry.autoRenewAccount = autoRenewAccount;
        expiry.autoRenewPeriod = autoRenewPeriod;
    }

    function createSecondExpiry(int64 second) internal view returns (IHederaTokenService.Expiry memory expiry) {
        expiry.second = second;
    }
}