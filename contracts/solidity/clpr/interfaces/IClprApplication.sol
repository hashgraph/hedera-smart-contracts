// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";

/// @title CLPR Application Interfaces
/// @notice Role-specific application callback interfaces and their union.
/// @dev Most real-world applications act as both a source and a destination across different flows.
///      The middleware calls destination-side apps via `handleMessage`, and source-side apps via `handleResponse`.
interface IClprDestinationApplication {
    /// @notice Handles an inbound application request delivered by middleware on the destination ledger.
    /// @param message Application-level message payload.
    /// @return response Application-level response payload.
    function handleMessage(
        ClprTypes.ClprApplicationMessage calldata message
    ) external returns (ClprTypes.ClprApplicationResponse memory response);
}

interface IClprSourceApplication {
    /// @notice Handles a response to a previously accepted application send attempt on the source ledger.
    /// @param response Application-level response payload.
    /// @param appMsgId Middleware-assigned per-application message id returned in the original send status.
    function handleResponse(ClprTypes.ClprApplicationResponse calldata response, uint64 appMsgId) external;
}

/// @notice Convenience union interface for applications that act as both source and destination.
interface IClprApplication is IClprDestinationApplication, IClprSourceApplication {}
