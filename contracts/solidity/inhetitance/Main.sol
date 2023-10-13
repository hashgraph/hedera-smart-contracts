// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import { Base } from "./Base.sol";

contract Main is Base {
    function classIdentifier() public pure override(Base) returns (string memory) {
        return "Main";
    }

    function returnThis() public view returns (Main) {
        return this;
    }

    function returnSuper() public view virtual returns (string memory) {
        return super.classIdentifier();
    }

    function destroyContract(address recipient) public returns (bool) {
        selfdestruct(payable(recipient));

        return true;
    }
}
