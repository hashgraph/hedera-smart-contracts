// SPDX-License-Identifier: Apache-2.0

const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // 1) Deploy queue and middleware endpoints.
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

  // 2) Deploy a mock connector pair and configure pairing on the source middleware (IT1-CONN-AUTH).
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

  // 3) Deploy destination application first so the source app can be constructed with a known destination.
  const EchoApp = await ethers.getContractFactory('EchoApplication');
  const echoApp = await EchoApp.deploy(await destinationMiddleware.getAddress());
  await echoApp.waitForDeployment();
  console.log('Echo app:', await echoApp.getAddress());

  const SourceApp = await ethers.getContractFactory('SourceApplication');
  const sourceApp = await SourceApp.deploy(
    await sourceMiddleware.getAddress(),
    await echoApp.getAddress(),
    await sourceConnector.getAddress()
  );
  await sourceApp.waitForDeployment();
  console.log('Source app:', await sourceApp.getAddress());

  // 4) Register local apps on each middleware instance.
  await (await sourceMiddleware.registerLocalApplication(await sourceApp.getAddress())).wait();
  await (await destinationMiddleware.registerLocalApplication(await echoApp.getAddress())).wait();

  // 5) Send one payload; queue will enqueue a response which must then be delivered.
  const payload = ethers.toUtf8Bytes('clpr-it1-local-smoke');
  const tx = await sourceApp.send(payload);
  const sendReceipt = await tx.wait();
  const sendBlockNumber = sendReceipt.blockNumber;

  const sendEvents = await sourceApp.queryFilter(
    sourceApp.filters.SendAttempted(),
    sendBlockNumber,
    sendBlockNumber
  );
  if (sendEvents.length !== 1) {
    throw new Error(`Expected 1 SendAttempted event, got ${sendEvents.length}`);
  }

  const deliverReceipt = await (await queue.deliverAllMessageResponses()).wait();
  const deliverBlockNumber = deliverReceipt.blockNumber;

  // 6) Read final state to confirm end-to-end round-trip behavior.
  const responseEvents = await sourceApp.queryFilter(
    sourceApp.filters.ResponseReceived(),
    deliverBlockNumber,
    deliverBlockNumber
  );
  if (responseEvents.length !== 1) {
    throw new Error(`Expected 1 ResponseReceived event, got ${responseEvents.length}`);
  }
  const responsePayload = ethers.toUtf8String(responseEvents[0].args.payload);
  const responseAppMsgId = responseEvents[0].args.appMsgId;

  console.log('Queue message count:', (await queue.nextMessageId()).toString());
  console.log('Queue response count:', (await queue.nextResponseId()).toString());
  console.log('Source connector authorizeCount:', (await sourceConnector.authorizeCount()).toString());
  console.log('Last sent app msg id:', sendEvents[0].args.appMsgId.toString());
  console.log('Last response app msg id:', responseAppMsgId.toString());
  console.log('Response count:', responseEvents.length.toString());
  console.log('Last response payload:', responsePayload);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
