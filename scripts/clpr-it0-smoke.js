// SPDX-License-Identifier: Apache-2.0

const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);

  // 1) Deploy queue and middleware endpoints.
  const Queue = await ethers.getContractFactory('MockClprQueueIT0');
  const queue = await Queue.deploy();
  await queue.waitForDeployment();
  console.log('Queue:', await queue.getAddress());

  const Middleware = await ethers.getContractFactory('ClprMiddlewareIT0');
  const sourceMiddleware = await Middleware.deploy(await queue.getAddress());
  await sourceMiddleware.waitForDeployment();
  console.log('Source middleware:', await sourceMiddleware.getAddress());

  const destinationMiddleware = await Middleware.deploy(await queue.getAddress());
  await destinationMiddleware.waitForDeployment();
  console.log('Destination middleware:', await destinationMiddleware.getAddress());

  // 2) Deploy source and destination applications.
  const SourceApp = await ethers.getContractFactory('SourceApplicationIT0');
  const sourceApp = await SourceApp.deploy(await sourceMiddleware.getAddress());
  await sourceApp.waitForDeployment();
  console.log('Source app:', await sourceApp.getAddress());

  const EchoApp = await ethers.getContractFactory('EchoApplicationIT0');
  const echoApp = await EchoApp.deploy(await destinationMiddleware.getAddress());
  await echoApp.waitForDeployment();
  console.log('Echo app:', await echoApp.getAddress());

  // 3) Register local apps on each middleware instance.
  await (await sourceMiddleware.registerLocalApplication(await sourceApp.getAddress())).wait();
  await (await destinationMiddleware.registerLocalApplication(await echoApp.getAddress())).wait();

  // 4) Configure explicit source<->destination peers.
  await (
    await sourceApp.configurePeer(
      await destinationMiddleware.getAddress(),
      await echoApp.getAddress()
    )
  ).wait();
  await (
    await echoApp.configurePeer(
      await sourceMiddleware.getAddress(),
      await sourceApp.getAddress()
    )
  ).wait();

  // 5) Send one payload and allow queue/middleware callbacks to complete.
  const payload = ethers.toUtf8Bytes('clpr-it0-local-smoke');
  const tx = await sourceApp.send(payload);
  await tx.wait();

  // 6) Read final state to confirm end-to-end round-trip behavior.
  const responsePayloadHex = await sourceApp.lastResponsePayload();
  const responsePayload = ethers.toUtf8String(responsePayloadHex);

  console.log('Queue message count:', (await queue.nextQueueMessageId()).toString());
  console.log('Last response app message id:', (await sourceApp.lastResponseAppMessageId()).toString());
  console.log('Last response success:', await sourceApp.lastResponseSuccess());
  console.log('Last response payload:', responsePayload);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
