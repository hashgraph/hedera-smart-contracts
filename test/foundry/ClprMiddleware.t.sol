// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import { ClprTypes } from "../../contracts/solidity/clpr/types/ClprTypes.sol";
import { ClprMiddleware } from "../../contracts/solidity/clpr/middleware/ClprMiddleware.sol";
import { MockClprQueue } from "../../contracts/solidity/clpr/mocks/MockClprQueue.sol";
import { MockClprConnector } from "../../contracts/solidity/clpr/mocks/MockClprConnector.sol";
import { SourceApplication } from "../../contracts/solidity/clpr/apps/SourceApplication.sol";
import { EchoApplication } from "../../contracts/solidity/clpr/apps/EchoApplication.sol";

contract ClprMiddlewareTest is Test {
    MockClprQueue private queue;
    ClprMiddleware private sourceMiddleware;
    ClprMiddleware private destinationMiddleware;
    MockClprConnector private sourceConnector;
    MockClprConnector private destinationConnector;
    SourceApplication private sourceApp;
    SourceApplication private sourceApp2;
    EchoApplication private echoApp;

    function setUp() public {
        queue = new MockClprQueue();
        sourceMiddleware = new ClprMiddleware(address(queue));
        destinationMiddleware = new ClprMiddleware(address(queue));

        queue.configureEndpoints(address(sourceMiddleware), address(destinationMiddleware));

        sourceConnector = new MockClprConnector();
        destinationConnector = new MockClprConnector();
        sourceMiddleware.configureConnectorPair(address(sourceConnector), address(destinationConnector));

        echoApp = new EchoApplication(address(destinationMiddleware));

        sourceApp = new SourceApplication(address(sourceMiddleware), address(echoApp), address(sourceConnector));
        sourceApp2 = new SourceApplication(address(sourceMiddleware), address(echoApp), address(sourceConnector));

        sourceMiddleware.registerLocalApplication(address(sourceApp));
        sourceMiddleware.registerLocalApplication(address(sourceApp2));
        destinationMiddleware.registerLocalApplication(address(echoApp));
    }

    function test_RevertWhenDeployingMiddlewareWithZeroQueueAddress() public {
        vm.expectRevert(ClprMiddleware.InvalidQueue.selector);
        new ClprMiddleware(address(0));
    }

    function test_RevertWhenDeployingSourceApplicationWithZeroMiddlewareAddress() public {
        vm.expectRevert(SourceApplication.InvalidMiddleware.selector);
        new SourceApplication(address(0), address(1), address(2));
    }

    function test_RevertWhenDeployingEchoApplicationWithZeroMiddlewareAddress() public {
        vm.expectRevert(EchoApplication.InvalidMiddleware.selector);
        new EchoApplication(address(0));
    }

    function test_RoutesRequestAndResponseThroughQueueAndInvokesAuthorizeHook() public {
        bytes memory payload = bytes("it1-echo-payload");

        vm.recordLogs();
        ClprTypes.ClprSendMessageStatus memory status = sourceApp.send(payload);
        assertEq(status.appMsgId, 1);
        assertEq(uint8(status.status), uint8(ClprTypes.ClprSendStatus.Accepted));

        // One request/response pair is enqueued; response delivery is an explicit step in the mock queue.
        assertEq(queue.nextMessageId(), 1);
        assertEq(queue.nextResponseId(), 1);
        assertEq(sourceConnector.authorizeCount(), 1);
        assertEq(queue.hasPendingResponse(1), true);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 handledSig = keccak256("MessageHandled(address,bytes)");
        bool foundHandled;
        for (uint256 i = 0; i < logs.length; i++) {
            Vm.Log memory entry = logs[i];
            if (entry.emitter != address(echoApp)) continue;
            if (entry.topics.length < 2) continue;
            if (entry.topics[0] != handledSig) continue;
            assertEq(address(uint160(uint256(entry.topics[1]))), address(sourceConnector));
            assertEq(keccak256(abi.decode(entry.data, (bytes))), keccak256(payload));
            foundHandled = true;
            break;
        }
        assertEq(foundHandled, true);

        // Middleware has recorded pending routing context keyed by messaging-layer message id.
        (,, bool exists) = sourceMiddleware.pendingByMessageId(1);
        assertEq(exists, true);

        // Deliver the enqueued response back to the source middleware (async boundary simulation).
        vm.recordLogs();
        queue.deliverMessageResponse(1);

        Vm.Log[] memory deliveryLogs = vm.getRecordedLogs();
        bytes32 responseSig = keccak256("ResponseReceived(uint64,bytes)");
        bool foundResponse;
        for (uint256 i = 0; i < deliveryLogs.length; i++) {
            Vm.Log memory entry = deliveryLogs[i];
            if (entry.emitter != address(sourceApp)) continue;
            if (entry.topics.length < 2) continue;
            if (entry.topics[0] != responseSig) continue;
            assertEq(uint64(uint256(entry.topics[1])), 1);
            assertEq(keccak256(abi.decode(entry.data, (bytes))), keccak256(payload));
            foundResponse = true;
            break;
        }
        assertEq(foundResponse, true);

        assertEq(queue.hasPendingResponse(1), false);

        assertEq(echoApp.requestCount(), 1);

        // Pending routing context should be cleared after response delivery.
        (,, bool pendingAfterExists) = sourceMiddleware.pendingByMessageId(1);
        assertEq(pendingAfterExists, false);
    }

    function test_RoutesResponsesToCorrectSourceAppForMultipleCallers() public {
        bytes memory payload1 = bytes("it1-echo-payload-app1");
        bytes memory payload2 = bytes("it1-echo-payload-app2");

        sourceApp.send(payload1);
        sourceApp2.send(payload2);

        assertEq(queue.nextMessageId(), 2);
        assertEq(queue.nextResponseId(), 2);

        vm.recordLogs();
        queue.deliverAllMessageResponses();

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 responseSig = keccak256("ResponseReceived(uint64,bytes)");
        bool foundApp1;
        bool foundApp2;
        bytes memory seenPayload1;
        bytes memory seenPayload2;
        for (uint256 i = 0; i < logs.length; i++) {
            Vm.Log memory entry = logs[i];
            if (entry.topics.length < 2) continue;
            if (entry.topics[0] != responseSig) continue;
            bytes memory decodedPayload = abi.decode(entry.data, (bytes));
            if (entry.emitter == address(sourceApp)) {
                foundApp1 = true;
                seenPayload1 = decodedPayload;
            } else if (entry.emitter == address(sourceApp2)) {
                foundApp2 = true;
                seenPayload2 = decodedPayload;
            }
        }
        assertEq(foundApp1, true);
        assertEq(foundApp2, true);
        assertEq(keccak256(seenPayload1), keccak256(payload1));
        assertEq(keccak256(seenPayload2), keccak256(payload2));

        (,, bool pending1Exists) = sourceMiddleware.pendingByMessageId(1);
        (,, bool pending2Exists) = sourceMiddleware.pendingByMessageId(2);
        assertEq(pending1Exists, false);
        assertEq(pending2Exists, false);
    }
}
