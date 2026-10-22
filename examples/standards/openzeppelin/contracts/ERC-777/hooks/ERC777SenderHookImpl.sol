// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC777Sender.sol";
import "@openzeppelin/contracts/interfaces/IERC1820Implementer.sol";

contract ERC777SenderHookImpl is IERC777Sender, IERC1820Implementer{

    /**
     * @dev hash of ERC1820_ACCEPT_MAGIC
     *
     * @notice required by ERC1820
     */
    bytes32 internal constant ERC1820_ACCEPT_MAGIC = keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    /**
     * @dev Emitted when tokensReceived hook is called
     */
    event ERC777SenderHook(address operator, address from, address to, uint256 amount, bytes userData, bytes operatorData);

    /**
     * @dev Called by an {IERC777} token contract whenever tokens are being
     * moved or created into a registered account (`to`). The type of operation
     * is conveyed by `from` being the zero address or not.
     *
     * This call occurs _after_ the token contract's state is updated, so
     * {IERC777-balanceOf}, etc., can be used to query the post-operation state.
     *
     * @notice this function may be overriden to implement more logic
     */
    function tokensToSend(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external virtual {
        emit ERC777SenderHook(operator, from, to, amount, userData, operatorData);
    }

    /**
     * @dev {see IERC1820Implementer-canImplementInterfaceForAddress}
     */
    function canImplementInterfaceForAddress(bytes32, address) external pure returns (bytes32) {
        return ERC1820_ACCEPT_MAGIC;
    }
}
