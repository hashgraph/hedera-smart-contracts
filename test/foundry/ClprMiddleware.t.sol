// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import { ClprTypes } from "../../contracts/solidity/clpr/types/ClprTypes.sol";
import { ClprMiddleware } from "../../contracts/solidity/clpr/middleware/ClprMiddleware.sol";
import { MockClprQueue } from "../../contracts/solidity/clpr/mocks/MockClprQueue.sol";
import { MockClprConnector } from "../../contracts/solidity/clpr/mocks/MockClprConnector.sol";
import { SourceApplication } from "../../contracts/solidity/clpr/apps/SourceApplication.sol";
import { EchoApplication } from "../../contracts/solidity/clpr/apps/EchoApplication.sol";
import { OZERC20Mock } from "../../contracts/openzeppelin/ERC-20/ERC20Mock.sol";

contract ClprMiddlewareTest is Test {
    bytes32 private constant SOURCE_LEDGER_ID = keccak256(bytes("clpr-ledger-source"));
    bytes32 private constant DEST_LEDGER_ID = keccak256(bytes("clpr-ledger-destination"));

    string private constant ETH_UNIT = "ETH";
    string private constant WETH_UNIT = "WETH";

    uint256 private constant DEST_MIN_CHARGE = 50;
    uint256 private constant DEST_SAFETY_THRESHOLD = 60;

    MockClprQueue private queue;
    ClprMiddleware private sourceMiddleware;
    ClprMiddleware private destinationMiddleware;
    OZERC20Mock private weth;

    MockClprConnector private sourceConnector1;
    MockClprConnector private sourceConnector2;
    MockClprConnector private sourceConnector3;

    MockClprConnector private destinationConnector1;
    MockClprConnector private destinationConnector2;
    MockClprConnector private destinationConnector3;

    bytes32 private sourceConnectorId1;
    bytes32 private sourceConnectorId2;
    bytes32 private sourceConnectorId3;

    bytes32 private destinationConnectorId1;
    bytes32 private destinationConnectorId2;
    bytes32 private destinationConnectorId3;

    SourceApplication private sourceApp;
    EchoApplication private echoApp;

    function setUp() public {
        queue = new MockClprQueue();
        sourceMiddleware = new ClprMiddleware(address(queue), SOURCE_LEDGER_ID);
        destinationMiddleware = new ClprMiddleware(address(queue), DEST_LEDGER_ID);

        queue.configureEndpoints(address(sourceMiddleware), address(destinationMiddleware));

        weth = new OZERC20Mock("Wrapped ETH", "WETH");

        // Derive connector ids (models spec intent: ids differ across ledgers).
        bytes32 ownerKey1 = keccak256(bytes("connector-owner-1"));
        bytes32 ownerKey2 = keccak256(bytes("connector-owner-2"));
        bytes32 ownerKey3 = keccak256(bytes("connector-owner-3"));

        sourceConnectorId1 = keccak256(abi.encodePacked("src", ownerKey1, SOURCE_LEDGER_ID, DEST_LEDGER_ID));
        destinationConnectorId1 = keccak256(abi.encodePacked("dst", ownerKey1, DEST_LEDGER_ID, SOURCE_LEDGER_ID));

        sourceConnectorId2 = keccak256(abi.encodePacked("src", ownerKey2, SOURCE_LEDGER_ID, DEST_LEDGER_ID));
        destinationConnectorId2 = keccak256(abi.encodePacked("dst", ownerKey2, DEST_LEDGER_ID, SOURCE_LEDGER_ID));

        sourceConnectorId3 = keccak256(abi.encodePacked("src", ownerKey3, SOURCE_LEDGER_ID, DEST_LEDGER_ID));
        destinationConnectorId3 = keccak256(abi.encodePacked("dst", ownerKey3, DEST_LEDGER_ID, SOURCE_LEDGER_ID));

        ClprTypes.ClprAmount memory outboundMaxCharge = ClprTypes.ClprAmount({value: DEST_MIN_CHARGE, unit: WETH_UNIT});

        sourceConnector1 = new MockClprConnector{value: 1 ether}(
            sourceConnectorId1,
            destinationConnectorId1,
            DEST_LEDGER_ID,
            ETH_UNIT,
            address(0),
            0,
            0,
            type(uint256).max,
            outboundMaxCharge
        );
        sourceConnector2 = new MockClprConnector{value: 1 ether}(
            sourceConnectorId2,
            destinationConnectorId2,
            DEST_LEDGER_ID,
            ETH_UNIT,
            address(0),
            0,
            0,
            type(uint256).max,
            outboundMaxCharge
        );
        sourceConnector3 = new MockClprConnector{value: 1 ether}(
            sourceConnectorId3,
            destinationConnectorId3,
            DEST_LEDGER_ID,
            ETH_UNIT,
            address(0),
            0,
            0,
            type(uint256).max,
            outboundMaxCharge
        );

        destinationConnector1 = new MockClprConnector(
            destinationConnectorId1,
            sourceConnectorId1,
            SOURCE_LEDGER_ID,
            WETH_UNIT,
            address(weth),
            DEST_SAFETY_THRESHOLD,
            DEST_MIN_CHARGE,
            type(uint256).max,
            ClprTypes.ClprAmount({value: type(uint256).max, unit: WETH_UNIT})
        );
        destinationConnector2 = new MockClprConnector(
            destinationConnectorId2,
            sourceConnectorId2,
            SOURCE_LEDGER_ID,
            WETH_UNIT,
            address(weth),
            DEST_SAFETY_THRESHOLD,
            DEST_MIN_CHARGE,
            type(uint256).max,
            ClprTypes.ClprAmount({value: type(uint256).max, unit: WETH_UNIT})
        );
        destinationConnector3 = new MockClprConnector(
            destinationConnectorId3,
            sourceConnectorId3,
            SOURCE_LEDGER_ID,
            WETH_UNIT,
            address(weth),
            DEST_SAFETY_THRESHOLD,
            DEST_MIN_CHARGE,
            type(uint256).max,
            ClprTypes.ClprAmount({value: type(uint256).max, unit: WETH_UNIT})
        );

        // Seed destination connector funds (connector 1 intentionally underfunded).
        weth.mint(address(destinationConnector2), 160);
        weth.mint(address(destinationConnector3), 500);

        // Register connectors with each middleware instance (self-registration via connector call).
        sourceConnector1.registerWithMiddleware(address(sourceMiddleware));
        sourceConnector2.registerWithMiddleware(address(sourceMiddleware));
        sourceConnector3.registerWithMiddleware(address(sourceMiddleware));

        destinationConnector1.registerWithMiddleware(address(destinationMiddleware));
        destinationConnector2.registerWithMiddleware(address(destinationMiddleware));
        destinationConnector3.registerWithMiddleware(address(destinationMiddleware));

        echoApp = new EchoApplication(address(destinationMiddleware));

        bytes32[] memory connectorIds = new bytes32[](3);
        connectorIds[0] = sourceConnectorId1;
        connectorIds[1] = sourceConnectorId2;
        connectorIds[2] = sourceConnectorId3;
        sourceApp = new SourceApplication(address(sourceMiddleware), address(echoApp), connectorIds, DEST_MIN_CHARGE, WETH_UNIT);

        sourceMiddleware.registerLocalApplication(address(sourceApp));
        destinationMiddleware.registerLocalApplication(address(echoApp));

        // Connector 1 always denies authorization (simulates a known-bad connector).
        sourceConnector1.setDenyAuthorize(true);
    }

    function test_RevertWhenDeployingMiddlewareWithZeroQueueAddress() public {
        vm.expectRevert(ClprMiddleware.InvalidQueue.selector);
        new ClprMiddleware(address(0), SOURCE_LEDGER_ID);
    }

    function test_RevertWhenDeployingSourceApplicationWithZeroMiddlewareAddress() public {
        vm.expectRevert(SourceApplication.InvalidMiddleware.selector);
        bytes32[] memory connectorIds = new bytes32[](1);
        connectorIds[0] = bytes32(uint256(1));
        new SourceApplication(address(0), address(1), connectorIds, 1, "WETH");
    }

    function test_RevertWhenDeployingEchoApplicationWithZeroMiddlewareAddress() public {
        vm.expectRevert(EchoApplication.InvalidMiddleware.selector);
        new EchoApplication(address(0));
    }

    function test_SendsThreeMessagesWithConnectorFailoverAndFundsChecks() public {
        bytes memory payload1 = bytes("mvp-msg-1");
        bytes memory payload2 = bytes("mvp-msg-2");
        bytes memory payload3 = bytes("mvp-msg-3");

        // Message 1: connector 1 rejects; connector 2 accepts.
        ClprTypes.ClprSendMessageStatus memory s1 = sourceApp.sendWithFailover(payload1);
        assertEq(uint8(s1.status), uint8(ClprTypes.ClprSendStatus.Accepted));
        assertEq(queue.nextMessageId(), 1);
        assertEq(sourceConnector1.authorizeCount(), 1);
        assertEq(sourceConnector2.authorizeCount(), 1);

        // Message 2: connector 2 accepts.
        ClprTypes.ClprSendMessageStatus memory s2 = sourceApp.sendWithFailover(payload2);
        assertEq(uint8(s2.status), uint8(ClprTypes.ClprSendStatus.Accepted));
        assertEq(queue.nextMessageId(), 2);
        assertEq(sourceConnector2.authorizeCount(), 2);

        // Deliver responses so the source middleware learns the destination connector's balance report.
        queue.deliverAllMessageResponses();

        // Destination connector 2 should now be at the safety threshold boundary.
        assertEq(weth.balanceOf(address(destinationConnector2)), DEST_SAFETY_THRESHOLD);

        (
            uint256 availableBalance,
            uint256 safetyThreshold,
            uint256 minimumCharge,
            ,
            string memory unit,
            bool known,
            bool unavailable
        ) = sourceMiddleware.remoteStatusByDestinationConnector(destinationConnectorId2);
        assertEq(known, true);
        assertEq(unavailable, false);
        assertEq(availableBalance, DEST_SAFETY_THRESHOLD);
        assertEq(safetyThreshold, DEST_SAFETY_THRESHOLD);
        assertEq(minimumCharge, DEST_MIN_CHARGE);
        assertEq(keccak256(bytes(unit)), keccak256(bytes(WETH_UNIT)));

        // Message 3: connector 2 is rejected pre-enqueue; connector 3 accepts.
        ClprTypes.ClprSendMessageStatus memory s3 = sourceApp.sendWithFailover(payload3);
        assertEq(uint8(s3.status), uint8(ClprTypes.ClprSendStatus.Accepted));
        assertEq(queue.nextMessageId(), 3);
        assertEq(sourceConnector2.sendRejectedCount(), 1);
        assertEq(sourceConnector2.authorizeCount(), 2); // no authorize on pre-enqueue rejection

        // Destination app handled three successful messages.
        assertEq(echoApp.requestCount(), 3);
    }
}
