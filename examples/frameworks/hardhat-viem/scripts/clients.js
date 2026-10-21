// SPDX-License-Identifier: Apache-2.0

const hre = require('hardhat');
const { defineChain } = require('viem');

// viem ships chains for Hedera mainnet/testnet/previewnet (295-297) but none for a
// local network (chain id 298), so define it for the `local` Hardhat network.
const hederaLocal = defineChain({
  id: 298,
  name: 'Hedera Local',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: { default: { http: [process.env.LOCAL_NODE_ENDPOINT || 'http://127.0.0.1:7546'] } },
});

// Public and wallet clients for the selected network, usable as `{ client }` in hre.viem helpers.
module.exports = async () => {
  const config = hre.network.name === 'local' ? { chain: hederaLocal } : undefined;
  const publicClient = await hre.viem.getPublicClient(config);
  const [walletClient] = await hre.viem.getWalletClients(config);

  return { publicClient, walletClient, client: { public: publicClient, wallet: walletClient } };
};
