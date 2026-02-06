// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";

/// @title CLPR IT0 Destination Application Interface
/// @notice Interface middleware uses to deliver an inbound CLPR message to a destination app.
interface IClprDestinationApplicationIT0 {
    /// @notice Handles an inbound CLPR message.
    /// @param message Message envelope provided by destination middleware.
    /// @return responsePayload Opaque application-level response payload.
    function handleClprMessage(ClprTypesIT0.ClprMessage calldata message)
        external
        returns (bytes memory responsePayload);
}
