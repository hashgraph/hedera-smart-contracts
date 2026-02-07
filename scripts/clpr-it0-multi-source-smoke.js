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

  // 2) Deploy two source applications + one destination echo application.
  const SourceApp = await ethers.getContractFactory('SourceApplicationIT0');
  const sourceApp1 = await SourceApp.deploy(await sourceMiddleware.getAddress());
  await sourceApp1.waitForDeployment();
  console.log('Source app 1:', await sourceApp1.getAddress());

  const sourceApp2 = await SourceApp.deploy(await sourceMiddleware.getAddress());
  await sourceApp2.waitForDeployment();
  console.log('Source app 2:', await sourceApp2.getAddress());

  const EchoApp = await ethers.getContractFactory('EchoApplicationIT0');
  const echoApp = await EchoApp.deploy(await destinationMiddleware.getAddress());
  await echoApp.waitForDeployment();
  console.log('Echo app:', await echoApp.getAddress());

  // 3) Register local apps on middleware.
  await (await sourceMiddleware.registerLocalApplication(await sourceApp1.getAddress())).wait();
  await (await sourceMiddleware.registerLocalApplication(await sourceApp2.getAddress())).wait();
  await (await destinationMiddleware.registerLocalApplication(await echoApp.getAddress())).wait();

  // 4) Configure source peers for the same destination service.
  await (
    await sourceApp1.configurePeer(
      await destinationMiddleware.getAddress(),
      await echoApp.getAddress()
    )
  ).wait();
  await (
    await sourceApp2.configurePeer(
      await destinationMiddleware.getAddress(),
      await echoApp.getAddress()
    )
  ).wait();

  // 5) Send from source app 1 and validate response is routed back to app 1.
  await (
    await echoApp.configurePeer(
      await sourceMiddleware.getAddress(),
      await sourceApp1.getAddress()
    )
  ).wait();
  const payload1 = ethers.toUtf8Bytes('clpr-it0-solo-app1');
  const txHash1 = await sendPayloadFromApp(sourceApp1, payload1);
  console.log('App1 send tx:', txHash1);
  console.log('Queue count after app1 send:', (await queue.nextQueueMessageId()).toString());

  // 6) Send from source app 2 and validate response is routed back to app 2.
  await (
    await echoApp.configurePeer(
      await sourceMiddleware.getAddress(),
      await sourceApp2.getAddress()
    )
  ).wait();
  const payload2 = ethers.toUtf8Bytes('clpr-it0-solo-app2');
  const txHash2 = await sendPayloadFromApp(sourceApp2, payload2);
  console.log('App2 send tx:', txHash2);
  console.log('Queue count after app2 send:', (await queue.nextQueueMessageId()).toString());

  // 7) Read and assert final state.
  const app1ResponsePayload = ethers.toUtf8String(await sourceApp1.lastResponsePayload());
  const app2ResponsePayload = ethers.toUtf8String(await sourceApp2.lastResponsePayload());
  const app1ResponseCount = await sourceApp1.responseCount();
  const app2ResponseCount = await sourceApp2.responseCount();
  const queueMessageCount = await queue.nextQueueMessageId();

  if (app1ResponsePayload !== 'clpr-it0-solo-app1') {
    throw new Error(`App1 payload mismatch: ${app1ResponsePayload}`);
  }
  if (app2ResponsePayload !== 'clpr-it0-solo-app2') {
    throw new Error(`App2 payload mismatch: ${app2ResponsePayload}`);
  }
  if (app1ResponseCount !== 1n || app2ResponseCount !== 1n) {
    throw new Error(`Unexpected response counts: app1=${app1ResponseCount}, app2=${app2ResponseCount}`);
  }
  if (queueMessageCount !== 4n) {
    throw new Error(`Unexpected queue message count: ${queueMessageCount}`);
  }

  console.log('Queue message count:', queueMessageCount.toString());
  console.log('App1 response count:', app1ResponseCount.toString());
  console.log('App2 response count:', app2ResponseCount.toString());
  console.log('App1 last response payload:', app1ResponsePayload);
  console.log('App2 last response payload:', app2ResponsePayload);
  console.log('App1 last response app message id:', (await sourceApp1.lastResponseAppMessageId()).toString());
  console.log('App2 last response app message id:', (await sourceApp2.lastResponseAppMessageId()).toString());
  console.log('Multi-source SOLO smoke: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
