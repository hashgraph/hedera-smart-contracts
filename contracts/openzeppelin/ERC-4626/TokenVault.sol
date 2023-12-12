// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../ERC-20/ERC20Mock.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract TokenVault is ERC4626 {

    // a mapping that checks if a user has deposited the token
    mapping(address => uint256) public shareHolders;

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) {
       
    }

    function _deposit(uint256 _assets) public {
        // checks that the deposited amount is greater than zero.
        require(_assets > 0, "Deposit is zero");
        // calling the deposit function from the ERC-4626 library to perform all the necessary functionality
        deposit(_assets, msg.sender);
        // Increase the share of the user
        shareHolders[msg.sender] += _assets;
    }

    function _withdraw(uint256 _shares, address _receiver) public {
        // checks that the deposited amount is greater than zero.
        require(_shares > 0, "withdraw must be greater than Zero");
        // Checks that the _receiver address is not zero.
        require(_receiver != address(0), "Zero Address");
        // checks that the caller is a shareholder
        require(shareHolders[msg.sender] > 0, "Not a shareHolder");
        // checks that the caller has more shares than they are trying to withdraw.
        require(shareHolders[msg.sender] >= _shares, "Not enough shares");
        // Calculate 10% yield on the withdraw amount
        uint256 percent = (10 * _shares) / 100;
        // Calculate the total asset amount as the sum of the share amount plus 10% of the share amount.
        uint256 assets = _shares + percent;
        // Decrease the share of the user
        shareHolders[msg.sender] -= _shares;
        // calling the redeem function from the ERC-4626 library to perform all the necessary functionality
        redeem(assets, _receiver, msg.sender);                
    }

    // returns total number of assets
    function totalAssets() public view override returns (uint256) {
        return super.totalAssets();
    }

    function totalAssetsOfUser(address _user) public view returns (uint256) {
        return shareHolders[_user];
    }   

}
