// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev This contract is an example of a simple voting system.
 */
contract VoteV1 is Context, Initializable {
    /**
     * @dev version of the vote system
     */
    uint256 _version;

    /**
     * @dev a list of voters
     */
    address[] _voters;

    /**
     * @dev voters have voted
     */
    mapping(address => bool) _voted;

    /**
     * @dev The caller has already voted
     */
    error Voter_Has_Already_Voted();

    /**
     * @dev modifier to only allow callers who have not voted to execute the calling method
     * @param voter the voter to check
     */
    modifier mustHaveNotVoted(address voter) {
        if (voted(voter)) {
            revert Voter_Has_Already_Voted();
        }
        _;
    }

    /**
     * @dev Initializes the vote system version 1
     */
    constructor() {
        _version = 1;
    }

    /**
     * @dev Initializes the vote system version 1
     */
    function initialize() external initializer {
        _version = 1;
    }

    /**
     * @dev Add a voter to the vote system
     */
    function vote() external mustHaveNotVoted(_msgSender()) {
        _voters.push(_msgSender());
        _voted[_msgSender()] = true;
    }

    /**
     * @dev Returs the list of voters
     */
    function voters() external view returns (address[] memory) {
        return _voters;
    }

    /**
     * @dev Checks if a voter has already voted
     * @param voter the voter to check
     * @return true if the voter has already voted, false otherwise
     */
    function voted(address voter) public view returns (bool) {
        return _voted[voter];
    }

    /**
     * @dev Returns the version of the vote system
     */
    function version() external view returns(uint256) {
        return _version;
    }

}
