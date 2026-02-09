// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";
import { IClprMiddleware } from "../interfaces/IClprMiddleware.sol";
import { IClprSourceApplication } from "../interfaces/IClprApplication.sol";

/// @title Source Application for CLPR
/// @author Hashgraph
/// @notice Reference application that sends requests via middleware and records responses.
/// @dev This contract models an "application" that chooses a connector and a destination application id.
contract SourceApplication is IClprSourceApplication {
    /// @notice Thrown when middleware callback methods are called by non-middleware callers.
    error MiddlewareOnly();

    /// @notice Thrown when contract is constructed with an invalid middleware address.
    error InvalidMiddleware();

    /// @notice Thrown when contract is constructed with an invalid destination application address.
    error InvalidDestinationApplication();

    /// @notice Thrown when contract is constructed with an invalid source connector address.
    error InvalidSourceConnector();

    /// @notice Local middleware used for send/response operations.
    address public immutable middleware;

    /// @notice Destination application id to include in outbound `ClprApplicationMessage`.
    address public immutable destinationApplicationId;

    /// @notice Source connector id selected by the application.
    address public immutable sourceConnectorId;

    /// @notice Emitted when a message is sent through middleware.
    event SendAttempted(
        uint64 indexed appMsgId,
        ClprTypes.ClprSendStatus status,
        ClprTypes.ClprSendFailureReason failureReason,
        ClprTypes.ClprSendFailureSide failureSide,
        bytes payload
    );

    /// @notice Emitted when a response is delivered through middleware.
    event ResponseReceived(uint64 indexed appMsgId, bytes payload);

    /// @param middlewareAddress Local middleware instance used for send and response callbacks.
    /// @param destinationApplication Destination application id (contract address) on the remote ledger.
    /// @param connectorId Source connector id (contract address) on the local ledger.
    constructor(address middlewareAddress, address destinationApplication, address connectorId) {
        if (middlewareAddress == address(0)) revert InvalidMiddleware();
        if (destinationApplication == address(0)) revert InvalidDestinationApplication();
        if (connectorId == address(0)) revert InvalidSourceConnector();
        middleware = middlewareAddress;
        destinationApplicationId = destinationApplication;
        sourceConnectorId = connectorId;
    }

    /// @dev Restricts callbacks to the configured middleware.
    modifier onlyMiddleware() {
        if (msg.sender != middleware) revert MiddlewareOnly();
        _;
    }

    /// @notice Sends a payload through middleware using the configured destination + connector.
    /// @param payload Opaque application payload.
    /// @return status Immediate middleware send status.
    function send(bytes calldata payload) external returns (ClprTypes.ClprSendMessageStatus memory status) {
        status = IClprMiddleware(middleware).send(
            ClprTypes.ClprApplicationMessage({
                recipientId: destinationApplicationId,
                connectorId: sourceConnectorId,
                data: payload
            })
        );
        emit SendAttempted(status.appMsgId, status.status, status.failureReason, status.failureSide, payload);
    }

    /// @inheritdoc IClprSourceApplication
    function handleResponse(
        ClprTypes.ClprApplicationResponse calldata response,
        uint64 appMsgId
    ) external onlyMiddleware {
        emit ResponseReceived(appMsgId, response.data);
    }
}
