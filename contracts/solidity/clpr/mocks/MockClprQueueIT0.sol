// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";
import { IClprQueueIT0 } from "../interfaces/IClprQueueIT0.sol";
import { IClprMiddlewareIT0 } from "../interfaces/IClprMiddlewareIT0.sol";

/// @title Mock CLPR Queue for IT0
/// @author Hashgraph
/// @notice In-memory queue mock that immediately forwards payloads to destination middleware.
/// @dev Synchronous forwarding is intentional for deterministic tests and smoke runs.
contract MockClprQueueIT0 is IClprQueueIT0 {
    /// @notice Monotonic queue message id assigned to each enqueue operation.
    uint64 public nextQueueMessageId;

    /// @notice Emitted when a request message is enqueued.
    event MessageEnqueued(
        uint64 indexed queueMessageId,
        uint64 indexed appMessageId,
        address indexed sourceMiddleware,
        address destinationMiddleware
    );

    /// @notice Emitted when a response message is enqueued.
    event MessageResponseEnqueued(
        uint64 indexed queueMessageId,
        uint64 indexed originalAppMessageId,
        address indexed sourceMiddleware,
        address destinationMiddleware
    );

    /// @inheritdoc IClprQueueIT0
    function enqueueMessage(ClprTypesIT0.ClprMessage calldata message) external returns (uint64 queueMessageId) {
        queueMessageId = ++nextQueueMessageId;
        emit MessageEnqueued(
            queueMessageId,
            message.appMessageId,
            message.sourceMiddleware,
            message.destinationMiddleware
        );

        IClprMiddlewareIT0(message.destinationMiddleware).handleMessage(message, queueMessageId);
    }

    /// @inheritdoc IClprQueueIT0
    function enqueueMessageResponse(
        ClprTypesIT0.ClprMessageResponse calldata response
    ) external returns (uint64 queueMessageId) {
        queueMessageId = ++nextQueueMessageId;
        emit MessageResponseEnqueued(
            queueMessageId,
            response.originalAppMessageId,
            response.sourceMiddleware,
            response.destinationMiddleware
        );

        IClprMiddlewareIT0(response.destinationMiddleware).handleMessageResponse(response, queueMessageId);
    }
}
