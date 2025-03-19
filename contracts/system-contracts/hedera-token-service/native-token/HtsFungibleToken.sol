// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./interfaces/IHtsFungibleToken.sol";
import "../IHederaTokenService.sol";
import "../../HederaResponseCodes.sol";
import "../KeyHelper.sol";

/**
 * @title HtsFungibleToken
 * @dev Abstract contract serving as the base for management contract for a native fungible token implementation, combining IHederaTokenService & ERC20 functionality.
 */
abstract contract HtsFungibleToken is IHtsFungibleToken, KeyHelper {

    address constant htsSystemContractAddress = address(0x167);
    address public htsTokenAddress;
    
    event TokenCreated(address tokenAddress, address creatorAddress);

    constructor(
        string memory _name,
        string memory _symbol,
        int64 _initialTotalSupply,
        uint8 _decimals
    ) payable {
        _createHTSToken(_name, _symbol, _initialTotalSupply, _decimals);
    }

    function _setupHTSToken(string memory _name, string memory _symbol) internal virtual returns (IHederaTokenService.HederaToken memory tokenInfo) {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](0);
        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(0, address(this), 8000000);
        tokenInfo = IHederaTokenService.HederaToken(
            _name, _symbol, address(this), "HtsFungibleToken creation", true, 5000, false, keys, expiry
        );
    }

    function _createHTSToken(string memory _name, string memory _symbol, int64 _initialTotalSupply, uint8 _decimals) internal virtual {
        IHederaTokenService.HederaToken memory tokenInfo = _setupHTSToken(_name, _symbol);

        (bool success, bytes memory result) = htsSystemContractAddress.call{value : msg.value}(
            abi.encodeWithSelector(IHederaTokenService.createFungibleToken.selector,
            tokenInfo, _initialTotalSupply, _decimals));

        (int responseCode, address tokenAddress) = success ? abi.decode(result, (int32, address)) : (HederaResponseCodes.UNKNOWN, address(0));

        require(responseCode == HederaResponseCodes.SUCCESS, "Failed to create HTS token");

        htsTokenAddress = tokenAddress;
        emit TokenCreated(tokenAddress, address(this));
    }

    function name() external view returns (string memory) {
        return IHtsFungibleToken(htsTokenAddress).name();
    }

    function symbol() external view returns (string memory) {
        return IHtsFungibleToken(htsTokenAddress).symbol();
    }

    function decimals() external view returns (uint8) {
        return IHtsFungibleToken(htsTokenAddress).decimals();
    }

    function totalSupply() external view returns (uint256) {
        return IHtsFungibleToken(htsTokenAddress).totalSupply();
    }

    function balanceOf(address account) external view returns (uint256) {
        return IHtsFungibleToken(htsTokenAddress).balanceOf(account);
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return IHtsFungibleToken(htsTokenAddress).allowance(owner, spender);
    }

    // native token transfer, transferFrom and approve functions intended to operate on native HTS token require 
    function transfer(address recipient, uint256 amount) external returns (bool) {
        (bool success, ) = address(IHtsFungibleToken(htsTokenAddress)).delegatecall(abi.encodeWithSignature("transfer(address,uint256)", recipient, amount));
        require(success, "Delegate transfer call failed");
        return success;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        (bool success, ) = address(IHtsFungibleToken(htsTokenAddress)).delegatecall(abi.encodeWithSignature("transferFrom(address,address,uint256)", sender, recipient, amount));
        require(success, "Delegate transferFrom call failed");
        return success;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        (bool success, ) = address(IHtsFungibleToken(htsTokenAddress)).delegatecall(abi.encodeWithSignature("approve(address,uint256)", spender, amount));
        require(success, "Delegate approve call failed");
        return success;
    }

    /// Query fungible token info
    /// @return responseCode The response code for the status of the request. SUCCESS is 22.
    /// @return fungibleTokenInfo FungibleTokenInfo info for `token`
    function getFungibleTokenInfo() external returns (int64 responseCode, FungibleTokenInfo memory fungibleTokenInfo) {
        (bool success, bytes memory result) = htsSystemContractAddress.call(
            abi.encodeWithSelector(IHederaTokenService.getFungibleTokenInfo.selector, htsTokenAddress)
        );

        FungibleTokenInfo memory defaultTokenInfo;
        (responseCode, fungibleTokenInfo) = success ? abi.decode(result, (int64, FungibleTokenInfo)) : (HederaResponseCodes.UNKNOWN, defaultTokenInfo);
        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: getFungibleTokenInfo failed");
    }
}
