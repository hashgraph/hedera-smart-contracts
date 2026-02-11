// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";
import { IClprQueue } from "../interfaces/IClprQueue.sol";
import { IClprMiddleware } from "../interfaces/IClprMiddleware.sol";

/// @title Mock CLPR Relayed Queue
/// @author Hashgraph
/// @notice Minimal "outbox/inbox" queue that relies on an off-chain relayer to move messages between ledgers.
/// @dev This contract exists to support multi-network CLPR testing before the real messaging layer is integrated.
///      It provides:
///      - an outbox for request/response bytes produced on this ledger, and
///      - inbox entrypoints a relayer can call to deliver requests/responses from another ledger.
///
///      The queue is the caller for middleware entrypoints, preserving the middleware's `onlyQueue` protections.
contract MockClprRelayedQueue is IClprQueue {
    /// @notice Thrown when a non-admin attempts an admin-only action.
    error AdminOnly();

    /// @notice Thrown when attempting to use the queue before middleware is configured.
    error MiddlewareNotConfigured();

    /// @notice Thrown when attempting to enqueue from a non-middleware caller.
    error MiddlewareOnly();

    /// @notice Thrown when attempting to read a missing outbound message.
    error MessageNotFound();

    /// @notice Thrown when attempting to read a missing pending response.
    error ResponseNotFound();

    /// @notice Queue admin authority (deployment-time).
    address public immutable admin;

    /// @notice Local middleware instance this queue is attached to.
    address public middleware;

    /// @notice Next messaging-layer message id assigned to outbound requests on this ledger.
    uint64 public nextMessageId;

    /// @notice Next messaging-layer id assigned to outbound responses on this ledger (not used for app correlation).
    uint64 public nextResponseId;

    /// @notice ABI-encoded outbound request messages keyed by local message id.
    mapping(uint64 => bytes) private _outboundMessages;

    /// @notice ABI-encoded outbound response messages keyed by local response id.
    mapping(uint64 => bytes) private _outboundResponses;

    /// @notice ABI-encoded responses produced for delivered inbound requests, keyed by original request id.
    mapping(uint64 => bytes) private _pendingResponsesByOriginalMessageId;

    /// @notice True if an inbound request `messageId` has already been processed (idempotency).
    mapping(uint64 => bool) public inboundMessageProcessed;

    /// @notice True if an inbound response for `originalMessageId` has already been delivered (idempotency).
    mapping(uint64 => bool) public inboundResponseDelivered;

    /// @notice Emitted when this queue is attached to a middleware instance.
    event MiddlewareConfigured(address indexed middleware);

    /// @notice Emitted when an outbound request is enqueued (stored in the outbox).
    event OutboundMessageStored(uint64 indexed messageId, bytes32 messageHash);

    /// @notice Emitted when an outbound response is enqueued (stored in the outbox).
    event OutboundResponseStored(uint64 indexed responseId, uint64 indexed originalMessageId, bytes32 responseHash);

    /// @notice Emitted when an inbound request is delivered and processed, producing a pending response.
    event InboundMessageProcessed(
        uint64 indexed messageId,
        ClprTypes.ClprMiddlewareStatus status,
        bytes32 responseHash
    );

    /// @notice Emitted when an inbound response is delivered to local middleware.
    event InboundResponseDelivered(uint64 indexed originalMessageId, ClprTypes.ClprMiddlewareStatus status);

    constructor() {
        admin = msg.sender;
    }

    /// @notice Attaches this queue to a local middleware instance (admin-only).
    /// @dev The middleware is deployed with the queue address; this setter completes wiring in deployments.
    function configureMiddleware(address middlewareAddress) external {
        if (msg.sender != admin) revert AdminOnly();
        if (middlewareAddress == address(0)) revert MiddlewareNotConfigured();
        middleware = middlewareAddress;
        emit MiddlewareConfigured(middlewareAddress);
    }

    /// @inheritdoc IClprQueue
    function enqueueMessage(ClprTypes.ClprMessage calldata message) external returns (uint64 messageId) {
        if (middleware == address(0)) revert MiddlewareNotConfigured();
        if (msg.sender != middleware) revert MiddlewareOnly();

        messageId = ++nextMessageId;
        bytes memory encoded = abi.encode(message);
        _outboundMessages[messageId] = encoded;
        emit OutboundMessageStored(messageId, keccak256(encoded));
    }

    /// @inheritdoc IClprQueue
    function enqueueMessageResponse(
        ClprTypes.ClprMessageResponse calldata response
    ) external returns (uint64 responseId) {
        if (middleware == address(0)) revert MiddlewareNotConfigured();
        if (msg.sender != middleware) revert MiddlewareOnly();

        responseId = ++nextResponseId;
        bytes memory encoded = abi.encode(response);
        _outboundResponses[responseId] = encoded;
        emit OutboundResponseStored(responseId, response.originalMessageId, keccak256(encoded));
    }

    /// @notice Returns ABI-encoded outbound request bytes for `messageId`.
    function getOutboundMessageBytes(uint64 messageId) external view returns (bytes memory messageBytes) {
        messageBytes = _outboundMessages[messageId];
        if (messageBytes.length == 0) revert MessageNotFound();
    }

    /// @notice Returns ABI-encoded outbound response bytes for `responseId`.
    function getOutboundResponseBytes(uint64 responseId) external view returns (bytes memory responseBytes) {
        responseBytes = _outboundResponses[responseId];
        if (responseBytes.length == 0) revert ResponseNotFound();
    }

    /// @notice Returns ABI-encoded pending response bytes for `originalMessageId`.
    function getPendingResponseBytes(uint64 originalMessageId) external view returns (bytes memory responseBytes) {
        responseBytes = _pendingResponsesByOriginalMessageId[originalMessageId];
        if (responseBytes.length == 0) revert ResponseNotFound();
    }

    /// @notice Delivers an inbound request from another ledger and stores the resulting response.
    /// @dev Intended to be called by an off-chain relayer.
    /// @param messageId Messaging-layer id assigned on the source ledger.
    /// @param encodedMessage ABI-encoded `ClprTypes.ClprMessage`.
    function deliverInboundMessage(uint64 messageId, bytes calldata encodedMessage) external {
        if (middleware == address(0)) revert MiddlewareNotConfigured();
        if (inboundMessageProcessed[messageId]) return;

        ClprTypes.ClprMessage memory message = abi.decode(encodedMessage, (ClprTypes.ClprMessage));
        ClprTypes.ClprMessageResponse memory response = IClprMiddleware(middleware).handleMessage(message, messageId);

        bytes memory responseBytes = abi.encode(response);
        _pendingResponsesByOriginalMessageId[messageId] = responseBytes;
        inboundMessageProcessed[messageId] = true;

        emit InboundMessageProcessed(messageId, response.middlewareResponse.status, keccak256(responseBytes));
    }

    /// @notice Delivers an inbound response from another ledger to local middleware.
    /// @dev Intended to be called by an off-chain relayer.
    /// @param encodedResponse ABI-encoded `ClprTypes.ClprMessageResponse`.
    function deliverInboundResponse(bytes calldata encodedResponse) external {
        if (middleware == address(0)) revert MiddlewareNotConfigured();

        ClprTypes.ClprMessageResponse memory response = abi.decode(encodedResponse, (ClprTypes.ClprMessageResponse));
        uint64 originalMessageId = response.originalMessageId;
        if (inboundResponseDelivered[originalMessageId]) return;

        IClprMiddleware(middleware).handleMessageResponse(response);
        inboundResponseDelivered[originalMessageId] = true;

        emit InboundResponseDelivered(originalMessageId, response.middlewareResponse.status);
    }
}

