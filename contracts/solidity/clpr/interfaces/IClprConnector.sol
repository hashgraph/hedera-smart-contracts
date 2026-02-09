// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";

/// @title CLPR Connector Interface
/// @notice Minimal connector interface required for IT1-CONN-AUTH (authorize hook).
interface IClprConnector {
    /// @notice Authorizes an outbound message draft.
    /// @dev Returning `approve=false` indicates the connector denies the send attempt.
    /// @param draft Message draft provided by middleware prior to enqueue.
    /// @return connectorMessage Connector authorization decision and optional metadata.
    function authorize(
        ClprTypes.ClprMessageDraft calldata draft
    ) external returns (ClprTypes.ClprConnectorMessage memory connectorMessage);
}
