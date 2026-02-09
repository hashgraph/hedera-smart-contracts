// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";

/// @title CLPR Middleware Interface
/// @notice API surface between applications/connectors/messaging and middleware.
/// @dev Currently implements IT1-CONN-AUTH behavior.
interface IClprMiddleware {
    /// @notice Registers an application that middleware is allowed to route to/from locally.
    /// @param application Address of the local application contract.
    function registerLocalApplication(address application) external;

    /// @notice Sends an outbound request from a local application.
    /// @param message Application message containing destination app id, connector id, and payload bytes.
    /// @return status Immediate send status (accepted/rejected) plus middleware-assigned per-application msg id.
    function send(
        ClprTypes.ClprApplicationMessage calldata message
    ) external returns (ClprTypes.ClprSendMessageStatus memory status);

    /// @notice Handles an inbound message delivered by the messaging layer.
    /// @param message Verified inbound CLPR message envelope.
    /// @param messageId Messaging-layer message id assigned on enqueue.
    /// @return response CLPR message response envelope for transport back to the source ledger.
    function handleMessage(
        ClprTypes.ClprMessage calldata message,
        uint64 messageId
    ) external returns (ClprTypes.ClprMessageResponse memory response);

    /// @notice Handles an inbound response delivered by the messaging layer.
    /// @param response Verified inbound CLPR response envelope.
    function handleMessageResponse(ClprTypes.ClprMessageResponse calldata response) external;
}
