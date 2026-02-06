// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";

/// @title CLPR IT0 Queue Interface
/// @notice Queue abstraction used by middleware to asynchronously route request/response envelopes.
interface IClprQueueIT0 {
    /// @notice Enqueues an outbound middleware message.
    /// @param message Message envelope to route.
    /// @return queueMessageId Queue-assigned message id.
    function enqueueMessage(ClprTypesIT0.ClprMessage calldata message) external returns (uint64 queueMessageId);

    /// @notice Enqueues an outbound middleware response.
    /// @param response Response envelope to route.
    /// @return queueMessageId Queue-assigned message id.
    function enqueueMessageResponse(ClprTypesIT0.ClprMessageResponse calldata response)
        external
        returns (uint64 queueMessageId);
}
