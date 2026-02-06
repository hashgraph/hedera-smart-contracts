// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";
import { IClprMiddlewareIT0 } from "../interfaces/IClprMiddlewareIT0.sol";
import { IClprSourceApplicationIT0 } from "../interfaces/IClprSourceApplicationIT0.sol";

/// @title Source Application for CLPR IT0 Echo Flow
/// @author Hashgraph
/// @notice Reference source-side application that sends payloads and receives CLPR responses.
/// @dev This contract models how an app can pin expected remote middleware/app peers.
contract SourceApplicationIT0 is IClprSourceApplicationIT0 {
    /// @notice Thrown when middleware callback methods are called by non-middleware callers.
    error MiddlewareOnly();

    /// @notice Thrown when outbound peer addresses are not configured.
    error PeerNotConfigured();

    /// @notice Thrown when response origin metadata does not match configured peer addresses.
    error UnexpectedResponseSource();

    /// @notice Local middleware used for send/response operations.
    address public immutable middleware;

    /// @notice Middleware expected to originate valid responses.
    address public expectedDestinationMiddleware;

    /// @notice Application expected to originate valid responses.
    address public expectedDestinationApplication;

    /// @notice Last app message id assigned by middleware for a send attempt.
    uint64 public lastSentAppMessageId;

    /// @notice Last app message id observed in a response callback.
    uint64 public lastResponseAppMessageId;

    /// @notice Last source application address observed in a response callback.
    address public lastResponseSourceApplication;

    /// @notice Last success flag observed in a response callback.
    bool public lastResponseSuccess;

    /// @notice Number of responses processed by this contract.
    uint64 public responseCount;

    /// @dev Stored as private bytes to expose a stable getter with memory copy semantics.
    bytes private _lastResponsePayload;

    /// @notice Emitted when remote peer addresses are updated.
    event PeerConfigured(address destinationMiddleware, address destinationApplication);

    /// @notice Emitted when a message is sent through middleware.
    event MessageSent(uint64 indexed appMessageId, bytes payload);

    /// @notice Emitted when a response is received from middleware.
    event ResponseReceived(uint64 indexed appMessageId, address indexed sourceApplication, bool success, bytes payload);

    /// @param middlewareAddress Local middleware instance used for send and response callbacks.
    constructor(address middlewareAddress) {
        middleware = middlewareAddress;
    }

    /// @dev Restricts response callback to the configured middleware.
    modifier onlyMiddleware() {
        if (msg.sender != middleware) revert MiddlewareOnly();
        _;
    }

    /// @notice Configures destination peer addresses this source app expects.
    /// @param destinationMiddleware Remote middleware address.
    /// @param destinationApplication Remote application address.
    function configurePeer(address destinationMiddleware, address destinationApplication) external {
        expectedDestinationMiddleware = destinationMiddleware;
        expectedDestinationApplication = destinationApplication;
        emit PeerConfigured(destinationMiddleware, destinationApplication);
    }

    /// @notice Sends a payload to the configured remote app through local middleware.
    /// @param payload Opaque application payload.
    /// @return appMessageId Source-side application message id.
    /// @return queueMessageId Queue-assigned request id.
    function send(bytes calldata payload) external returns (uint64 appMessageId, uint64 queueMessageId) {
        if (expectedDestinationMiddleware == address(0) || expectedDestinationApplication == address(0)) {
            revert PeerNotConfigured();
        }

        (appMessageId, queueMessageId) = IClprMiddlewareIT0(middleware).send(
            expectedDestinationMiddleware,
            expectedDestinationApplication,
            payload
        );

        lastSentAppMessageId = appMessageId;
        emit MessageSent(appMessageId, payload);
    }

    /// @inheritdoc IClprSourceApplicationIT0
    function handleClprResponse(ClprTypesIT0.ClprMessageResponse calldata response) external onlyMiddleware {
        if (
            response.sourceMiddleware != expectedDestinationMiddleware ||
            response.sourceApplication != expectedDestinationApplication
        ) revert UnexpectedResponseSource();

        lastResponseAppMessageId = response.originalAppMessageId;
        lastResponseSourceApplication = response.sourceApplication;
        lastResponseSuccess = response.success;
        responseCount++;
        _lastResponsePayload = response.responsePayload;

        emit ResponseReceived(
            response.originalAppMessageId,
            response.sourceApplication,
            response.success,
            response.responsePayload
        );
    }

    /// @notice Returns the last response payload observed by this source application.
    /// @return payload Last response payload.
    function lastResponsePayload() external view returns (bytes memory payload) {
        payload = _lastResponsePayload;
    }
}
