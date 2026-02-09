// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";
import { IClprQueue } from "../interfaces/IClprQueue.sol";
import { IClprMiddleware } from "../interfaces/IClprMiddleware.sol";

/// @title Mock CLPR Queue
/// @author Hashgraph
/// @notice In-memory messaging-layer mock that assigns message ids and delivers to middleware.
/// @dev This mock simulates an asynchronous messaging boundary by *storing* responses for later delivery.
///      This keeps middleware behavior closer to the spec, where responses arrive after the send call returns.
contract MockClprQueue is IClprQueue {
    /// @notice Thrown when attempting to enqueue before configuring middleware endpoints.
    error EndpointsNotConfigured();

    /// @notice Thrown when a non-admin attempts to configure endpoints.
    error AdminOnly();

    /// @notice Thrown when attempting to deliver a response that is not pending.
    error ResponseNotFound();

    /// @notice Thrown when attempting to store a response for a message that already has a pending response.
    error ResponseAlreadyPending();

    /// @notice Address allowed to configure middleware endpoints (deployment-time admin).
    address public immutable admin;

    /// @notice Source-side middleware that receives inbound responses.
    address public sourceMiddleware;

    /// @notice Destination-side middleware that receives inbound requests.
    address public destinationMiddleware;

    /// @notice Next messaging-layer message id for outbound request messages.
    uint64 public nextMessageId;

    /// @notice Next messaging-layer message id for outbound response messages (not used for app correlation).
    uint64 public nextResponseId;

    /// @notice Stored responses pending delivery back to the source middleware.
    /// @dev Keyed by the request message id (`originalMessageId`).
    mapping(uint64 => ClprTypes.ClprMessageResponse) private _pendingResponses;

    /// @notice Emitted when the mock queue endpoints are configured.
    event EndpointsConfigured(address indexed sourceMiddleware, address indexed destinationMiddleware);

    /// @notice Emitted when a request message is enqueued.
    event MessageEnqueued(
        uint64 indexed messageId,
        address indexed senderApplicationId,
        address indexed destinationApplicationId,
        bytes32 sourceConnectorId,
        bytes32 destinationConnectorId
    );

    /// @notice Emitted when a response message is enqueued.
    event MessageResponseEnqueued(
        uint64 indexed responseId,
        uint64 indexed originalMessageId,
        ClprTypes.ClprMiddlewareStatus status
    );

    /// @notice Emitted when a response is delivered to the source middleware.
    event MessageResponseDelivered(uint64 indexed originalMessageId);

    constructor() {
        admin = msg.sender;
    }

    /// @notice Configures the source and destination middleware endpoints for this mock connection.
    /// @param sourceMiddlewareAddress Source middleware instance that will receive responses.
    /// @param destinationMiddlewareAddress Destination middleware instance that will receive requests.
    function configureEndpoints(address sourceMiddlewareAddress, address destinationMiddlewareAddress) external {
        if (msg.sender != admin) revert AdminOnly();
        sourceMiddleware = sourceMiddlewareAddress;
        destinationMiddleware = destinationMiddlewareAddress;
        emit EndpointsConfigured(sourceMiddlewareAddress, destinationMiddlewareAddress);
    }

    /// @inheritdoc IClprQueue
    function enqueueMessage(ClprTypes.ClprMessage calldata message) external returns (uint64 messageId) {
        if (sourceMiddleware == address(0) || destinationMiddleware == address(0)) revert EndpointsNotConfigured();

        messageId = ++nextMessageId;
        emit MessageEnqueued(
            messageId,
            message.senderApplicationId,
            message.applicationMessage.recipientId,
            message.applicationMessage.connectorId,
            message.destinationConnectorId
        );

        // Deliver to destination middleware and receive the response envelope.
        ClprTypes.ClprMessageResponse memory response = IClprMiddleware(destinationMiddleware).handleMessage(
            message,
            messageId
        );

        // Enqueue response back to the source ledger (but do not deliver synchronously).
        _storeMessageResponse(response);
    }

    /// @inheritdoc IClprQueue
    function enqueueMessageResponse(
        ClprTypes.ClprMessageResponse calldata response
    ) external returns (uint64 responseId) {
        ClprTypes.ClprMessageResponse memory responseCopy = response;
        responseId = _storeMessageResponse(responseCopy);
    }

    /// @notice Delivers a previously-enqueued response to the configured source middleware.
    /// @param originalMessageId Messaging-layer message id of the original request.
    function deliverMessageResponse(uint64 originalMessageId) external {
        if (sourceMiddleware == address(0) || destinationMiddleware == address(0)) revert EndpointsNotConfigured();

        ClprTypes.ClprMessageResponse storage stored = _pendingResponses[originalMessageId];
        if (stored.originalMessageId == 0) revert ResponseNotFound();

        ClprTypes.ClprMessageResponse memory response = stored;
        delete _pendingResponses[originalMessageId];

        IClprMiddleware(sourceMiddleware).handleMessageResponse(response);
        emit MessageResponseDelivered(originalMessageId);
    }

    /// @notice Best-effort helper that delivers any stored responses for message ids `1..nextMessageId`.
    /// @dev Intended only for tests/smoke scripts; not safe for unbounded production workloads.
    function deliverAllMessageResponses() external {
        if (sourceMiddleware == address(0) || destinationMiddleware == address(0)) revert EndpointsNotConfigured();

        for (uint64 messageId = 1; messageId <= nextMessageId; messageId++) {
            ClprTypes.ClprMessageResponse storage stored = _pendingResponses[messageId];
            if (stored.originalMessageId == 0) {
                continue;
            }

            ClprTypes.ClprMessageResponse memory response = stored;
            delete _pendingResponses[messageId];
            IClprMiddleware(sourceMiddleware).handleMessageResponse(response);
            emit MessageResponseDelivered(messageId);
        }
    }

    /// @notice Returns true if a response for `originalMessageId` is pending delivery.
    function hasPendingResponse(uint64 originalMessageId) external view returns (bool pending) {
        pending = _pendingResponses[originalMessageId].originalMessageId != 0;
    }

    function _storeMessageResponse(ClprTypes.ClprMessageResponse memory response) private returns (uint64 responseId) {
        if (sourceMiddleware == address(0) || destinationMiddleware == address(0)) revert EndpointsNotConfigured();
        if (_pendingResponses[response.originalMessageId].originalMessageId != 0) revert ResponseAlreadyPending();

        responseId = ++nextResponseId;
        emit MessageResponseEnqueued(responseId, response.originalMessageId, response.middlewareResponse.status);

        _pendingResponses[response.originalMessageId] = response;
    }
}
