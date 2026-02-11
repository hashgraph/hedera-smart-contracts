// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const hre = require('hardhat');
const { ethers } = require('ethers');

describe('@clprbridge CLPR two-network relayed queue', function () {
  this.timeout(10 * 60 * 1000);

  const SOURCE_LEDGER_ID = ethers.keccak256(
    ethers.toUtf8Bytes('clpr-ledger-source')
  );
  const DEST_LEDGER_ID = ethers.keccak256(
    ethers.toUtf8Bytes('clpr-ledger-destination')
  );

  const ETH_UNIT = 'ETH';
  const WETH_UNIT = 'WETH';

  const DEST_MIN_CHARGE = 50n;
  const DEST_SAFETY_THRESHOLD = 60n;

  const GAS_LIMIT = 12_000_000;

  const env = (key, defaultValue) =>
    process.env[key] && process.env[key].trim() !== ''
      ? process.env[key].trim()
      : defaultValue;

  const getPrivateKey = () => {
    const direct = env('CLPR_PRIVATE_KEY', '');
    if (direct) return direct;
    const keys = env('PRIVATE_KEYS', '');
    if (!keys) return '';
    return keys.split(',')[0].trim();
  };

  const readArtifact = async (name) => hre.artifacts.readArtifact(name);

  const deploy = async (artifactName, signer, args, overrides) => {
    const artifact = await readArtifact(artifactName);
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer
    );
    const contract = await factory.deploy(...args, overrides);
    await contract.waitForDeployment();
    return contract;
  };

  it('bridges requests/responses across two networks via MockClprRelayedQueue', async function () {
    const srcRpcUrl = env('CLPR_SRC_RPC_URL', 'http://127.0.0.1:7546');
    const dstRpcUrl = env('CLPR_DST_RPC_URL', 'http://127.0.0.1:7547');

    const privateKey = getPrivateKey();
    if (!privateKey) {
      throw new Error(
        'Missing private key. Set CLPR_PRIVATE_KEY or PRIVATE_KEYS in the environment.'
      );
    }

    const srcProvider = new ethers.JsonRpcProvider(srcRpcUrl);
    const dstProvider = new ethers.JsonRpcProvider(dstRpcUrl);

    // Fail fast if either endpoint is unreachable.
    await Promise.all([srcProvider.getBlockNumber(), dstProvider.getBlockNumber()]);

    const srcWallet = new ethers.Wallet(privateKey, srcProvider);
    const dstWallet = new ethers.Wallet(privateKey, dstProvider);

    // -----------------------------------------------------------------------
    // Deploy queue + middleware on each network
    // -----------------------------------------------------------------------
    const srcQueue = await deploy(
      'MockClprRelayedQueue',
      srcWallet,
      [],
      { gasLimit: GAS_LIMIT }
    );
    const dstQueue = await deploy(
      'MockClprRelayedQueue',
      dstWallet,
      [],
      { gasLimit: GAS_LIMIT }
    );

    const srcMiddleware = await deploy(
      'ClprMiddleware',
      srcWallet,
      [await srcQueue.getAddress(), SOURCE_LEDGER_ID],
      { gasLimit: GAS_LIMIT }
    );
    const dstMiddleware = await deploy(
      'ClprMiddleware',
      dstWallet,
      [await dstQueue.getAddress(), DEST_LEDGER_ID],
      { gasLimit: GAS_LIMIT }
    );

    await (
      await srcQueue.configureMiddleware(await srcMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();
    await (
      await dstQueue.configureMiddleware(await dstMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();

    // -----------------------------------------------------------------------
    // Deploy destination currency (WETH) and connectors
    // -----------------------------------------------------------------------
    const weth = await deploy(
      'OZERC20Mock',
      dstWallet,
      ['Wrapped ETH', 'WETH'],
      { gasLimit: GAS_LIMIT }
    );

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

    const sourceConnectorId1 = deriveId(
      'src',
      ownerKey1,
      SOURCE_LEDGER_ID,
      DEST_LEDGER_ID
    );
    const destinationConnectorId1 = deriveId(
      'dst',
      ownerKey1,
      DEST_LEDGER_ID,
      SOURCE_LEDGER_ID
    );

    const sourceConnectorId2 = deriveId(
      'src',
      ownerKey2,
      SOURCE_LEDGER_ID,
      DEST_LEDGER_ID
    );
    const destinationConnectorId2 = deriveId(
      'dst',
      ownerKey2,
      DEST_LEDGER_ID,
      SOURCE_LEDGER_ID
    );

    const sourceConnectorId3 = deriveId(
      'src',
      ownerKey3,
      SOURCE_LEDGER_ID,
      DEST_LEDGER_ID
    );
    const destinationConnectorId3 = deriveId(
      'dst',
      ownerKey3,
      DEST_LEDGER_ID,
      SOURCE_LEDGER_ID
    );

    const outboundMax = { value: DEST_MIN_CHARGE, unit: WETH_UNIT };
    const unbounded = ethers.MaxUint256;

    const sourceConnector1 = await deploy(
      'MockClprConnector',
      srcWallet,
      [
        sourceConnectorId1,
        destinationConnectorId1,
        DEST_LEDGER_ID,
        ETH_UNIT,
        ethers.ZeroAddress,
        0,
        0,
        unbounded,
        outboundMax,
      ],
      { value: ethers.parseEther('1'), gasLimit: GAS_LIMIT }
    );
    const sourceConnector2 = await deploy(
      'MockClprConnector',
      srcWallet,
      [
        sourceConnectorId2,
        destinationConnectorId2,
        DEST_LEDGER_ID,
        ETH_UNIT,
        ethers.ZeroAddress,
        0,
        0,
        unbounded,
        outboundMax,
      ],
      { value: ethers.parseEther('1'), gasLimit: GAS_LIMIT }
    );
    const sourceConnector3 = await deploy(
      'MockClprConnector',
      srcWallet,
      [
        sourceConnectorId3,
        destinationConnectorId3,
        DEST_LEDGER_ID,
        ETH_UNIT,
        ethers.ZeroAddress,
        0,
        0,
        unbounded,
        outboundMax,
      ],
      { value: ethers.parseEther('1'), gasLimit: GAS_LIMIT }
    );

    const destinationConnector1 = await deploy(
      'MockClprConnector',
      dstWallet,
      [
        destinationConnectorId1,
        sourceConnectorId1,
        SOURCE_LEDGER_ID,
        WETH_UNIT,
        await weth.getAddress(),
        DEST_SAFETY_THRESHOLD,
        DEST_MIN_CHARGE,
        unbounded,
        { value: unbounded, unit: WETH_UNIT },
      ],
      { gasLimit: GAS_LIMIT }
    );
    const destinationConnector2 = await deploy(
      'MockClprConnector',
      dstWallet,
      [
        destinationConnectorId2,
        sourceConnectorId2,
        SOURCE_LEDGER_ID,
        WETH_UNIT,
        await weth.getAddress(),
        DEST_SAFETY_THRESHOLD,
        DEST_MIN_CHARGE,
        unbounded,
        { value: unbounded, unit: WETH_UNIT },
      ],
      { gasLimit: GAS_LIMIT }
    );
    const destinationConnector3 = await deploy(
      'MockClprConnector',
      dstWallet,
      [
        destinationConnectorId3,
        sourceConnectorId3,
        SOURCE_LEDGER_ID,
        WETH_UNIT,
        await weth.getAddress(),
        DEST_SAFETY_THRESHOLD,
        DEST_MIN_CHARGE,
        unbounded,
        { value: unbounded, unit: WETH_UNIT },
      ],
      { gasLimit: GAS_LIMIT }
    );

    // Seed destination connector funds (connector 1 intentionally underfunded).
    await (
      await weth.mint(await destinationConnector2.getAddress(), 160n, {
        gasLimit: GAS_LIMIT,
      })
    ).wait();
    await (
      await weth.mint(await destinationConnector3.getAddress(), 500n, {
        gasLimit: GAS_LIMIT,
      })
    ).wait();

    // Register connectors with middleware instances.
    await (
      await sourceConnector1.registerWithMiddleware(await srcMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();
    await (
      await sourceConnector2.registerWithMiddleware(await srcMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();
    await (
      await sourceConnector3.registerWithMiddleware(await srcMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();

    await (
      await destinationConnector1.registerWithMiddleware(await dstMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();
    await (
      await destinationConnector2.registerWithMiddleware(await dstMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();
    await (
      await destinationConnector3.registerWithMiddleware(await dstMiddleware.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();

    // Connector 1 "knows" it cannot be used.
    await (await sourceConnector1.setDenyAuthorize(true, { gasLimit: GAS_LIMIT })).wait();

    // -----------------------------------------------------------------------
    // Deploy apps (destination first so the source can embed the destination address as an id)
    // -----------------------------------------------------------------------
    const echoApp = await deploy(
      'EchoApplication',
      dstWallet,
      [await dstMiddleware.getAddress()],
      { gasLimit: GAS_LIMIT }
    );

    const sourceApp = await deploy(
      'SourceApplication',
      srcWallet,
      [
        await srcMiddleware.getAddress(),
        await echoApp.getAddress(),
        [sourceConnectorId1, sourceConnectorId2, sourceConnectorId3],
        DEST_MIN_CHARGE,
        WETH_UNIT,
      ],
      { gasLimit: GAS_LIMIT }
    );

    await (
      await srcMiddleware.registerLocalApplication(await sourceApp.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();
    await (
      await dstMiddleware.registerLocalApplication(await echoApp.getAddress(), {
        gasLimit: GAS_LIMIT,
      })
    ).wait();

    // -----------------------------------------------------------------------
    // Minimal relayer loop (forward ABI-encoded bytes between ledgers)
    // -----------------------------------------------------------------------
    const relayMessageId = async (messageId) => {
      const messageBytes = await srcQueue.getOutboundMessageBytes(messageId);
      await (
        await dstQueue.deliverInboundMessage(messageId, messageBytes, {
          gasLimit: GAS_LIMIT,
        })
      ).wait();

      const responseBytes = await dstQueue.getPendingResponseBytes(messageId);
      await (
        await srcQueue.deliverInboundResponse(responseBytes, {
          gasLimit: GAS_LIMIT,
        })
      ).wait();
    };

    const responseStartBlock = await srcProvider.getBlockNumber();

    const payload1 = ethers.toUtf8Bytes('mvp-msg-1');
    const payload2 = ethers.toUtf8Bytes('mvp-msg-2');
    const payload3 = ethers.toUtf8Bytes('mvp-msg-3');

    // Message 1 and 2: send and then relay so the source middleware learns remote status.
    await (await sourceApp.sendWithFailover(payload1, { gasLimit: GAS_LIMIT })).wait();
    expect(await srcQueue.nextMessageId()).to.equal(1n);

    await (await sourceApp.sendWithFailover(payload2, { gasLimit: GAS_LIMIT })).wait();
    expect(await srcQueue.nextMessageId()).to.equal(2n);

    await relayMessageId(1);
    await relayMessageId(2);

    // Destination connector 2 should now be at the safety threshold boundary.
    expect(await weth.balanceOf(await destinationConnector2.getAddress())).to.equal(
      DEST_SAFETY_THRESHOLD
    );

    const remoteStatus = await srcMiddleware.remoteStatusByDestinationConnector(
      destinationConnectorId2
    );
    expect(remoteStatus.known).to.equal(true);
    expect(remoteStatus.unavailable).to.equal(false);
    expect(remoteStatus.availableBalance).to.equal(DEST_SAFETY_THRESHOLD);
    expect(remoteStatus.safetyThreshold).to.equal(DEST_SAFETY_THRESHOLD);
    expect(remoteStatus.minimumCharge).to.equal(DEST_MIN_CHARGE);
    expect(remoteStatus.unit).to.equal(WETH_UNIT);

    // Message 3: connector 2 is rejected pre-enqueue; connector 3 accepts.
    await (await sourceApp.sendWithFailover(payload3, { gasLimit: GAS_LIMIT })).wait();
    expect(await srcQueue.nextMessageId()).to.equal(3n);
    expect(await sourceConnector2.sendRejectedCount()).to.equal(1n);
    expect(await sourceConnector2.authorizeCount()).to.equal(2n); // no authorize on pre-enqueue rejection

    await relayMessageId(3);

    // Destination app handled three successful messages.
    expect(await echoApp.requestCount()).to.equal(3n);

    const responseEvents = await sourceApp.queryFilter(
      sourceApp.filters.ResponseReceived(),
      responseStartBlock
    );
    expect(responseEvents.length).to.equal(3);
    const responsePayloads = responseEvents.map((e) =>
      ethers.toUtf8String(e.args.payload)
    );
    expect(responsePayloads).to.deep.equal(['mvp-msg-1', 'mvp-msg-2', 'mvp-msg-3']);

    // Ensure the destination queue tracked inbound processing.
    expect(await dstQueue.inboundMessageProcessed(1)).to.equal(true);
    expect(await dstQueue.inboundMessageProcessed(2)).to.equal(true);
    expect(await dstQueue.inboundMessageProcessed(3)).to.equal(true);
  });
});

