// SPDX-License-Identifier: Apache-2.0

const getClients = require('./clients');

module.exports = async () => {
  const { publicClient, walletClient } = await getClients();
  const balance = await publicClient.getBalance({
    address: walletClient.account.address,
  });
  console.log(`The address ${walletClient.account.address} has ${balance} weibars`);

  return balance;
};
