// SPDX-License-Identifier: Apache-2.0

const hre = require('hardhat');
const getClients = require('./clients');

module.exports = async () => {
  //Deploy contract providing
  //name of contract as first parameter
  //array with constructor parameters from our contract as the second one
  //We use wait to receive the transaction (deployment) receipt, which contains contractAddress
  const { client } = await getClients();
  const greeter = await hre.viem.deployContract('Greeter', ['initial_msg'], { client });

  console.log(`Greeter deployed to: ${greeter.address}`);

  return greeter.address;
};
