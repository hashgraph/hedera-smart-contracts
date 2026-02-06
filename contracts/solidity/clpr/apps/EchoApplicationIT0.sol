// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";
import { IClprDestinationApplicationIT0 } from "../interfaces/IClprDestinationApplicationIT0.sol";

/// @title Echo Destination Application for CLPR IT0
/// @author Hashgraph
/// @notice Reference destination app that echoes inbound payloads back as response payloads.
/// @dev Used to validate middleware and queue routing semantics during IT0.
contract EchoApplicationIT0 is IClprDestinationApplicationIT0 {
    /// @notice Thrown when middleware callback methods are called by non-middleware callers.
    error MiddlewareOnly();

    /// @notice Thrown when inbound message origin does not match configured source peers.
    error UnexpectedMessageSource();

    /// @notice Thrown when contract is constructed with an invalid middleware address.
    error InvalidMiddleware();

    /// @notice Local middleware that is allowed to invoke this contract.
    address public immutable middleware;

    /// @notice Middleware expected to originate inbound messages.
    address public expectedSourceMiddleware;

    /// @notice Source application expected to originate inbound messages.
    address public expectedSourceApplication;

    /// @notice Last inbound app message id observed.
    uint64 public lastRequestAppMessageId;

    /// @notice Last inbound source application address observed.
    address public lastRequestSourceApplication;

    /// @notice Number of inbound requests processed.
    uint64 public requestCount;

    /// @dev Stored as private bytes to expose a stable getter with memory copy semantics.
    bytes private _lastRequestPayload;

    /// @notice Emitted when expected source peers are configured.
    event PeerConfigured(address sourceMiddleware, address sourceApplication);

    /// @notice Emitted when this app handles an inbound message.
    event MessageHandled(uint64 indexed appMessageId, address indexed sourceApplication, bytes payload);

    /// @param middlewareAddress Local middleware instance that invokes `handleClprMessage`.
    constructor(address middlewareAddress) {
        if (middlewareAddress == address(0)) revert InvalidMiddleware();
        middleware = middlewareAddress;
    }

    /// @dev Restricts message handling callback to the configured middleware.
    modifier onlyMiddleware() {
        if (msg.sender != middleware) revert MiddlewareOnly();
        _;
    }

    /// @notice Configures expected source peers.
    /// @param sourceMiddleware Remote middleware address expected in inbound messages.
    /// @param sourceApplication Remote source application expected in inbound messages.
    function configurePeer(address sourceMiddleware, address sourceApplication) external {
        expectedSourceMiddleware = sourceMiddleware;
        expectedSourceApplication = sourceApplication;
        emit PeerConfigured(sourceMiddleware, sourceApplication);
    }

    /// @inheritdoc IClprDestinationApplicationIT0
    function handleClprMessage(
        ClprTypesIT0.ClprMessage calldata message
    ) external onlyMiddleware returns (bytes memory responsePayload) {
        if (
            message.sourceMiddleware != expectedSourceMiddleware ||
            message.sourceApplication != expectedSourceApplication
        ) revert UnexpectedMessageSource();

        lastRequestAppMessageId = message.appMessageId;
        lastRequestSourceApplication = message.sourceApplication;
        requestCount++;
        _lastRequestPayload = message.applicationPayload;

        emit MessageHandled(message.appMessageId, message.sourceApplication, message.applicationPayload);
        return message.applicationPayload;
    }

    /// @notice Returns the last inbound request payload observed by this destination application.
    /// @return payload Last request payload.
    function lastRequestPayload() external view returns (bytes memory payload) {
        payload = _lastRequestPayload;
    }
}
