// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title CLPR Shared Types
/// @author Hashgraph
/// @notice Shared message and API types for the current CLPR prototype iteration.
/// @dev This code currently implements IT1-CONN-AUTH behavior.
library ClprTypes {
    // -------------------------------------------------------------------------
    // Application layer (MVP-shape, simplified for Solidity)
    // -------------------------------------------------------------------------

    /// @notice Application-provided outbound request payload.
    /// @dev Mirrors `ClprApplicationMessage` from the spec:
    ///      - `recipientId` is the destination application contract address.
    ///      - `connectorId` is the source-ledger connector contract chosen by the application.
    struct ClprApplicationMessage {
        address recipientId;
        address connectorId;
        bytes data;
    }

    /// @notice Application-level response payload (opaque to middleware).
    /// @dev In later iterations this may carry structured status metadata encoded by the application.
    struct ClprApplicationResponse {
        bytes data;
    }

    /// @notice Immediate middleware result for `send(...)`.
    /// @dev Mirrors the `ClprSendMessageStatus` intent from the spec while remaining ABI-friendly.
    enum ClprSendStatus {
        Accepted,
        Rejected
    }

    /// @notice Optional failure classification for rejected sends (catalog evolves over time).
    enum ClprSendFailureReason {
        None,
        ConnectorAbsent,
        ConnectorOutOfFunds
    }

    /// @notice Optional failure side attribution (source vs destination).
    enum ClprSendFailureSide {
        None,
        Source,
        Destination
    }

    /// @notice Return value for the application-facing `send(...)` API.
    struct ClprSendMessageStatus {
        uint64 appMsgId;
        ClprSendStatus status;
        ClprSendFailureReason failureReason;
        ClprSendFailureSide failureSide;
    }

    // -------------------------------------------------------------------------
    // Connector layer (mocked in current prototype)
    // -------------------------------------------------------------------------

    /// @notice Ledger-specific amount container (placeholder for MVP economics).
    /// @dev For IT1-CONN-AUTH, economics are not enforced; fields are present for message-shape parity.
    struct ClprAmount {
        uint256 value;
        string unit;
    }

    /// @notice Connector-produced authorization metadata included in `ClprMessage`.
    struct ClprConnectorMessage {
        bool approve;
        ClprAmount maxCharge;
        bytes data;
    }

    /// @notice Connector-produced response metadata returned to the source connector (empty in IT1).
    struct ClprConnectorResponse {
        bytes data;
    }

    // -------------------------------------------------------------------------
    // Middleware layer (message envelopes, MVP-shape)
    // -------------------------------------------------------------------------

    /// @notice Middleware-level status for handling an inbound message.
    enum ClprMiddlewareStatus {
        Success,
        ConnectorAbsent,
        ConnectorOutOfFunds,
        ApplicationFailure
    }

    /// @notice Balance report metadata (placeholder for MVP economics).
    struct ClprBalanceReport {
        address connectorId;
        ClprAmount availableBalance;
        ClprAmount safetyThreshold;
        ClprAmount outstandingCommitments;
    }

    /// @notice Middleware-to-middleware message metadata (placeholder in IT1).
    struct ClprMiddlewareMessage {
        ClprBalanceReport balanceReport;
        bytes data;
    }

    /// @notice Middleware response metadata included in `ClprMessageResponse`.
    struct ClprMiddlewareResponse {
        ClprMiddlewareStatus status;
        ClprAmount minimumCharge;
        ClprAmount maximumCharge;
        ClprMiddlewareMessage middlewareMessage;
    }

    /// @notice Draft of a CLPR message presented to the connector for authorization.
    struct ClprMessageDraft {
        address senderApplicationId;
        ClprApplicationMessage applicationMessage;
        address destinationConnectorId;
    }

    /// @notice Canonical CLPR request envelope transported between ledgers.
    /// @dev Intentionally omits the messaging-layer message id; that id is provided out-of-band on delivery.
    struct ClprMessage {
        address senderApplicationId;
        ClprApplicationMessage applicationMessage;
        address destinationConnectorId;
        ClprConnectorMessage connectorMessage;
        ClprMiddlewareMessage middlewareMessage;
    }

    /// @notice Canonical CLPR response envelope transported between ledgers.
    struct ClprMessageResponse {
        uint64 originalMessageId;
        ClprApplicationResponse applicationResponse;
        ClprConnectorResponse connectorResponse;
        ClprMiddlewareResponse middlewareResponse;
    }
}
