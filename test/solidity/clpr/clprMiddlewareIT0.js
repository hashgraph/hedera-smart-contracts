// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('@solidityequiv1 CLPR Middleware IT0-ECHO', function () {
  let queue;
  let sourceMiddleware;
  let destinationMiddleware;
  let sourceApp;
  let sourceApp2;
  let echoApp;

  beforeEach(async function () {
    // Arrange queue + two middleware endpoints (source and destination).
    const queueFactory = await ethers.getContractFactory('MockClprQueueIT0');
    queue = await queueFactory.deploy();

    const middlewareFactory = await ethers.getContractFactory('ClprMiddlewareIT0');
    sourceMiddleware = await middlewareFactory.deploy(await queue.getAddress());
    destinationMiddleware = await middlewareFactory.deploy(await queue.getAddress());

    // Deploy reference applications that simulate app-to-app routing across ledgers.
    const sourceAppFactory = await ethers.getContractFactory('SourceApplicationIT0');
    sourceApp = await sourceAppFactory.deploy(await sourceMiddleware.getAddress());
    sourceApp2 = await sourceAppFactory.deploy(await sourceMiddleware.getAddress());

    const echoAppFactory = await ethers.getContractFactory('EchoApplicationIT0');
    echoApp = await echoAppFactory.deploy(await destinationMiddleware.getAddress());

    // Register apps so middleware accepts them as local participants.
    await sourceMiddleware.registerLocalApplication(await sourceApp.getAddress());
    await sourceMiddleware.registerLocalApplication(await sourceApp2.getAddress());
    await destinationMiddleware.registerLocalApplication(await echoApp.getAddress());

    // Configure explicit peers on both apps so they reject unexpected routes.
    await sourceApp.configurePeer(
      await destinationMiddleware.getAddress(),
      await echoApp.getAddress()
    );
    await sourceApp2.configurePeer(
      await destinationMiddleware.getAddress(),
      await echoApp.getAddress()
    );
    await echoApp.configurePeer(
      await sourceMiddleware.getAddress(),
      await sourceApp.getAddress()
    );
  });

  it('rejects middleware deployment with zero queue address', async function () {
    const middlewareFactory = await ethers.getContractFactory('ClprMiddlewareIT0');
    await expect(middlewareFactory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      middlewareFactory,
      'InvalidQueue'
    );
  });

  it('rejects source app deployment with zero middleware address', async function () {
    const sourceAppFactory = await ethers.getContractFactory('SourceApplicationIT0');
    await expect(sourceAppFactory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      sourceAppFactory,
      'InvalidMiddleware'
    );
  });

  it('rejects echo app deployment with zero middleware address', async function () {
    const echoAppFactory = await ethers.getContractFactory('EchoApplicationIT0');
    await expect(echoAppFactory.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      echoAppFactory,
      'InvalidMiddleware'
    );
  });

  it('routes request and response through mock queue with expected app addresses', async function () {
    // Act: source app sends one payload; queue + middleware pipeline runs end-to-end.
    const payload = ethers.toUtf8Bytes('it0-echo-payload');
    const sendTx = await sourceApp.send(payload);
    const receipt = await sendTx.wait();
    const blockNumber = receipt.blockNumber;

    const messageEvents = await queue.queryFilter(
      queue.filters.MessageEnqueued(),
      blockNumber,
      blockNumber
    );
    const responseEvents = await queue.queryFilter(
      queue.filters.MessageResponseEnqueued(),
      blockNumber,
      blockNumber
    );

    // Assert: request and response each passed through the queue exactly once.
    expect(messageEvents.length).to.equal(1);
    expect(responseEvents.length).to.equal(1);

    // Assert: queue-level routing metadata reflects source->destination then destination->source.
    expect(messageEvents[0].args.appMessageId).to.equal(1n);
    expect(messageEvents[0].args.sourceMiddleware).to.equal(
      await sourceMiddleware.getAddress()
    );
    expect(messageEvents[0].args.destinationMiddleware).to.equal(
      await destinationMiddleware.getAddress()
    );

    expect(responseEvents[0].args.originalAppMessageId).to.equal(1n);
    expect(responseEvents[0].args.sourceMiddleware).to.equal(
      await destinationMiddleware.getAddress()
    );
    expect(responseEvents[0].args.destinationMiddleware).to.equal(
      await sourceMiddleware.getAddress()
    );

    // Assert: source app observed successful response from configured destination app.
    expect(await queue.nextQueueMessageId()).to.equal(2n);
    expect(await sourceApp.lastSentAppMessageId()).to.equal(1n);
    expect(await sourceApp.lastResponseAppMessageId()).to.equal(1n);
    expect(await sourceApp.lastResponseSourceApplication()).to.equal(
      await echoApp.getAddress()
    );
    expect(await sourceApp.lastResponseSuccess()).to.equal(true);
    expect(await sourceApp.responseCount()).to.equal(1n);

    // Assert: destination app received the original source app call.
    expect(await echoApp.lastRequestAppMessageId()).to.equal(1n);
    expect(await echoApp.lastRequestSourceApplication()).to.equal(
      await sourceApp.getAddress()
    );
    expect(await echoApp.requestCount()).to.equal(1n);

    // Assert: payload integrity is preserved through request and response envelopes.
    const sourcePayload = await sourceApp.lastResponsePayload();
    const echoPayload = await echoApp.lastRequestPayload();
    expect(sourcePayload).to.equal(ethers.hexlify(payload));
    expect(echoPayload).to.equal(ethers.hexlify(payload));

    // Assert: source middleware no longer tracks this message as pending.
    const pendingMessage = await sourceMiddleware.pendingAppMessages(1);
    expect(pendingMessage.exists).to.equal(false);
  });

  it('routes responses to the correct source app when multiple local apps call the same destination service', async function () {
    const payload1 = ethers.toUtf8Bytes('it0-echo-payload-app1');
    const payload2 = ethers.toUtf8Bytes('it0-echo-payload-app2');

    // Echo app peer validation is strict in IT0, so set expected source app per call.
    await echoApp.configurePeer(
      await sourceMiddleware.getAddress(),
      await sourceApp.getAddress()
    );
    await sourceApp.send(payload1);

    await echoApp.configurePeer(
      await sourceMiddleware.getAddress(),
      await sourceApp2.getAddress()
    );
    await sourceApp2.send(payload2);

    // Two sends should produce two message/response pairs through the queue.
    expect(await queue.nextQueueMessageId()).to.equal(4n);

    // Each source app receives exactly one response with its own payload.
    expect(await sourceApp.responseCount()).to.equal(1n);
    expect(await sourceApp2.responseCount()).to.equal(1n);
    expect(await sourceApp.lastResponseAppMessageId()).to.equal(1n);
    expect(await sourceApp2.lastResponseAppMessageId()).to.equal(2n);
    expect(await sourceApp.lastResponseSourceApplication()).to.equal(
      await echoApp.getAddress()
    );
    expect(await sourceApp2.lastResponseSourceApplication()).to.equal(
      await echoApp.getAddress()
    );
    expect(await sourceApp.lastResponseSuccess()).to.equal(true);
    expect(await sourceApp2.lastResponseSuccess()).to.equal(true);
    expect(await sourceApp.lastResponsePayload()).to.equal(ethers.hexlify(payload1));
    expect(await sourceApp2.lastResponsePayload()).to.equal(ethers.hexlify(payload2));

    // Source middleware should have cleared both pending entries after response delivery.
    const pendingMessage1 = await sourceMiddleware.pendingAppMessages(1);
    const pendingMessage2 = await sourceMiddleware.pendingAppMessages(2);
    expect(pendingMessage1.exists).to.equal(false);
    expect(pendingMessage2.exists).to.equal(false);
  });
});
