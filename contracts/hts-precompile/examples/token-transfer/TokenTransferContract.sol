// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.5.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "../../FeeHelper.sol";

contract TokenTransferContract is FeeHelper {

    event ResponseCode(int responseCode);

    function cryptoTransferPublic(IHederaTokenService.TransferList calldata transferList, IHederaTokenService.TokenTransferList[] calldata tokenTransferList) public returns (int responseCode) {
        responseCode = HederaTokenService.cryptoTransfer(transferList, tokenTransferList);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function transferTokensPublic(address token, address[] memory accountId, int64[] memory amount) external returns (int256 responseCode) {
        responseCode = HederaTokenService.transferTokens(token, accountId, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function transferNFTsPublic(address token, address[] memory sender, address[] memory receiver, int64[] memory serialNumber) external returns (int256 responseCode) {
        responseCode = HederaTokenService.transferNFTs(token, sender, receiver, serialNumber);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function transferTokenPublic(address token, address sender, address receiver, int64 amount) public returns (int responseCode) {
        responseCode = HederaTokenService.transferToken(token, sender, receiver, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }

    function transferNFTPublic(address token, address sender, address receiver, int64 serialNumber) public returns (int responseCode) {
        responseCode = HederaTokenService.transferNFT(token, sender, receiver, serialNumber);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function transferFromPublic(address token, address from, address to, uint256 amount) public returns (int64 responseCode) {
        responseCode = this.transferFrom(token, from, to, amount);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function transferFromNFTPublic(address token, address from, address to, uint256 serialNumber) public returns (int64 responseCode) {
        responseCode = this.transferFromNFT(token, from, to, serialNumber);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function associateTokenPublic(address account, address token) public returns (int responseCode) {
        responseCode = HederaTokenService.associateToken(account, token);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert ();
        }
    }

    function grantTokenKycPublic(address token, address account) external returns (int64 responseCode) {
        (responseCode) = this.grantTokenKyc(token, account);
        emit ResponseCode(responseCode);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }
    }
}