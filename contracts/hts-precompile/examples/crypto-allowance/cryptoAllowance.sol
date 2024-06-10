// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "../../HederaTokenService.sol";
import "../../HederaAccountService.sol";

contract CryptoAllowance is HederaAccountService, HederaTokenService {
    event ResponseCode(int responseCode);
    event HbarAllowance(address owner, address spender, int256 amount);

    function hbarApprovePublic(address owner, address spender, int256 amount) public returns (int64 responseCode) {
        responseCode = HederaAccountService.hbarApprove(owner, spender, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function hbarAllowancePublic(address owner, address spender) public {
        (int64 responseCode, int256 amount) = HederaAccountService.hbarAllowance(owner, spender);
        emit ResponseCode(responseCode);
        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
        emit HbarAllowance(owner, spender, amount);
    }

    function cryptoTransferPublic(IHederaTokenService.TransferList calldata transferList, IHederaTokenService.TokenTransferList[] calldata tokenTransferList) public returns (int responseCode) {
        responseCode = HederaTokenService.cryptoTransfer(transferList, tokenTransferList);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
}
