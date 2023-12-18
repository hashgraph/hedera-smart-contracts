// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./ERC777Token.sol";
import "@openzeppelin/contracts/interfaces/IERC1820Registry.sol";


contract ERC777ContractAccount {

    /**
     * @dev Error when call instruction is not successful
     */
    error CallReverted();

    /**
     * @dev hashes of the necessary interfaces
     */
    bytes32 internal constant _TOKENS_SENDER_INTERFACE_HASH = keccak256("ERC777TokensSender");
    bytes32 internal constant _TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    /**
     * @notice currently ERC1820Registry is not deployed on Hedera networks. Therefore, this implementation requires a manual ERC1820Registry deployment
     */
    IERC1820Registry internal immutable _ERC1820_REGISTRY;
    // IERC1820Registry internal constant _ERC1820_REGISTRY = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    /**
     * @dev register interfaces
     */
    constructor(address _erc1820Addr) {
        _ERC1820_REGISTRY = IERC1820Registry(_erc1820Addr);
    }

    /**
     * @dev register ERC777TokensSender interface 
     */
    function registerERC777TokensSender(address _erc777SenderHookImpl) external {
        _ERC1820_REGISTRY.setInterfaceImplementer(address(this), _TOKENS_SENDER_INTERFACE_HASH, _erc777SenderHookImpl);
    }

    /**
     * @dev register ERC777TokensRecipient interface 
     */
    function registerERC777TokensRecipient(address _erc777RecipientHookImpl) external {
        _ERC1820_REGISTRY.setInterfaceImplementer(address(this), _TOKENS_RECIPIENT_INTERFACE_HASH, _erc777RecipientHookImpl);
    }

     /**
     * @dev send an _amount of token to _recipient by calling _erc777tokenAddr.send
     */
    function send(address _erc777tokenAddr, address _recipient, uint256 _amount, bytes memory _data) public {
        (bool success, ) = _erc777tokenAddr.call(
            abi.encodeWithSignature("send(address,uint256,bytes)", _recipient, _amount, _data)
        );

        if (!success) {revert CallReverted();}
    }
}
