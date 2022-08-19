// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
 
 contract hbar2Contract{

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}