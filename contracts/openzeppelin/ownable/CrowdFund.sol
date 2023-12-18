// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract CrowdFund is Context, Ownable {
    /// STATE
    uint256 private _balance;

    /// EVENTS
    event Deposit(address depositer, uint256 amount);
    event Withdraw(address withdrawer, uint256 amount);

    /// ERRORS
    error InsufficientBalance(uint256 balance);
    error WithdrawlError(uint256 amount);

    /// CONSTRUCTOR
    constructor(address _owner) Ownable(_owner) {}

    /**
     * @dev Allows any funder to fund this contract with arbitary amount
     */
    function deposit() external payable {
        _balance += msg.value;
        emit Deposit(_msgSender(), msg.value);
    }

    /**
     * @dev Allows the owner of the contract to withdraw a specific amount
     *
     * @param amount The amount to be withdrawn
     */
    function withdraw(uint256 amount) external onlyOwner {
        /// check
        if (amount > _balance) {
            revert InsufficientBalance(_balance);
        }

        /// effect
        _balance -= amount;

        /// interaction
        (bool success,) = _msgSender().call{value: amount}("");
        if (!success)  {
            revert WithdrawlError(amount);
        }

        /// emit event
        emit Withdraw(_msgSender(), amount);
    }

    /**
     * @dev Returns the current contract balance
     */
    function balance() external view returns(uint256) {
        return _balance;
    }
}