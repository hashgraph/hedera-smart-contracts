// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import {IHRC719} from "../../IHRC719.sol";
import {IHRC904} from "../../IHRC904.sol";

contract HRC904Contract {
    event IsAssociated(bool status);

    function cancelAirdropFT(address token, address receiver) public returns (int64 responseCode) {
        return IHRC904(token).cancelAirdropFT(receiver);
    }

    function cancelAirdropNFT(address token, address receiver, int64 serial) public returns (int64 responseCode) {
        return IHRC904(token).cancelAirdropNFT(receiver, serial);
    }

    function claimAirdropFT(address token, address sender) public returns (int64 responseCode) {
        return IHRC904(token).claimAirdropFT(sender);
    }

    function claimAirdropNFT(address token, address sender, int64 serial) public returns (int64 responseCode) {
        return IHRC904(token).claimAirdropNFT(sender, serial);
    }

    function rejectTokenFT(address token) public returns (int64 responseCode) {
        return IHRC904(token).rejectTokenFT();
    }

    function rejectTokenNFTs(address token, int64[] memory serialNumbers) public returns (int64 responseCode) {
        return IHRC904(token).rejectTokenNFTs(serialNumbers);
    }

    function setUnlimitedAssociations(address account, bool enableAutoAssociations) public returns (int64 responseCode) {
        return IHRC904(account).setUnlimitedAutomaticAssociations(enableAutoAssociations);
    }

    function associate(address token) public returns (uint256 responseCode) {
        return IHRC719(token).associate();
    }

    function dissociate(address token) public returns (uint256 responseCode) {
        return IHRC719(token).dissociate();
    }

    function isAssociated(address token) public view returns (bool associated) {
        return IHRC719(token).isAssociated();
    }
}
