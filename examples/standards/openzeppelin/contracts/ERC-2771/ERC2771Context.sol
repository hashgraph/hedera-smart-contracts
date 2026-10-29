// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract ERC2771ContextTest is ERC2771Context {
    string public message;
    address public sender;
    bytes public msgData;
    event MessageChanged(string message, address forwarder, address sender);

    constructor(address trustedForward) ERC2771Context(trustedForward) {
    }

    function msgSenderTest() public returns (address) {
        sender = _msgSender();
        return _msgSender();
    }

    function msgDataTest() public returns (bytes memory) {
        msgData = _msgData();
        return _msgData();
    }

    function changeMessageTestRequest(string memory _message) external payable returns (bool) {
        message = _message;
        emit MessageChanged(_message, msg.sender, _msgSender());

        return true;
    }
}
