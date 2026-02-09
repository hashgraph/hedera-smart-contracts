// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import { ClprTypes } from "../types/ClprTypes.sol";
import { IClprConnector } from "../interfaces/IClprConnector.sol";

/// @title Mock CLPR Connector
/// @author Hashgraph
/// @notice Minimal connector that always approves message drafts.
/// @dev Used to validate middleware-to-connector authorize hook wiring in IT1-CONN-AUTH.
contract MockClprConnector is IClprConnector {
    /// @notice Number of times `authorize` has been called.
    uint64 public authorizeCount;

    /// @notice Emitted when the connector authorizes a draft.
    event Authorized(
        address indexed middleware,
        address indexed senderApplicationId,
        address indexed destinationConnectorId,
        bool approve,
        uint256 maxChargeValue,
        bytes32 applicationPayloadHash
    );

    /// @inheritdoc IClprConnector
    function authorize(
        ClprTypes.ClprMessageDraft calldata draft
    ) external returns (ClprTypes.ClprConnectorMessage memory connectorMessage) {
        authorizeCount++;

        // IT1 uses stub economics; approve unconditionally with an effectively-unbounded max charge.
        connectorMessage = ClprTypes.ClprConnectorMessage({
            approve: true,
            maxCharge: ClprTypes.ClprAmount({value: type(uint256).max, unit: ""}),
            data: bytes("")
        });

        emit Authorized(
            msg.sender,
            draft.senderApplicationId,
            draft.destinationConnectorId,
            connectorMessage.approve,
            connectorMessage.maxCharge.value,
            keccak256(draft.applicationMessage.data)
        );
    }
}
