// SPDX-License-Identifier: Apache-2.0

const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);
  const sendPayloadFromApp = async (appContract, payload) => {
    const data = appContract.interface.encodeFunctionData('send', [payload]);
    const tx = await deployer.sendTransaction({
      to: await appContract.getAddress(),
      data,
    });
    await tx.wait();
    return tx.hash;
  };

  // 1) Deploy queue + middleware pair.
  const Queue = await ethers.getContractFactory('MockClprQueue');
  const queue = await Queue.deploy();
  await queue.waitForDeployment();
  console.log('Queue:', await queue.getAddress());

  const Middleware = await ethers.getContractFactory('ClprMiddleware');
  const sourceMiddleware = await Middleware.deploy(await queue.getAddress());
  await sourceMiddleware.waitForDeployment();
  console.log('Source middleware:', await sourceMiddleware.getAddress());

  const destinationMiddleware = await Middleware.deploy(await queue.getAddress());
  await destinationMiddleware.waitForDeployment();
  console.log('Destination middleware:', await destinationMiddleware.getAddress());

  await (
    await queue.configureEndpoints(
      await sourceMiddleware.getAddress(),
      await destinationMiddleware.getAddress()
    )
  ).wait();

  // 2) Deploy a mock connector pair and configure pairing on the source middleware.
  const Connector = await ethers.getContractFactory('MockClprConnector');
  const sourceConnector = await Connector.deploy();
  await sourceConnector.waitForDeployment();
  console.log('Source connector:', await sourceConnector.getAddress());

  const destinationConnector = await Connector.deploy();
  await destinationConnector.waitForDeployment();
  console.log('Destination connector:', await destinationConnector.getAddress());

  await (
    await sourceMiddleware.configureConnectorPair(
      await sourceConnector.getAddress(),
      await destinationConnector.getAddress()
    )
  ).wait();

  // 3) Deploy destination echo application first so source apps can be constructed with a known destination.
  const EchoApp = await ethers.getContractFactory('EchoApplication');
  const echoApp = await EchoApp.deploy(await destinationMiddleware.getAddress());
  await echoApp.waitForDeployment();
  console.log('Echo app:', await echoApp.getAddress());

  // 4) Deploy two source applications.
  const SourceApp = await ethers.getContractFactory('SourceApplication');
  const sourceApp1 = await SourceApp.deploy(
    await sourceMiddleware.getAddress(),
    await echoApp.getAddress(),
    await sourceConnector.getAddress()
  );
  await sourceApp1.waitForDeployment();
  console.log('Source app 1:', await sourceApp1.getAddress());

  const sourceApp2 = await SourceApp.deploy(
    await sourceMiddleware.getAddress(),
    await echoApp.getAddress(),
    await sourceConnector.getAddress()
  );
  await sourceApp2.waitForDeployment();
  console.log('Source app 2:', await sourceApp2.getAddress());

  // 5) Register local apps on middleware.
  await (await sourceMiddleware.registerLocalApplication(await sourceApp1.getAddress())).wait();
  await (await sourceMiddleware.registerLocalApplication(await sourceApp2.getAddress())).wait();
  await (await destinationMiddleware.registerLocalApplication(await echoApp.getAddress())).wait();

  // 6) Send from source app 1 and validate response is routed back to app 1.
  const payload1 = ethers.toUtf8Bytes('clpr-it1-solo-app1');
  const txHash1 = await sendPayloadFromApp(sourceApp1, payload1);
  console.log('App1 send tx:', txHash1);
  console.log('Queue request count after app1 send:', (await queue.nextMessageId()).toString());

  // 7) Send from source app 2 and validate response is routed back to app 2.
  const payload2 = ethers.toUtf8Bytes('clpr-it1-solo-app2');
  const txHash2 = await sendPayloadFromApp(sourceApp2, payload2);
  console.log('App2 send tx:', txHash2);
  console.log('Queue request count after app2 send:', (await queue.nextMessageId()).toString());

  const deliverReceipt = await (await queue.deliverAllMessageResponses()).wait();
  const deliverBlockNumber = deliverReceipt.blockNumber;

  // 8) Read and assert final state.
  const app1ResponseEvents = await sourceApp1.queryFilter(
    sourceApp1.filters.ResponseReceived(),
    deliverBlockNumber,
    deliverBlockNumber
  );
  const app2ResponseEvents = await sourceApp2.queryFilter(
    sourceApp2.filters.ResponseReceived(),
    deliverBlockNumber,
    deliverBlockNumber
  );
  if (app1ResponseEvents.length !== 1 || app2ResponseEvents.length !== 1) {
    throw new Error(
      `Expected 1 ResponseReceived event per app, got app1=${app1ResponseEvents.length} app2=${app2ResponseEvents.length}`
    );
  }
  const app1ResponsePayload = ethers.toUtf8String(app1ResponseEvents[0].args.payload);
  const app2ResponsePayload = ethers.toUtf8String(app2ResponseEvents[0].args.payload);
  const app1ResponseCount = BigInt(app1ResponseEvents.length);
  const app2ResponseCount = BigInt(app2ResponseEvents.length);
  const queueMessageCount = await queue.nextMessageId();
  const queueResponseCount = await queue.nextResponseId();

  if (app1ResponsePayload !== 'clpr-it1-solo-app1') {
    throw new Error(`App1 payload mismatch: ${app1ResponsePayload}`);
  }
  if (app2ResponsePayload !== 'clpr-it1-solo-app2') {
    throw new Error(`App2 payload mismatch: ${app2ResponsePayload}`);
  }
  if (app1ResponseCount !== 1n || app2ResponseCount !== 1n) {
    throw new Error(`Unexpected response counts: app1=${app1ResponseCount}, app2=${app2ResponseCount}`);
  }
  if (queueMessageCount !== 2n || queueResponseCount !== 2n) {
    throw new Error(`Unexpected queue counts: messages=${queueMessageCount} responses=${queueResponseCount}`);
  }

  console.log('Queue message count:', queueMessageCount.toString());
  console.log('Queue response count:', queueResponseCount.toString());
  console.log('App1 response count:', app1ResponseCount.toString());
  console.log('App2 response count:', app2ResponseCount.toString());
  console.log('App1 last response payload:', app1ResponsePayload);
  console.log('App2 last response payload:', app2ResponsePayload);
  console.log('App1 last response app msg id:', app1ResponseEvents[0].args.appMsgId.toString());
  console.log('App2 last response app msg id:', app2ResponseEvents[0].args.appMsgId.toString());
  console.log('Multi-source SOLO smoke: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
