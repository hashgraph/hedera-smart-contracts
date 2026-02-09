// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";

/// @title CLPR Middleware Interface
/// @notice API surface between applications/connectors/messaging and middleware.
/// @dev The Solidity prototype evolves in place; see the CLPR requirements docs for normative behavior.
interface IClprMiddleware {
    /// @notice Returns the local ledger id (opaque bytes).
    function ledgerId() external view returns (bytes32);

    /// @notice Registers an application that middleware is allowed to route to/from locally.
    /// @param application Address of the local application contract.
    function registerLocalApplication(address application) external;

    /// @notice Registers a connector with this middleware.
    /// @dev In the spec, connector creation is a protocol transaction that records identity and pairing state.
    ///      This prototype models it as a connector self-registration call.
    /// @param connectorId Local connector id (spec: Hash(signature_over_local_config)).
    /// @param remoteLedgerId Opaque remote ledger id this connector is paired with.
    /// @param expectedRemoteConnectorId Opaque expected remote connector id for pairing validation.
    /// @param admin Admin authority allowed to disable/delete this connector registration.
    function registerConnector(
        bytes32 connectorId,
        bytes32 remoteLedgerId,
        bytes32 expectedRemoteConnectorId,
        address admin
    ) external;

    /// @notice Disables a connector for new sends.
    function disableConnector(bytes32 connectorId) external;

    /// @notice Deletes a connector registration.
    function deleteConnector(bytes32 connectorId) external;

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
