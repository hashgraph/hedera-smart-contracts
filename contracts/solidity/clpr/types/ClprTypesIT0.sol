// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title CLPR IT0 Shared Types
/// @author Hashgraph
/// @notice Shared message envelope types for the IT0-ECHO reference flow.
/// @dev These types are intentionally minimal and are expected to evolve in later iterations.
library ClprTypesIT0 {
    /// @notice Middleware envelope for an outbound application message.
    /// @dev In IT0, this structure contains only the fields required for deterministic routing.
    struct ClprMessage {
        /// @notice Monotonic per-source-middleware application message identifier.
        uint64 appMessageId;
        /// @notice Middleware contract that originated the message.
        address sourceMiddleware;
        /// @notice Middleware contract that should receive and process the message.
        address destinationMiddleware;
        /// @notice Source application contract address.
        address sourceApplication;
        /// @notice Destination application contract address.
        address destinationApplication;
        /// @notice Opaque application payload.
        bytes applicationPayload;
    }

    /// @notice Middleware envelope for a response to an earlier `ClprMessage`.
    /// @dev `originalAppMessageId` links this response to the source-side pending message entry.
    struct ClprMessageResponse {
        /// @notice Source-side application message id that this response corresponds to.
        uint64 originalAppMessageId;
        /// @notice Middleware contract that produced this response (destination side for the original request).
        address sourceMiddleware;
        /// @notice Middleware contract that should receive this response (source side for the original request).
        address destinationMiddleware;
        /// @notice Application that produced the response payload.
        address sourceApplication;
        /// @notice Application that should receive the response payload.
        address destinationApplication;
        /// @notice Indicates whether destination application handling completed successfully.
        bool success;
        /// @notice Opaque response payload from the destination application.
        bytes responsePayload;
    }
}
