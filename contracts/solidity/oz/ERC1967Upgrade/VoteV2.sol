// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import './VoteV1.sol';
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev This contract is an upgraded version of the VoteV1
 */
contract VoteV2 is Initializable, VoteV1 {

    /**
     * @dev The caller has not voted
     */
    error Voter_Has_Not_Voted();

    /**
     * @dev modifier to only allow callers who have voted to execute the calling method
     * @param voter the voter to check
     */
    modifier mustHaveVoted(address voter) {
        if (!_voted[voter]) {
            revert Voter_Has_Not_Voted();
        }
        _;
    }

    /**
     * @dev Initialize the vote system version 2
     */
    constructor() {
        _version = 2;
    }

    /**
     * @dev Initializes the vote system version 2
     */
    function initializeV2() external reinitializer(2) {
        _version = 2;
    }

    /**
     * @dev Allows callers to withdraw their votes
     */
    function withdrawVote() external mustHaveVoted(_msgSender()) {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] == _msgSender()) {
                for (uint256 j = i; j < _voters.length - 1; j++) {
                    _voters[j] = _voters[j+1];
                }
                break;
            }
        }
        _voted[_msgSender()] = false;
        _voters.pop();
    }

}
