// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('@solidityequiv1 CLPR Middleware MVP Connectors', function () {
  const SOURCE_LEDGER_ID = ethers.keccak256(ethers.toUtf8Bytes('clpr-ledger-source'));
  const DEST_LEDGER_ID = ethers.keccak256(ethers.toUtf8Bytes('clpr-ledger-destination'));
  const ETH_UNIT = 'ETH';
  const WETH_UNIT = 'WETH';

  const DEST_MIN_CHARGE = 50n;
  const DEST_SAFETY_THRESHOLD = 60n;

  let queue;
  let sourceMiddleware;
  let destinationMiddleware;
  let weth;

  let sourceConnector1;
  let sourceConnector2;
  let sourceConnector3;

  let destinationConnector1;
  let destinationConnector2;
  let destinationConnector3;

  let sourceConnectorId1;
  let sourceConnectorId2;
  let sourceConnectorId3;

  let destinationConnectorId1;
  let destinationConnectorId2;
  let destinationConnectorId3;

  let sourceApp;
  let echoApp;

  beforeEach(async function () {
    // Arrange mock messaging layer + two middleware endpoints (source and destination).
    const queueFactory = await ethers.getContractFactory('MockClprQueue');
    queue = await queueFactory.deploy();

    const middlewareFactory = await ethers.getContractFactory('ClprMiddleware');
    sourceMiddleware = await middlewareFactory.deploy(await queue.getAddress(), SOURCE_LEDGER_ID);
    destinationMiddleware = await middlewareFactory.deploy(await queue.getAddress(), DEST_LEDGER_ID);

    await (
      await queue.configureEndpoints(
        await sourceMiddleware.getAddress(),
        await destinationMiddleware.getAddress()
      )
    ).wait();

    // Destination ledger custom currency (wrapped ETH).
    const wethFactory = await ethers.getContractFactory('OZERC20Mock');
    weth = await wethFactory.deploy('Wrapped ETH', 'WETH');
    await weth.waitForDeployment();

    // Helper for deriving connector ids (models "hash over config" semantics from the spec).
    const deriveId = (prefix, ownerKey, localLedger, remoteLedger) =>
      ethers.keccak256(
        ethers.solidityPacked(
          ['string', 'bytes32', 'bytes32', 'bytes32'],
          [prefix, ownerKey, localLedger, remoteLedger]
        )
      );

    const ownerKey1 = ethers.keccak256(ethers.toUtf8Bytes('connector-owner-1'));
    const ownerKey2 = ethers.keccak256(ethers.toUtf8Bytes('connector-owner-2'));
    const ownerKey3 = ethers.keccak256(ethers.toUtf8Bytes('connector-owner-3'));

    sourceConnectorId1 = deriveId('src', ownerKey1, SOURCE_LEDGER_ID, DEST_LEDGER_ID);
    destinationConnectorId1 = deriveId('dst', ownerKey1, DEST_LEDGER_ID, SOURCE_LEDGER_ID);

    sourceConnectorId2 = deriveId('src', ownerKey2, SOURCE_LEDGER_ID, DEST_LEDGER_ID);
    destinationConnectorId2 = deriveId('dst', ownerKey2, DEST_LEDGER_ID, SOURCE_LEDGER_ID);

    sourceConnectorId3 = deriveId('src', ownerKey3, SOURCE_LEDGER_ID, DEST_LEDGER_ID);
    destinationConnectorId3 = deriveId('dst', ownerKey3, DEST_LEDGER_ID, SOURCE_LEDGER_ID);

    // Deploy three connector pairs (source uses ETH, destination uses WETH).
    const connectorFactory = await ethers.getContractFactory('MockClprConnector');

    // Source connectors (native ETH balance reporting); outbound max charge commitment is in WETH.
    const outboundMax = { value: DEST_MIN_CHARGE, unit: WETH_UNIT };
    sourceConnector1 = await connectorFactory.deploy(
      sourceConnectorId1,
      destinationConnectorId1,
      DEST_LEDGER_ID,
      ETH_UNIT,
      ethers.ZeroAddress,
      0,
      0,
      ethers.MaxUint256,
      outboundMax,
      { value: ethers.parseEther('1') }
    );
    sourceConnector2 = await connectorFactory.deploy(
      sourceConnectorId2,
      destinationConnectorId2,
      DEST_LEDGER_ID,
      ETH_UNIT,
      ethers.ZeroAddress,
      0,
      0,
      ethers.MaxUint256,
      outboundMax,
      { value: ethers.parseEther('1') }
    );
    sourceConnector3 = await connectorFactory.deploy(
      sourceConnectorId3,
      destinationConnectorId3,
      DEST_LEDGER_ID,
      ETH_UNIT,
      ethers.ZeroAddress,
      0,
      0,
      ethers.MaxUint256,
      outboundMax,
      { value: ethers.parseEther('1') }
    );

    // Destination connectors (ERC20=WETH balance reporting + reimbursement).
    const unbounded = ethers.MaxUint256;
    destinationConnector1 = await connectorFactory.deploy(
      destinationConnectorId1,
      sourceConnectorId1,
      SOURCE_LEDGER_ID,
      WETH_UNIT,
      await weth.getAddress(),
      DEST_SAFETY_THRESHOLD,
      DEST_MIN_CHARGE,
      unbounded,
      { value: unbounded, unit: WETH_UNIT }
    );
    destinationConnector2 = await connectorFactory.deploy(
      destinationConnectorId2,
      sourceConnectorId2,
      SOURCE_LEDGER_ID,
      WETH_UNIT,
      await weth.getAddress(),
      DEST_SAFETY_THRESHOLD,
      DEST_MIN_CHARGE,
      unbounded,
      { value: unbounded, unit: WETH_UNIT }
    );
    destinationConnector3 = await connectorFactory.deploy(
      destinationConnectorId3,
      sourceConnectorId3,
      SOURCE_LEDGER_ID,
      WETH_UNIT,
      await weth.getAddress(),
      DEST_SAFETY_THRESHOLD,
      DEST_MIN_CHARGE,
      unbounded,
      { value: unbounded, unit: WETH_UNIT }
    );

    // Seed destination connector funds (connector 1 intentionally underfunded).
    // Connector 2 has enough for two reimbursements and then hits the safety threshold boundary.
    await (await weth.mint(await destinationConnector2.getAddress(), 160n)).wait();
    await (await weth.mint(await destinationConnector3.getAddress(), 500n)).wait();

    // Register connectors with each middleware instance (self-registration via connector call).
    await (await sourceConnector1.registerWithMiddleware(await sourceMiddleware.getAddress())).wait();
    await (await sourceConnector2.registerWithMiddleware(await sourceMiddleware.getAddress())).wait();
    await (await sourceConnector3.registerWithMiddleware(await sourceMiddleware.getAddress())).wait();

    await (
      await destinationConnector1.registerWithMiddleware(await destinationMiddleware.getAddress())
    ).wait();
    await (
      await destinationConnector2.registerWithMiddleware(await destinationMiddleware.getAddress())
    ).wait();
    await (
      await destinationConnector3.registerWithMiddleware(await destinationMiddleware.getAddress())
    ).wait();

    // Deploy the destination application first so source apps can be constructed with a known destination.
    const echoAppFactory = await ethers.getContractFactory('EchoApplication');
    echoApp = await echoAppFactory.deploy(await destinationMiddleware.getAddress());

    // Deploy a source app with three connectors in priority order.
    const sourceAppFactory = await ethers.getContractFactory('SourceApplication');
    sourceApp = await sourceAppFactory.deploy(
      await sourceMiddleware.getAddress(),
      await echoApp.getAddress(),
      [sourceConnectorId1, sourceConnectorId2, sourceConnectorId3],
      DEST_MIN_CHARGE,
      WETH_UNIT
    );

    // Register apps so middleware accepts them as local participants.
    await sourceMiddleware.registerLocalApplication(await sourceApp.getAddress());
    await destinationMiddleware.registerLocalApplication(await echoApp.getAddress());

    // Connector 1 "knows" it cannot be used (simulates a connector with known bad remote funding status).
    await (await sourceConnector1.setDenyAuthorize(true)).wait();
  });

  it('rejects middleware deployment with zero queue address', async function () {
    const middlewareFactory = await ethers.getContractFactory('ClprMiddleware');
    await expect(
      middlewareFactory.deploy(ethers.ZeroAddress, SOURCE_LEDGER_ID)
    ).to.be.revertedWithCustomError(
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
        ['0x' + '11'.repeat(32)],
        1,
        'WETH'
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

  it('sends 3 messages with connector preference + failover and enforces destination funds safety threshold', async function () {
    const payload1 = ethers.toUtf8Bytes('mvp-msg-1');
    const payload2 = ethers.toUtf8Bytes('mvp-msg-2');
    const payload3 = ethers.toUtf8Bytes('mvp-msg-3');

    // Message 1: connector 1 rejects; connector 2 accepts.
    const tx1 = await sourceApp.sendWithFailover(payload1);
    const r1 = await tx1.wait();
    const b1 = r1.blockNumber;

    const sendEvents1 = await sourceApp.queryFilter(sourceApp.filters.SendAttempted(), b1, b1);
    expect(sendEvents1.length).to.equal(2);
    expect(sendEvents1[0].args.connectorId).to.equal(sourceConnectorId1);
    expect(sendEvents1[0].args.status).to.equal(1n); // Rejected
    expect(sendEvents1[1].args.connectorId).to.equal(sourceConnectorId2);
    expect(sendEvents1[1].args.status).to.equal(0n); // Accepted

    // Only the accepted attempt should enqueue a message.
    expect(await queue.nextMessageId()).to.equal(1n);
    expect(await sourceConnector1.authorizeCount()).to.equal(1n);
    expect(await sourceConnector2.authorizeCount()).to.equal(1n);

    // Message 2: connector 2 accepts.
    await (await sourceApp.sendWithFailover(payload2)).wait();
    expect(await queue.nextMessageId()).to.equal(2n);
    expect(await sourceConnector2.authorizeCount()).to.equal(2n);

    // Deliver both responses so the source middleware learns the remote balance report for connector 2.
    const deliverAllReceipt = await (await queue.deliverAllMessageResponses()).wait();
    const deliverBlock = deliverAllReceipt.blockNumber;

    const responseEvents = await sourceApp.queryFilter(
      sourceApp.filters.ResponseReceived(),
      deliverBlock,
      deliverBlock
    );
    expect(responseEvents.length).to.equal(2);
    expect(responseEvents[0].args.payload).to.equal(ethers.hexlify(payload1));
    expect(responseEvents[1].args.payload).to.equal(ethers.hexlify(payload2));

    // Destination connector 2 should now be at the safety threshold (out of funds for further sends).
    expect(await weth.balanceOf(await destinationConnector2.getAddress())).to.equal(60n);

    const remote2 = await sourceMiddleware.remoteStatusByDestinationConnector(destinationConnectorId2);
    expect(remote2.known).to.equal(true);
    expect(remote2.availableBalance).to.equal(60n);
    expect(remote2.safetyThreshold).to.equal(60n);

    // Message 3: connector 2 is rejected pre-enqueue due to remote out-of-funds; connector 3 accepts.
    const tx3 = await sourceApp.sendWithFailover(payload3);
    const r3 = await tx3.wait();
    const b3 = r3.blockNumber;

    const sendEvents3 = await sourceApp.queryFilter(sourceApp.filters.SendAttempted(), b3, b3);
    expect(sendEvents3.length).to.equal(2);
    expect(sendEvents3[0].args.connectorId).to.equal(sourceConnectorId2);
    expect(sendEvents3[0].args.status).to.equal(1n); // Rejected
    expect(sendEvents3[0].args.failureReason).to.equal(2n); // ConnectorOutOfFunds
    expect(sendEvents3[0].args.failureSide).to.equal(2n); // Destination

    expect(sendEvents3[1].args.connectorId).to.equal(sourceConnectorId3);
    expect(sendEvents3[1].args.status).to.equal(0n); // Accepted

    // Pre-enqueue rejection should notify the connector without calling authorize again.
    expect(await sourceConnector2.sendRejectedCount()).to.equal(1n);
    expect(await sourceConnector2.authorizeCount()).to.equal(2n);

    expect(await queue.nextMessageId()).to.equal(3n);

    const deliver3Receipt = await (await queue.deliverAllMessageResponses()).wait();
    const deliver3Block = deliver3Receipt.blockNumber;
    const responseEvents3 = await sourceApp.queryFilter(
      sourceApp.filters.ResponseReceived(),
      deliver3Block,
      deliver3Block
    );
    expect(responseEvents3.length).to.equal(1);
    expect(responseEvents3[0].args.payload).to.equal(ethers.hexlify(payload3));

    // Destination app handled three successful messages.
    expect(await echoApp.requestCount()).to.equal(3n);
  });
});
