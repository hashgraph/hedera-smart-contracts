// SPDX-License-Identifier: Apache-2.0 
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract ERC20VotesTest is ERC20, ERC20Permit, ERC20Votes {
    constructor(uint initialMintAmmount) ERC20("MyToken", "MTK") ERC20Permit("MyToken") {
        _mint(msg.sender, initialMintAmmount);
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    /// @notice Returns the current consensus timestamp
    /// @dev Overrides the default block number-based implementation to use timestamps instead
    /// @dev This modification is specific to Hedera's architecture where:
    /// @dev - block.number refers to record file indices which don't reflect transaction timing
    /// @dev - block.timestamp provides the actual consensus timestamp when the transaction executed
    /// @return The current consensus timestamp as a uint48
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /// @notice Returns a machine-readable description of the timestamp-based clock implementation
    /// @dev Overrides the default implementation to reflect the use of timestamps instead of block numbers
    /// @return A string describing the clock mode configuration
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view override returns (string memory) {
        // Check that the clock was not modified
        if (clock() != block.timestamp) {
            revert ERC6372InconsistentClock();
        }
        return "mode=blocknumber&from=default";
    }

}
