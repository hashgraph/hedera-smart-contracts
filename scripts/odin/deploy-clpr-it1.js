// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function main() {
  const outputFile = process.env.ODIN_OUTPUT_FILE
    ? path.resolve(process.env.ODIN_OUTPUT_FILE)
    : path.join(process.cwd(), 'test/odin/clpr/it1/runtime/deployment.properties');

  const [deployer] = await ethers.getSigners();
  console.log(`ODIN_DEPLOY_DEPLOYER=${deployer.address}`);

  const Queue = await ethers.getContractFactory('MockClprQueue');
  const queue = await Queue.deploy();
  await queue.waitForDeployment();

  const Middleware = await ethers.getContractFactory('ClprMiddleware');
  const sourceMiddleware = await Middleware.deploy(await queue.getAddress());
  await sourceMiddleware.waitForDeployment();

  const destinationMiddleware = await Middleware.deploy(await queue.getAddress());
  await destinationMiddleware.waitForDeployment();

  await (
    await queue.configureEndpoints(
      await sourceMiddleware.getAddress(),
      await destinationMiddleware.getAddress()
    )
  ).wait();

  const Connector = await ethers.getContractFactory('MockClprConnector');
  const sourceConnector = await Connector.deploy();
  await sourceConnector.waitForDeployment();

  const destinationConnector = await Connector.deploy();
  await destinationConnector.waitForDeployment();

  await (
    await sourceMiddleware.configureConnectorPair(
      await sourceConnector.getAddress(),
      await destinationConnector.getAddress()
    )
  ).wait();

  const EchoApp = await ethers.getContractFactory('EchoApplication');
  const echoApp = await EchoApp.deploy(await destinationMiddleware.getAddress());
  await echoApp.waitForDeployment();

  const SourceApp = await ethers.getContractFactory('SourceApplication');
  const sourceApp1 = await SourceApp.deploy(
    await sourceMiddleware.getAddress(),
    await echoApp.getAddress(),
    await sourceConnector.getAddress()
  );
  await sourceApp1.waitForDeployment();

  const sourceApp2 = await SourceApp.deploy(
    await sourceMiddleware.getAddress(),
    await echoApp.getAddress(),
    await sourceConnector.getAddress()
  );
  await sourceApp2.waitForDeployment();

  await (await sourceMiddleware.registerLocalApplication(await sourceApp1.getAddress())).wait();
  await (await sourceMiddleware.registerLocalApplication(await sourceApp2.getAddress())).wait();
  await (await destinationMiddleware.registerLocalApplication(await echoApp.getAddress())).wait();

  const deployment = {
    'queue.address': await queue.getAddress(),
    'sourceMiddleware.address': await sourceMiddleware.getAddress(),
    'destinationMiddleware.address': await destinationMiddleware.getAddress(),
    'sourceConnector.address': await sourceConnector.getAddress(),
    'destinationConnector.address': await destinationConnector.getAddress(),
    'sourceApp1.address': await sourceApp1.getAddress(),
    'sourceApp2.address': await sourceApp2.getAddress(),
    'echoApp.address': await echoApp.getAddress(),
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  const body = Object.entries(deployment)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
    .concat('\n');
  fs.writeFileSync(outputFile, body, 'utf8');

  console.log(`ODIN_DEPLOY_OUTPUT=${outputFile}`);
  Object.entries(deployment).forEach(([k, v]) => {
    console.log(`ODIN_DEPLOY_${k.replace(/\./g, '_').toUpperCase()}=${v}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
