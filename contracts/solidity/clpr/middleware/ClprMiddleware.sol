// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";
import { IClprMiddleware } from "../interfaces/IClprMiddleware.sol";
import { IClprQueue } from "../interfaces/IClprQueue.sol";
import { IClprDestinationApplication, IClprSourceApplication } from "../interfaces/IClprApplication.sol";
import { IClprConnector } from "../interfaces/IClprConnector.sol";

/// @title CLPR Middleware
/// @author Hashgraph
/// @notice Minimal middleware implementation for `IT1-CONN-AUTH`.
/// @dev This iteration focuses on:
///      - aligning message envelopes to the spec-shape (draft/message/response), and
///      - wiring the source-connector authorization hook.
///      Economic enforcement, connector registration, and proof concerns remain out of scope.
contract ClprMiddleware is IClprMiddleware {
    /// @notice Stored routing context for a message awaiting response delivery.
    struct PendingOutboundMessage {
        address sourceApplication;
        uint64 appMsgId;
        bool exists;
    }

    /// @notice Thrown when a queue-only entrypoint is called by a non-queue address.
    error QueueOnly();

    /// @notice Thrown when middleware is constructed with an invalid queue address.
    error InvalidQueue();

    /// @notice Thrown when an application is not registered locally.
    error ApplicationNotRegistered();

    /// @notice Thrown when an inbound message targets an invalid recipient.
    error InvalidRecipient();

    /// @notice Thrown when a response references an unknown message id.
    error UnknownMessage();

    /// @notice Address of the messaging-layer queue mock used for enqueue and callbacks.
    address public immutable queue;

    /// @notice Local allow-list of applications this middleware can route for.
    mapping(address => bool) public localApplications;

    /// @notice Destination connector id derived from pairing state (mocked as a simple mapping in IT1).
    /// @dev Keyed by the source connector id selected by the application.
    mapping(address => address) public destinationConnectorBySourceConnector;

    /// @notice Next per-application message id (ClprAppMsgId), monotonically increasing.
    mapping(address => uint64) public nextAppMsgId;

    /// @notice Pending outbound messages keyed by messaging-layer `ClprMsgId`.
    mapping(uint64 => PendingOutboundMessage) public pendingByMessageId;

    /// @notice Emitted when an application is registered for local routing.
    event ApplicationRegistered(address indexed application);

    /// @notice Emitted when a connector pairing is configured (IT1 placeholder for registration state).
    event ConnectorPairConfigured(address indexed sourceConnectorId, address indexed destinationConnectorId);

    /// @notice Emitted after the middleware successfully enqueues an outbound message.
    event OutboundMessageEnqueued(
        uint64 indexed appMsgId,
        uint64 indexed messageId,
        address indexed sourceApplication,
        address destinationApplication,
        address sourceConnectorId,
        address destinationConnectorId
    );

    /// @notice Emitted after handling an inbound message and constructing a response.
    event InboundMessageHandled(
        uint64 indexed messageId,
        address indexed destinationApplication,
        ClprTypes.ClprMiddlewareStatus status
    );

    /// @notice Emitted after delivering an inbound response to the source application.
    event InboundResponseHandled(
        uint64 indexed messageId,
        address indexed sourceApplication,
        uint64 indexed appMsgId,
        ClprTypes.ClprMiddlewareStatus status
    );

    /// @param queueAddress Queue contract used for enqueue and for message delivery callbacks.
    constructor(address queueAddress) {
        if (queueAddress == address(0)) revert InvalidQueue();
        queue = queueAddress;
    }

    /// @dev Restricts messaging-layer entrypoints to the configured queue contract.
    modifier onlyQueue() {
        if (msg.sender != queue) revert QueueOnly();
        _;
    }

    /// @inheritdoc IClprMiddleware
    function registerLocalApplication(address application) external {
        localApplications[application] = true;
        emit ApplicationRegistered(application);
    }

    /// @notice Configures a connector pairing mapping.
    /// @dev This is an IT1 placeholder until formal connector registration state is implemented.
    /// @param sourceConnectorId Source connector id selected by the application.
    /// @param destinationConnectorId Destination connector id derived from pairing state.
    function configureConnectorPair(address sourceConnectorId, address destinationConnectorId) external {
        destinationConnectorBySourceConnector[sourceConnectorId] = destinationConnectorId;
        emit ConnectorPairConfigured(sourceConnectorId, destinationConnectorId);
    }

    /// @inheritdoc IClprMiddleware
    function send(
        ClprTypes.ClprApplicationMessage calldata applicationMessage
    ) external returns (ClprTypes.ClprSendMessageStatus memory status) {
        if (!localApplications[msg.sender]) revert ApplicationNotRegistered();

        uint64 appMsgId = ++nextAppMsgId[msg.sender];
        status.appMsgId = appMsgId;

        if (applicationMessage.recipientId == address(0)) {
            status.status = ClprTypes.ClprSendStatus.Rejected;
            return status;
        }

        if (applicationMessage.connectorId == address(0)) {
            status.status = ClprTypes.ClprSendStatus.Rejected;
            status.failureReason = ClprTypes.ClprSendFailureReason.ConnectorAbsent;
            status.failureSide = ClprTypes.ClprSendFailureSide.Source;
            return status;
        }

        address destinationConnectorId = destinationConnectorBySourceConnector[applicationMessage.connectorId];
        if (destinationConnectorId == address(0)) {
            status.status = ClprTypes.ClprSendStatus.Rejected;
            status.failureReason = ClprTypes.ClprSendFailureReason.ConnectorAbsent;
            status.failureSide = ClprTypes.ClprSendFailureSide.Destination;
            return status;
        }

        // Draft passed to the source connector for authorization before enqueue.
        ClprTypes.ClprMessageDraft memory draft = ClprTypes.ClprMessageDraft({
            senderApplicationId: msg.sender,
            applicationMessage: applicationMessage,
            destinationConnectorId: destinationConnectorId
        });

        ClprTypes.ClprConnectorMessage memory connectorMessage;
        try IClprConnector(applicationMessage.connectorId).authorize(draft) returns (
            ClprTypes.ClprConnectorMessage memory authorized
        ) {
            connectorMessage = authorized;
        } catch {
            status.status = ClprTypes.ClprSendStatus.Rejected;
            status.failureSide = ClprTypes.ClprSendFailureSide.Source;
            return status;
        }

        if (!connectorMessage.approve) {
            status.status = ClprTypes.ClprSendStatus.Rejected;
            status.failureSide = ClprTypes.ClprSendFailureSide.Source;
            return status;
        }

        // Middleware-to-middleware metadata is stubbed for IT1.
        ClprTypes.ClprMiddlewareMessage memory middlewareMessage = _buildStubMiddlewareMessage(
            applicationMessage.connectorId
        );

        ClprTypes.ClprMessage memory outboundMessage = ClprTypes.ClprMessage({
            senderApplicationId: msg.sender,
            applicationMessage: applicationMessage,
            destinationConnectorId: destinationConnectorId,
            connectorMessage: connectorMessage,
            middlewareMessage: middlewareMessage
        });

        uint64 messageId;
        try IClprQueue(queue).enqueueMessage(outboundMessage) returns (uint64 assignedMessageId) {
            messageId = assignedMessageId;
        } catch {
            status.status = ClprTypes.ClprSendStatus.Rejected;
            return status;
        }

        pendingByMessageId[messageId] = PendingOutboundMessage({sourceApplication: msg.sender, appMsgId: appMsgId, exists: true});

        status.status = ClprTypes.ClprSendStatus.Accepted;

        emit OutboundMessageEnqueued(
            appMsgId,
            messageId,
            msg.sender,
            applicationMessage.recipientId,
            applicationMessage.connectorId,
            destinationConnectorId
        );
    }

    /// @inheritdoc IClprMiddleware
    function handleMessage(
        ClprTypes.ClprMessage calldata message,
        uint64 messageId
    ) external onlyQueue returns (ClprTypes.ClprMessageResponse memory response) {
        address destinationApplication = message.applicationMessage.recipientId;
        if (destinationApplication == address(0)) revert InvalidRecipient();
        if (!localApplications[destinationApplication]) revert ApplicationNotRegistered();

        ClprTypes.ClprMiddlewareStatus status = ClprTypes.ClprMiddlewareStatus.Success;
        ClprTypes.ClprApplicationResponse memory applicationResponse;

        try IClprDestinationApplication(destinationApplication).handleMessage(message.applicationMessage) returns (
            ClprTypes.ClprApplicationResponse memory appResponse
        ) {
            applicationResponse = appResponse;
        } catch (bytes memory revertData) {
            status = ClprTypes.ClprMiddlewareStatus.ApplicationFailure;
            // Prototype behavior: return raw revert bytes as the application response payload.
            applicationResponse = ClprTypes.ClprApplicationResponse({data: revertData});
        }

        response = ClprTypes.ClprMessageResponse({
            originalMessageId: messageId,
            applicationResponse: applicationResponse,
            connectorResponse: ClprTypes.ClprConnectorResponse({data: bytes("")}),
            middlewareResponse: _buildStubMiddlewareResponse(status, message.destinationConnectorId)
        });

        emit InboundMessageHandled(messageId, destinationApplication, status);
    }

    /// @inheritdoc IClprMiddleware
    function handleMessageResponse(ClprTypes.ClprMessageResponse calldata response) external onlyQueue {
        PendingOutboundMessage memory pending = pendingByMessageId[response.originalMessageId];
        if (!pending.exists) revert UnknownMessage();
        if (!localApplications[pending.sourceApplication]) revert ApplicationNotRegistered();

        delete pendingByMessageId[response.originalMessageId];

        IClprSourceApplication(pending.sourceApplication).handleResponse(response.applicationResponse, pending.appMsgId);

        emit InboundResponseHandled(
            response.originalMessageId,
            pending.sourceApplication,
            pending.appMsgId,
            response.middlewareResponse.status
        );
    }

    function _buildStubAmount(uint256 value) private pure returns (ClprTypes.ClprAmount memory amount) {
        amount = ClprTypes.ClprAmount({value: value, unit: ""});
    }

    function _buildStubMiddlewareMessage(
        address connectorId
    ) private pure returns (ClprTypes.ClprMiddlewareMessage memory middlewareMessage) {
        middlewareMessage = ClprTypes.ClprMiddlewareMessage({
            balanceReport: ClprTypes.ClprBalanceReport({
                connectorId: connectorId,
                availableBalance: _buildStubAmount(0),
                safetyThreshold: _buildStubAmount(0),
                outstandingCommitments: _buildStubAmount(0)
            }),
            data: bytes("")
        });
    }

    function _buildStubMiddlewareResponse(
        ClprTypes.ClprMiddlewareStatus status,
        address connectorId
    ) private pure returns (ClprTypes.ClprMiddlewareResponse memory middlewareResponse) {
        middlewareResponse = ClprTypes.ClprMiddlewareResponse({
            status: status,
            minimumCharge: _buildStubAmount(0),
            maximumCharge: _buildStubAmount(type(uint256).max),
            middlewareMessage: _buildStubMiddlewareMessage(connectorId)
        });
    }
}
