// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('@solidityequiv1 CLPR Middleware IT1-CONN-AUTH', function () {
  let queue;
  let sourceMiddleware;
  let destinationMiddleware;
  let sourceConnector;
  let destinationConnector;
  let sourceApp;
  let sourceApp2;
  let echoApp;

  beforeEach(async function () {
    // Arrange mock messaging layer + two middleware endpoints (source and destination).
    const queueFactory = await ethers.getContractFactory('MockClprQueue');
    queue = await queueFactory.deploy();

    const middlewareFactory = await ethers.getContractFactory('ClprMiddleware');
    sourceMiddleware = await middlewareFactory.deploy(await queue.getAddress());
    destinationMiddleware = await middlewareFactory.deploy(await queue.getAddress());

    await (
      await queue.configureEndpoints(
        await sourceMiddleware.getAddress(),
        await destinationMiddleware.getAddress()
      )
    ).wait();

    // Deploy a mock connector pair (IT1: authorize hook always approves).
    const connectorFactory = await ethers.getContractFactory('MockClprConnector');
    sourceConnector = await connectorFactory.deploy();
    destinationConnector = await connectorFactory.deploy();

    // Configure pairing (IT1 placeholder for connector registration state).
    await (
      await sourceMiddleware.configureConnectorPair(
        await sourceConnector.getAddress(),
        await destinationConnector.getAddress()
      )
    ).wait();

    // Deploy the destination application first so source apps can be constructed with a known destination.
    const echoAppFactory = await ethers.getContractFactory('EchoApplication');
    echoApp = await echoAppFactory.deploy(await destinationMiddleware.getAddress());

    // Deploy reference applications that simulate app-to-app routing across ledgers.
    const sourceAppFactory = await ethers.getContractFactory('SourceApplication');
    sourceApp = await sourceAppFactory.deploy(
      await sourceMiddleware.getAddress(),
      await echoApp.getAddress(),
      await sourceConnector.getAddress()
    );
    sourceApp2 = await sourceAppFactory.deploy(
      await sourceMiddleware.getAddress(),
      await echoApp.getAddress(),
      await sourceConnector.getAddress()
    );

    // Register apps so middleware accepts them as local participants.
    await sourceMiddleware.registerLocalApplication(await sourceApp.getAddress());
    await sourceMiddleware.registerLocalApplication(await sourceApp2.getAddress());
    await destinationMiddleware.registerLocalApplication(await echoApp.getAddress());
  });

  it('rejects middleware deployment with zero queue address', async function () {
    const middlewareFactory = await ethers.getContractFactory('ClprMiddleware');
    await expect(middlewareFactory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      middlewareFactory,
      'InvalidQueue'
    );
  });

  it('rejects source app deployment with zero middleware address', async function () {
    const sourceAppFactory = await ethers.getContractFactory('SourceApplication');
    await expect(
      sourceAppFactory.deploy(
        ethers.ZeroAddress,
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002'
      )
    ).to.be.revertedWithCustomError(sourceAppFactory, 'InvalidMiddleware');
  });

  it('rejects echo app deployment with zero middleware address', async function () {
    const echoAppFactory = await ethers.getContractFactory('EchoApplication');
    await expect(echoAppFactory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      echoAppFactory,
      'InvalidMiddleware'
    );
  });

  it('routes request and response through mock queue and invokes connector authorize hook', async function () {
    // Act: source app sends one payload; queue + middleware pipeline runs end-to-end.
    const payload = ethers.toUtf8Bytes('it1-echo-payload');
    const sendTx = await sourceApp.send(payload);
    const receipt = await sendTx.wait();
    const blockNumber = receipt.blockNumber;

    const messageEvents = await queue.queryFilter(
      queue.filters.MessageEnqueued(),
      blockNumber,
      blockNumber
    );
    const queueResponseEvents = await queue.queryFilter(
      queue.filters.MessageResponseEnqueued(),
      blockNumber,
      blockNumber
    );

    // Assert: request and response each passed through the queue exactly once.
    expect(messageEvents.length).to.equal(1);
    expect(queueResponseEvents.length).to.equal(1);

    // Assert: queue assigns an outbound message id and copies it into the response original message id.
    expect(messageEvents[0].args.messageId).to.equal(1n);
    expect(messageEvents[0].args.senderApplicationId).to.equal(
      await sourceApp.getAddress()
    );
    expect(messageEvents[0].args.destinationApplicationId).to.equal(
      await echoApp.getAddress()
    );
    expect(messageEvents[0].args.sourceConnectorId).to.equal(await sourceConnector.getAddress());
    expect(messageEvents[0].args.destinationConnectorId).to.equal(
      await destinationConnector.getAddress()
    );

    expect(queueResponseEvents[0].args.originalMessageId).to.equal(1n);
    expect(queueResponseEvents[0].args.status).to.equal(0n); // Success

    // Response is enqueued but not delivered synchronously (mock queue simulates async boundary).
    expect(await queue.hasPendingResponse(1n)).to.equal(true);

    // Source middleware should be tracking the pending outbound message until response delivery.
    const pendingBeforeDelivery = await sourceMiddleware.pendingByMessageId(1);
    expect(pendingBeforeDelivery.exists).to.equal(true);

    const deliverTx = await queue.deliverMessageResponse(messageEvents[0].args.messageId);
    const deliverReceipt = await deliverTx.wait();
    const deliverBlockNumber = deliverReceipt.blockNumber;

    // Assert: source app observed successful response from configured destination app.
    expect(await queue.nextMessageId()).to.equal(1n);
    expect(await queue.nextResponseId()).to.equal(1n);

    expect(await sourceConnector.authorizeCount()).to.equal(1n);

    const sendAttemptEvents = await sourceApp.queryFilter(
      sourceApp.filters.SendAttempted(),
      blockNumber,
      blockNumber
    );
    expect(sendAttemptEvents.length).to.equal(1);
    expect(sendAttemptEvents[0].args.appMsgId).to.equal(1n);
    expect(sendAttemptEvents[0].args.status).to.equal(0n); // Accepted
    expect(sendAttemptEvents[0].args.failureReason).to.equal(0n); // None
    expect(sendAttemptEvents[0].args.failureSide).to.equal(0n); // None
    expect(sendAttemptEvents[0].args.payload).to.equal(ethers.hexlify(payload));

    // Assert: destination app received the original source app call.
    expect(await echoApp.requestCount()).to.equal(1n);

    const handledEvents = await echoApp.queryFilter(
      echoApp.filters.MessageHandled(),
      blockNumber,
      blockNumber
    );
    expect(handledEvents.length).to.equal(1);
    expect(handledEvents[0].args.connectorId).to.equal(await sourceConnector.getAddress());
    expect(handledEvents[0].args.payload).to.equal(ethers.hexlify(payload));

    const responseEvents = await sourceApp.queryFilter(
      sourceApp.filters.ResponseReceived(),
      deliverBlockNumber,
      deliverBlockNumber
    );
    expect(responseEvents.length).to.equal(1);
    expect(responseEvents[0].args.appMsgId).to.equal(1n);
    expect(responseEvents[0].args.payload).to.equal(ethers.hexlify(payload));

    // Assert: source middleware no longer tracks this message as pending.
    const pendingMessage = await sourceMiddleware.pendingByMessageId(1);
    expect(pendingMessage.exists).to.equal(false);

    expect(await queue.hasPendingResponse(1n)).to.equal(false);
  });

  it('routes responses to the correct source app when multiple local apps call the same destination service', async function () {
    const payload1 = ethers.toUtf8Bytes('it1-echo-payload-app1');
    const payload2 = ethers.toUtf8Bytes('it1-echo-payload-app2');

    await (await sourceApp.send(payload1)).wait();
    await (await sourceApp2.send(payload2)).wait();

    const deliverAllTx = await queue.deliverAllMessageResponses();
    const deliverAllReceipt = await deliverAllTx.wait();
    const deliverAllBlockNumber = deliverAllReceipt.blockNumber;

    // Two sends should produce two message/response pairs.
    expect(await queue.nextMessageId()).to.equal(2n);
    expect(await queue.nextResponseId()).to.equal(2n);

    const responseEventsApp1 = await sourceApp.queryFilter(
      sourceApp.filters.ResponseReceived(),
      deliverAllBlockNumber,
      deliverAllBlockNumber
    );
    const responseEventsApp2 = await sourceApp2.queryFilter(
      sourceApp2.filters.ResponseReceived(),
      deliverAllBlockNumber,
      deliverAllBlockNumber
    );
    expect(responseEventsApp1.length).to.equal(1);
    expect(responseEventsApp2.length).to.equal(1);
    expect(responseEventsApp1[0].args.appMsgId).to.equal(1n);
    expect(responseEventsApp2[0].args.appMsgId).to.equal(1n);
    expect(responseEventsApp1[0].args.payload).to.equal(ethers.hexlify(payload1));
    expect(responseEventsApp2[0].args.payload).to.equal(ethers.hexlify(payload2));

    // Source middleware should have cleared both pending entries after response delivery.
    const pendingMessage1 = await sourceMiddleware.pendingByMessageId(1);
    const pendingMessage2 = await sourceMiddleware.pendingByMessageId(2);
    expect(pendingMessage1.exists).to.equal(false);
    expect(pendingMessage2.exists).to.equal(false);
  });

  it('assigns per-application app msg ids monotonically (independent of message-layer ids)', async function () {
    const payload1 = ethers.toUtf8Bytes('it1-app-msg-1');
    const payload2 = ethers.toUtf8Bytes('it1-app-msg-2');

    const sendReceipt1 = await (await sourceApp.send(payload1)).wait();
    const sendBlock1 = sendReceipt1.blockNumber;
    const sendEvents1 = await sourceApp.queryFilter(
      sourceApp.filters.SendAttempted(),
      sendBlock1,
      sendBlock1
    );
    expect(sendEvents1.length).to.equal(1);
    expect(sendEvents1[0].args.appMsgId).to.equal(1n);

    const sendReceipt2 = await (await sourceApp.send(payload2)).wait();
    const sendBlock2 = sendReceipt2.blockNumber;
    const sendEvents2 = await sourceApp.queryFilter(
      sourceApp.filters.SendAttempted(),
      sendBlock2,
      sendBlock2
    );
    expect(sendEvents2.length).to.equal(1);
    expect(sendEvents2[0].args.appMsgId).to.equal(2n);

    // Messaging-layer ids are per-connection and continue increasing across apps.
    expect(await queue.nextMessageId()).to.equal(2n);
  });
});
