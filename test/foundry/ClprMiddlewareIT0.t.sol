// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "forge-std/Test.sol";

import {ClprMiddlewareIT0} from "../../contracts/solidity/clpr/middleware/ClprMiddlewareIT0.sol";
import {MockClprQueueIT0} from "../../contracts/solidity/clpr/mocks/MockClprQueueIT0.sol";
import {SourceApplicationIT0} from "../../contracts/solidity/clpr/apps/SourceApplicationIT0.sol";
import {EchoApplicationIT0} from "../../contracts/solidity/clpr/apps/EchoApplicationIT0.sol";

contract ClprMiddlewareIT0Test is Test {
    MockClprQueueIT0 private queue;
    ClprMiddlewareIT0 private sourceMiddleware;
    ClprMiddlewareIT0 private destinationMiddleware;
    SourceApplicationIT0 private sourceApp;
    SourceApplicationIT0 private sourceApp2;
    EchoApplicationIT0 private echoApp;

    function setUp() public {
        queue = new MockClprQueueIT0();
        sourceMiddleware = new ClprMiddlewareIT0(address(queue));
        destinationMiddleware = new ClprMiddlewareIT0(address(queue));

        sourceApp = new SourceApplicationIT0(address(sourceMiddleware));
        sourceApp2 = new SourceApplicationIT0(address(sourceMiddleware));
        echoApp = new EchoApplicationIT0(address(destinationMiddleware));

        sourceMiddleware.registerLocalApplication(address(sourceApp));
        sourceMiddleware.registerLocalApplication(address(sourceApp2));
        destinationMiddleware.registerLocalApplication(address(echoApp));

        sourceApp.configurePeer(address(destinationMiddleware), address(echoApp));
        sourceApp2.configurePeer(address(destinationMiddleware), address(echoApp));
        echoApp.configurePeer(address(sourceMiddleware), address(sourceApp));
    }

    function test_RevertWhenDeployingMiddlewareWithZeroQueueAddress() public {
        vm.expectRevert(ClprMiddlewareIT0.InvalidQueue.selector);
        new ClprMiddlewareIT0(address(0));
    }

    function test_RevertWhenDeployingSourceApplicationWithZeroMiddlewareAddress() public {
        vm.expectRevert(SourceApplicationIT0.InvalidMiddleware.selector);
        new SourceApplicationIT0(address(0));
    }

    function test_RevertWhenDeployingEchoApplicationWithZeroMiddlewareAddress() public {
        vm.expectRevert(EchoApplicationIT0.InvalidMiddleware.selector);
        new EchoApplicationIT0(address(0));
    }

    function test_RoutesRequestAndResponseThroughQueue() public {
        bytes memory payload = bytes("it0-echo-payload");
        (uint64 appMessageId, uint64 queueMessageId) = sourceApp.send(payload);

        assertEq(appMessageId, 1);
        assertEq(queueMessageId, 1);

        assertEq(queue.nextQueueMessageId(), 2);
        assertEq(sourceApp.lastSentAppMessageId(), 1);
        assertEq(sourceApp.lastResponseAppMessageId(), 1);
        assertEq(sourceApp.lastResponseSourceApplication(), address(echoApp));
        assertEq(sourceApp.lastResponseSuccess(), true);
        assertEq(sourceApp.responseCount(), 1);

        assertEq(echoApp.lastRequestAppMessageId(), 1);
        assertEq(echoApp.lastRequestSourceApplication(), address(sourceApp));
        assertEq(echoApp.requestCount(), 1);

        assertEq(sourceApp.lastResponsePayload(), payload);
        assertEq(echoApp.lastRequestPayload(), payload);

        (,, bool exists) = sourceMiddleware.pendingAppMessages(1);
        assertEq(exists, false);
    }

    function test_RoutesResponsesToCorrectSourceAppForMultipleCallers() public {
        bytes memory payload1 = bytes("it0-echo-payload-app1");
        bytes memory payload2 = bytes("it0-echo-payload-app2");

        // Echo app peer validation is strict in IT0, so set expected source app per call.
        echoApp.configurePeer(address(sourceMiddleware), address(sourceApp));
        sourceApp.send(payload1);

        echoApp.configurePeer(address(sourceMiddleware), address(sourceApp2));
        sourceApp2.send(payload2);

        assertEq(queue.nextQueueMessageId(), 4);

        assertEq(sourceApp.responseCount(), 1);
        assertEq(sourceApp2.responseCount(), 1);
        assertEq(sourceApp.lastResponseAppMessageId(), 1);
        assertEq(sourceApp2.lastResponseAppMessageId(), 2);
        assertEq(sourceApp.lastResponseSourceApplication(), address(echoApp));
        assertEq(sourceApp2.lastResponseSourceApplication(), address(echoApp));
        assertEq(sourceApp.lastResponseSuccess(), true);
        assertEq(sourceApp2.lastResponseSuccess(), true);
        assertEq(sourceApp.lastResponsePayload(), payload1);
        assertEq(sourceApp2.lastResponsePayload(), payload2);

        (,, bool pending1Exists) = sourceMiddleware.pendingAppMessages(1);
        (,, bool pending2Exists) = sourceMiddleware.pendingAppMessages(2);
        assertEq(pending1Exists, false);
        assertEq(pending2Exists, false);
    }
}
