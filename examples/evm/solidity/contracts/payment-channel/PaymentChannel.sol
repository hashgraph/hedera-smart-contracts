// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/// resource: https://docs.soliditylang.org/en/latest/solidity-by-example.html#the-full-contract 

contract PaymentChannel {
    address payable public sender;      // The account sending payments.
    address payable public recipient;   // The account receiving the payments.
    uint256 public expiration;  // Timeout in case the recipient never closes.

    event AccountBalances( uint256 contractBalance, uint256 senderBalance, uint256 recipientBalance);

    constructor (address payable recipientAddress, uint256 duration) payable {
        sender = payable(msg.sender);
        recipient = recipientAddress;
        expiration = block.timestamp + duration;
    }

    /// the recipient can close the channel at any time by presenting a
    /// signed amount from the sender. the recipient will be sent that amount,
    /// and the remainder will go back to the sender
    function close(uint256 amount, bytes memory signature) external {
        require(msg.sender == recipient);
        require(isValidSignature(amount, signature));

        // emit an event containing balances before closing the channel => easier to keep track of balances and ignore transaction fees
        emit AccountBalances(address(this).balance, sender.balance, recipient.balance);

        // closing - distributing crypto logic
        recipient.transfer(amount);
        sender.transfer(address(this).balance);

        // emit an event containing balances after closing the channel
        emit AccountBalances( address(this).balance, sender.balance, recipient.balance);
    }

    /// the sender can extend the expiration at any time
    function extend(uint256 newExpiration) external {
        require(msg.sender == sender);
        require(newExpiration > expiration);

        expiration = newExpiration;
    }

    /// if the timeout is reached without the recipient closing the channel,
    /// then the Ether is released back to the sender.
    function claimTimeout() external {
        require(block.timestamp >= expiration);
        sender.transfer(address(this).balance);
    }

    /// must verify that the signature is a valid signature signed by the sender
    function isValidSignature(uint256 amount, bytes memory signature)
        internal
        view
        returns (bool)
    {
        // prefix used in Ethereum when signing a message.
        bytes32 message = prefixed(keccak256(abi.encodePacked(this, amount)));

        // check that the signature is from the payment sender
        return recoverSigner(message, signature) == sender;
    }

    /// split bytes signature into r, s, v values
    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        // a valid signature must have 65 bytes
        require(sig.length == 65);

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    /// recover the sender's address based on message and signature
    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

        return ecrecover(message, v, r, s);
    }

    /// builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}