// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";

/// @title CLPR Message Queue Interface
/// @notice Messaging-layer queue abstraction used by middleware to enqueue request/response envelopes.
interface IClprQueue {
    /// @notice Enqueues an outbound CLPR request message for transport.
    /// @dev The queue assigns and returns the messaging-layer message id.
    /// @param message CLPR request envelope to enqueue.
    /// @return messageId Messaging-layer message id assigned to this message.
    function enqueueMessage(ClprTypes.ClprMessage calldata message) external returns (uint64 messageId);

    /// @notice Enqueues an outbound CLPR response message for transport.
    /// @param response CLPR response envelope to enqueue.
    /// @return responseId Messaging-layer id for the enqueued response (not used for app correlation).
    function enqueueMessageResponse(
        ClprTypes.ClprMessageResponse calldata response
    ) external returns (uint64 responseId);
}
