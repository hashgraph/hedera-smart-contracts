// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.4.9 <0.9.0;

import "./HtsFungibleToken.sol";
import "../IHederaTokenService.sol";
import "../IHTSStructs.sol";
import "../../HederaResponseCodes.sol";
import "../KeyHelper.sol";
import "../examples/hrc-719/HRC719Contract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HtsFungibleTokenSupplyManager
 * @dev Abstract contract serving as the base for management contract for a native fungible token implementation, combining IHederaTokenService & ERC20 functionality.
 * This contract supports mint, mintTo and burn functions.
 * burnFrom support requires an account set the management contract as a one of the admin keys for the account.
 */
abstract contract HtsFungibleTokenSupplyManager is HtsFungibleToken, Ownable {

    constructor(
        string memory _name,
        string memory _symbol,
        int64 _initialTotalSupply,
        uint8 _decimals,
        address _supplyDelegate
    )  HtsFungibleToken(_name, _symbol, _initialTotalSupply, _decimals) Ownable(_supplyDelegate) payable {
    } 

    function _setupHTSToken(string memory _name, string memory _symbol) internal view override returns (IHederaTokenService.HederaToken memory tokenInfo) {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = getSingleKey(
            KeyType.SUPPLY,
            KeyValueType.INHERIT_ACCOUNT_KEY,
            bytes("")
        );
        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry(0, address(this), 8000000);
        tokenInfo = IHederaTokenService.HederaToken(
            _name, _symbol, address(this), "HtsFungibleToken creation", true, 5000, false, keys, expiry
        );
    }

    function mint(uint256 amount) public onlyOwner returns (int responseCode, int64 newTotalSupply) {
        (bool success, bytes memory result) = htsSystemContractAddress.call(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector,
            htsTokenAddress, amount, new bytes[](0)));
        (responseCode, newTotalSupply, ) = success ? abi.decode(result, (int32, int64, int64[]))
            : (HederaResponseCodes.UNKNOWN, int64(0), new int64[](0));

        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: Mint failed");
    }

    function mintTo(address to, uint256 amount) public onlyOwner returns (int responseCode, int64 newTotalSupply) {
        (bool success, bytes memory result) = htsSystemContractAddress.call(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector,
            htsTokenAddress, amount, new bytes[](0)));
        (responseCode, newTotalSupply, ) = success ? abi.decode(result, (int32, int64, int64[]))
            : (HederaResponseCodes.UNKNOWN, int64(0), new int64[](0));

        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: Mint failed");

        (success, result) = htsSystemContractAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferToken.selector,
            htsTokenAddress, address(this), to, amount));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: Transfer failed");
    }

    function burn(uint256 amount) public onlyOwner returns (int responseCode, int64 newTotalSupply) {
        (bool success, bytes memory result) = htsSystemContractAddress.call(
            abi.encodeWithSelector(IHederaTokenService.burnToken.selector,
            htsTokenAddress, amount, new bytes[](0)));
        
        (responseCode, newTotalSupply) = success ? abi.decode(result, (int32, int64))
            : (HederaResponseCodes.UNKNOWN, int64(0));

        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: Burn failed");
    }

    function burnFrom(address from, uint256 amount) public onlyOwner returns (int responseCode, int64 newTotalSupply) {
        (bool success, bytes memory result) = htsSystemContractAddress.call(
            abi.encodeWithSelector(IHederaTokenService.transferToken.selector,
            htsTokenAddress, from, address(this), amount));
        responseCode = success ? abi.decode(result, (int32)) : HederaResponseCodes.UNKNOWN;
        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: Transfer failed");

        (success, result) = htsSystemContractAddress.call(
            abi.encodeWithSelector(IHederaTokenService.burnToken.selector,
            htsTokenAddress, amount, new bytes[](0)));
        
        (responseCode, newTotalSupply) = success ? abi.decode(result, (int32, int64))
            : (HederaResponseCodes.UNKNOWN, int64(0));

        require(responseCode == HederaResponseCodes.SUCCESS, "HTS: Burn failed");
        // other approach would be a wipe but need to check
    }
}
