// SPDX-License-Identifier: Apache-2.0

// hardhat-ethers resolves a sent transaction by polling eth_getTransactionByHash from a promise
// that has no error handling: a single failed or stalled poll (relay/HTTP hiccup) is an unhandled
// rejection, which Mocha swallows, so polling stops and the test hangs until its timeout even
// though the transaction executed. Retry failed polls instead and report "not found yet" (null)
// when they keep failing, so hardhat-ethers simply polls again.
const {
  HardhatEthersProvider,
} = require('@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider');

const POLL_TIMEOUT_MS = 30_000;
const POLL_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`no response in ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const getTransaction = HardhatEthersProvider.prototype.getTransaction;

HardhatEthersProvider.prototype.getTransaction = async function (hash) {
  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt++) {
    try {
      return await withTimeout(getTransaction.call(this, hash), POLL_TIMEOUT_MS);
    } catch (e) {
      console.warn(`eth_getTransactionByHash(${hash}) attempt ${attempt} failed: ${e.message}`);
      await sleep(RETRY_DELAY_MS);
    }
  }
  return null;
};
