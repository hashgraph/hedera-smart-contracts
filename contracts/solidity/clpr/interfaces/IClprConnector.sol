// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";

/// @title CLPR Connector Interface
/// @notice Connector-facing API required by the CLPR middleware.
/// @dev This prototype models the MVP connector flows described in the spec:
///      - source-side authorization (approve/deny + max charge), and
///      - destination-side notification + reimbursement, returning an optional connector response payload.
interface IClprConnector {
    /// @notice Returns the local connector identifier.
    /// @dev In the spec, this is derived as `Hash(signature_over_local_config)` and can differ across ledgers.
    function connectorId() external view returns (bytes32);

    /// @notice Returns the expected remote connector id this connector is paired with.
    function expectedRemoteConnectorId() external view returns (bytes32);

    /// @notice Returns the remote ledger id this connector is paired with (opaque bytes).
    function remoteLedgerId() external view returns (bytes32);

    /// @notice Returns true if this connector is enabled for new sends.
    function enabled() external view returns (bool);

    /// @notice Returns the connector's current balance report fields (available + safety threshold + unit).
    /// @dev Middleware supplies `outstandingCommitments` since it is ledger- and pipeline-specific.
    function getBalanceReport(
        uint256 outstandingCommitments
    ) external view returns (ClprTypes.ClprBalanceReport memory report);

    /// @notice Returns the destination-side minimum processing charge policy (may be zero).
    function minimumCharge() external view returns (ClprTypes.ClprAmount memory amount);

    /// @notice Returns the destination-side maximum processing charge policy (may be unbounded).
    function maximumCharge() external view returns (ClprTypes.ClprAmount memory amount);

    /// @notice Authorizes an outbound message draft.
    /// @dev Returning `approve=false` indicates the connector denies the send attempt.
    /// @param draft Message draft provided by middleware prior to enqueue.
    /// @return connectorMessage Connector authorization decision and optional metadata.
    function authorize(
        ClprTypes.ClprMessageDraft calldata draft
    ) external returns (ClprTypes.ClprConnectorMessage memory connectorMessage);

    /// @notice Destination-side notification hook for an inbound message and its produced response.
    /// @dev This hook should not block application execution. Middleware MUST treat failures as non-fatal.
    ///      Implementations may use this hook to reimburse the receiving node (middleware) and/or produce
    ///      a connector response payload for delivery back to the source connector.
    /// @param message Original inbound request envelope.
    /// @param response Produced response envelope (status, app response, etc).
    /// @param billing Ledger-specific billing details for this handling.
    /// @return connectorResponse Optional connector response payload (may be empty).
    function handleMessage(
        ClprTypes.ClprMessage calldata message,
        ClprTypes.ClprMessageResponse calldata response,
        ClprTypes.ClprBilling calldata billing
    ) external returns (ClprTypes.ClprConnectorResponse memory connectorResponse);

    /// @notice Source-side notification hook for an inbound connector response payload.
    function handleConnectorResponse(ClprTypes.ClprConnectorResponse calldata connectorResponse) external;

    /// @notice Source-side notification hook for an inbound application response payload.
    /// @param response Application response payload.
    /// @param appMsgId Middleware-assigned per-application message id from the original send attempt.
    function handleApplicationResponse(ClprTypes.ClprApplicationResponse calldata response, uint64 appMsgId) external;

    /// @notice Notifies the source connector of a pre-enqueue rejection.
    /// @dev This is an MVP placeholder for the spec requirement that connectors are notified when middleware
    ///      rejects a send due to evidence of remote connector out-of-funds.
    function notifySendRejected(
        ClprTypes.ClprMessageDraft calldata draft,
        uint64 appMsgId,
        ClprTypes.ClprSendFailureReason reason,
        ClprTypes.ClprSendFailureSide side
    ) external;
}
