// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypesIT0 } from "../types/ClprTypesIT0.sol";

/// @title CLPR IT0 Source Application Interface
/// @notice Interface middleware uses to deliver a CLPR response to the source app.
interface IClprSourceApplicationIT0 {
    /// @notice Handles a response for a previously sent application message.
    /// @param response Response envelope delivered by source middleware.
    function handleClprResponse(ClprTypesIT0.ClprMessageResponse calldata response) external;
}
