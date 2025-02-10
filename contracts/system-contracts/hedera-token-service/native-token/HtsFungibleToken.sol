// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./interfaces/IHtsFungibleToken.sol";
import "../IHederaTokenService.sol";
import "../../HederaResponseCodes.sol";
import "../KeyHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

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

    function name() public view returns (string memory) {
        return IERC20Metadata(htsTokenAddress).name();
    }

    function symbol() public view returns (string memory) {
        return IERC20Metadata(htsTokenAddress).symbol();
    }

    function decimals() public view returns (uint8) {
        return IERC20Metadata(htsTokenAddress).decimals();
    }

    function totalSupply() external view returns (uint256) {
        return IERC20(htsTokenAddress).totalSupply();
    }

    function balanceOf(address account) external view returns (uint256) {
        return IERC20(htsTokenAddress).balanceOf(account);
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return IERC20(htsTokenAddress).allowance(owner, spender);
    }

    // native token transfer, transferFrom and approve functions intended to operate on native HTS token require 
    function transfer(address recipient, uint256 amount) external returns (bool) {
        (bool success, ) = address(IERC20(htsTokenAddress)).delegatecall(abi.encodeWithSignature("transfer(address,uint256)", recipient, amount));
        require(success, "Delegate transfer call failed");
        return success;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        (bool success, ) = address(IERC20(htsTokenAddress)).delegatecall(abi.encodeWithSignature("transferFrom(address,address,uint256)", sender, recipient, amount));
        require(success, "Delegate transferFrom call failed");
        return success;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        (bool success, ) = address(IERC20(htsTokenAddress)).delegatecall(abi.encodeWithSignature("approve(address,uint256)", spender, amount));
        require(success, "Delegate approve call failed");
        return success;
    }
}
