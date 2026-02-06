// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";

/// @title CLPR IT0 Middleware Interface
/// @notice API surface between applications/queue and middleware in the IT0 reference flow.
interface IClprMiddlewareIT0 {
    /// @notice Registers an application that middleware is allowed to route to/from locally.
    /// @param application Address of the local application contract.
    function registerLocalApplication(address application) external;

    /// @notice Sends an outbound message from a local application through the queue.
    /// @param destinationMiddleware Remote middleware address.
    /// @param destinationApplication Remote application address.
    /// @param appPayload Opaque application payload.
    /// @return appMessageId Source-side application message id.
    /// @return queueMessageId Queue-assigned id for the enqueued request.
    function send(
        address destinationMiddleware,
        address destinationApplication,
        bytes calldata appPayload
    ) external returns (uint64 appMessageId, uint64 queueMessageId);

    /// @notice Handles an inbound message delivered by the queue.
    /// @param message Inbound message envelope.
    /// @param queueMessageId Queue-assigned message id for tracing.
    function handleMessage(ClprTypesIT0.ClprMessage calldata message, uint64 queueMessageId) external;

    /// @notice Handles an inbound response delivered by the queue.
    /// @param response Inbound response envelope.
    /// @param queueMessageId Queue-assigned message id for tracing.
    function handleMessageResponse(ClprTypesIT0.ClprMessageResponse calldata response, uint64 queueMessageId) external;
}
