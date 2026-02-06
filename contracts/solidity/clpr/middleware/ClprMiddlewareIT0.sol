// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";
import { IClprMiddlewareIT0 } from "../interfaces/IClprMiddlewareIT0.sol";
import { IClprQueueIT0 } from "../interfaces/IClprQueueIT0.sol";
import { IClprDestinationApplicationIT0 } from "../interfaces/IClprDestinationApplicationIT0.sol";
import { IClprSourceApplicationIT0 } from "../interfaces/IClprSourceApplicationIT0.sol";

/// @title CLPR Middleware IT0 (Echo Flow)
/// @author Hashgraph
/// @notice Minimal middleware implementation for the first CLPR iteration (`IT0-ECHO`).
/// @dev This contract intentionally excludes connectors/economics and focuses on deterministic app-to-app routing.
contract ClprMiddlewareIT0 is IClprMiddlewareIT0 {
    /// @notice Stored routing context for a message awaiting response.
    /// @dev Used to validate that inbound responses map to the originally targeted application pair.
    struct PendingApplicationMessage {
        /// @notice Original source application for the outbound send.
        address sourceApplication;
        /// @notice Destination application selected for the outbound send.
        address destinationApplication;
        /// @notice True if this message id is still awaiting a response.
        bool exists;
    }

    /// @notice Thrown when a queue-only endpoint is called by a non-queue address.
    error QueueOnly();

    /// @notice Thrown when a source or destination app is not registered locally.
    error ApplicationNotRegistered();

    /// @notice Thrown when routing metadata points to an invalid destination middleware or app.
    error InvalidDestination();

    /// @notice Thrown when middleware is constructed with an invalid queue address.
    error InvalidQueue();

    /// @notice Thrown when a response references an unknown message id.
    error UnknownMessage();

    /// @notice Thrown when response participants do not match pending message context.
    error ResponseMismatch();

    /// @notice Queue implementation used to route request/response envelopes.
    address public immutable queue;

    /// @notice Monotonic source-side application message id counter.
    uint64 public nextAppMessageId;

    /// @notice Local allow-list of applications this middleware can route for.
    mapping(address => bool) public localApplications;

    /// @notice Pending outbound messages keyed by application message id.
    mapping(uint64 => PendingApplicationMessage) public pendingAppMessages;

    /// @notice Emitted when an application is registered for local routing.
    event ApplicationRegistered(address indexed application);

    /// @notice Emitted after enqueueing an outbound message.
    event OutboundMessageQueued(
        uint64 indexed appMessageId,
        uint64 indexed queueMessageId,
        address indexed sourceApplication,
        address destinationApplication
    );

    /// @notice Emitted after handling an inbound message and enqueueing its response.
    event InboundMessageHandled(
        uint64 indexed appMessageId,
        uint64 indexed queueMessageId,
        address indexed destinationApplication,
        bool success
    );

    /// @notice Emitted after delivering an inbound response to the source application.
    event InboundResponseHandled(
        uint64 indexed appMessageId,
        uint64 indexed queueMessageId,
        address indexed sourceApplication,
        bool success
    );

    /// @param queueAddress Queue contract used for message transport callbacks.
    constructor(address queueAddress) {
        if (queueAddress == address(0)) revert InvalidQueue();
        queue = queueAddress;
    }

    /// @dev Restricts queue callback entrypoints to the configured queue contract.
    modifier onlyQueue() {
        if (msg.sender != queue) revert QueueOnly();
        _;
    }

    /// @inheritdoc IClprMiddlewareIT0
    function registerLocalApplication(address application) external {
        localApplications[application] = true;
        emit ApplicationRegistered(application);
    }

    /// @inheritdoc IClprMiddlewareIT0
    function send(
        address destinationMiddleware,
        address destinationApplication,
        bytes calldata appPayload
    ) external returns (uint64 appMessageId, uint64 queueMessageId) {
        if (!localApplications[msg.sender]) revert ApplicationNotRegistered();
        if (destinationMiddleware == address(0) || destinationApplication == address(0)) revert InvalidDestination();

        appMessageId = ++nextAppMessageId;
        pendingAppMessages[appMessageId] = PendingApplicationMessage({
            sourceApplication: msg.sender,
            destinationApplication: destinationApplication,
            exists: true
        });

        ClprTypesIT0.ClprMessage memory outboundMessage = ClprTypesIT0.ClprMessage({
            appMessageId: appMessageId,
            sourceMiddleware: address(this),
            destinationMiddleware: destinationMiddleware,
            sourceApplication: msg.sender,
            destinationApplication: destinationApplication,
            applicationPayload: appPayload
        });

        queueMessageId = IClprQueueIT0(queue).enqueueMessage(outboundMessage);
        emit OutboundMessageQueued(appMessageId, queueMessageId, msg.sender, destinationApplication);
    }

    /// @inheritdoc IClprMiddlewareIT0
    function handleMessage(ClprTypesIT0.ClprMessage calldata message, uint64 queueMessageId) external onlyQueue {
        if (message.destinationMiddleware != address(this)) revert InvalidDestination();
        if (!localApplications[message.destinationApplication]) revert ApplicationNotRegistered();

        bool appSuccess = true;
        bytes memory appResponsePayload;

        try IClprDestinationApplicationIT0(message.destinationApplication).handleClprMessage(message) returns (
            bytes memory responsePayload
        ) {
            appResponsePayload = responsePayload;
        } catch {
            appSuccess = false;
            appResponsePayload = bytes("");
        }

        ClprTypesIT0.ClprMessageResponse memory response = ClprTypesIT0.ClprMessageResponse({
            originalAppMessageId: message.appMessageId,
            sourceMiddleware: address(this),
            destinationMiddleware: message.sourceMiddleware,
            sourceApplication: message.destinationApplication,
            destinationApplication: message.sourceApplication,
            success: appSuccess,
            responsePayload: appResponsePayload
        });

        IClprQueueIT0(queue).enqueueMessageResponse(response);
        emit InboundMessageHandled(message.appMessageId, queueMessageId, message.destinationApplication, appSuccess);
    }

    /// @inheritdoc IClprMiddlewareIT0
    function handleMessageResponse(
        ClprTypesIT0.ClprMessageResponse calldata response,
        uint64 queueMessageId
    ) external onlyQueue {
        if (response.destinationMiddleware != address(this)) revert InvalidDestination();
        if (!localApplications[response.destinationApplication]) revert ApplicationNotRegistered();

        PendingApplicationMessage memory pending = pendingAppMessages[response.originalAppMessageId];
        if (!pending.exists) revert UnknownMessage();
        if (
            pending.sourceApplication != response.destinationApplication ||
            pending.destinationApplication != response.sourceApplication
        ) revert ResponseMismatch();

        delete pendingAppMessages[response.originalAppMessageId];
        IClprSourceApplicationIT0(response.destinationApplication).handleClprResponse(response);

        emit InboundResponseHandled(
            response.originalAppMessageId,
            queueMessageId,
            response.destinationApplication,
            response.success
        );
    }
}
