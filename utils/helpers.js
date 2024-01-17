/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
require('dotenv').config();
const Constants = require('../test/constants');

const delay = (ms) => {
  return new Promise((resolve) =>
    setTimeout(resolve, ms || process.env.RETRY_DELAY || 2000)
  );
};

const getBalance = async (erc20Contract, tokenAddress, signersAddress) => {
  const balance = await erc20Contract.balanceOf(tokenAddress, signersAddress);
  return balance;
};

/**
 * @param {*} proxyContract
 * @returns counter  - the count value on the proxyContract
 */
const getCount = async (proxyContract) => {
  const counter = await proxyContract.count();
  return counter;
};

const getSignerBalance = async (provider, signersAddress) => {
  const balance = await provider.getBalance(signersAddress);
  return balance;
};

// Transaction needs to be propagated to the mirror node
const pauseAndPoll = async (ERC20Pausable) => {
  await ERC20Pausable.pause();

  for (
    let numberOfTries = 0;
    numberOfTries <= process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const isPaused = await ERC20Pausable.paused();

    if (isPaused) {
      return true; // Paused
    }

    await delay(); // Delay before the next attempt
  }

  return false; // Not paused
};

const pollForLastEvent = async (contract) => {
  for (
    let numberOfTries = 0;
    numberOfTries <= process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const event = contract.logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args[0];
    if (event._hex !== undefined && event._hex !== null) {
      return parseInt(event._hex);
    }
  }

  throw new Error(
    `Failed to get an event after ${process.env.MAX_RETRY} tries`
  );
};

const pollForERC20BurnableChangedSupply = async (
  ERC20Burnable,
  initialSupply
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const newSupply = await ERC20Burnable.totalSupply();

    if (newSupply !== initialSupply) {
      return newSupply; // Supply changed and not zero
    }

    await delay(); // Delay before the next attempt
  }

  throw new Error(
    `Failed to get a different supply value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewCounterValue = async (proxyContract, counterBefore) => {
  let counterAfter,
    numberOfTries = 0;

  while (numberOfTries < process.env.MAX_RETRY) {
    counterAfter = await proxyContract.count();

    if (counterAfter !== counterBefore) {
      return counterAfter;
    }

    numberOfTries++;
    await delay(); // Delay before the next attempt
  }

  throw new Error(
    `proxyContract.count failed to get a different value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewERC721Owner = async (erc721Contract, tokenId, ownerBefore) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const ownerAfter = await erc721Contract.ownerOf(tokenId);

    if (ownerAfter !== ownerBefore) {
      return ownerAfter; // Ownership changed
    }

    await delay();
  }

  throw new Error(
    `Ownership did not change after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewERC721Balance = async (
  erc721Contract,
  nftTokenAddress,
  signersAddress,
  balanceBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const balanceAfter = await erc721Contract.balanceOf(
      nftTokenAddress,
      signersAddress
    );

    if (balanceAfter !== balanceBefore) {
      return balanceAfter; // Balance changed
    }

    await delay(); // Delay before the next attempt
  }

  throw new Error(
    `erc721Contract.balanceOf failed to get a different value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewERC721HollowWalletOwner = async (
  erc721Contract,
  nftTokenAddress,
  ownerBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress);

    if (ownerAfter !== ownerBefore) {
      return ownerAfter; // Ownership changed
    }

    await delay();
  }

  throw new Error(
    `Ownership did not change after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewWalletBalance = async (
  erc20Contract,
  tokenAddress,
  signersAddress,
  balanceBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const balanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signersAddress
    );

    if (balanceAfter !== 0 && balanceAfter !== balanceBefore) {
      return balanceAfter; // Balance changed and not zero
    }

    await delay(); // Delay before the next attempt
  }

  throw new Error(
    `Failed to get a different balance value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewHollowWalletBalance = async (
  provider,
  walletAddress,
  balanceBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const balanceAfter = await provider.getBalance(walletAddress);

    if (balanceAfter !== balanceBefore) {
      return balanceAfter; // Balance changed
    }

    await delay();
  }

  throw new Error(
    `Failed to get a different balance value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewBalance = async (
  IERC20,
  contractAddress,
  tokenCreateBalanceBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const balanceAfter = await IERC20.balanceOf(contractAddress);

    if (balanceAfter !== 0 && balanceAfter !== tokenCreateBalanceBefore) {
      return balanceAfter; // Balance changed and not null
    }

    await delay(); // Delay before the next attempt
  }
  console.log('----');

  throw new Error(
    `Failed to get a different balance value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewERC20Balance = async (
  erc20Contract,
  tokenAddress,
  signersAddress,
  balanceBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    try {
      const balanceAfter = await getBalance(
        erc20Contract,
        tokenAddress,
        signersAddress
      );
      if (balanceAfter !== balanceBefore) {
        return balanceAfter;
      }
    } catch (error) {
      // Handle errors from erc20Contract.balanceOf
      console.error(`Error fetching balance: ${error.message}`);
    }

    await delay();
  }

  throw new Error(
    `Failed to get a different value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewHBarBalance = async (
  provider,
  signers0BeforeHbarBalance,
  signer1AccountID
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const signers0AfterHbarBalance = await provider.getBalance(
      signer1AccountID
    );

    if (signers0AfterHbarBalance !== signers0BeforeHbarBalance) {
      return signers0AfterHbarBalance;
    }

    await delay();
  }

  throw new Error(
    `Failed to get a different balance after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewSignerBalance = async (
  IERC20Contract,
  signersAddress,
  signerBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const signerAfter = await IERC20Contract.balanceOf(signersAddress);

    if (signerAfter !== signerBefore) {
      return signerAfter; // Balance changed and not null
    }

    await delay(); // Delay before the next attempt
  }

  throw new Error(
    `Failed to get a different balance value after ${process.env.MAX_RETRY} tries`
  );
};

const pollForNewSignerBalanceUsingProvider = async (
  provider,
  signersAddress,
  signerBefore
) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    try {
      const signerAfter = await getSignerBalance(provider, signersAddress);
      if (signerAfter !== signerBefore) {
        return signerAfter;
      }
    } catch (error) {
      // Handle errors from provider.getBalance
      console.error(`Error fetching signer balance: ${error.message}`);
    }

    await delay();
  }

  throw new Error(
    `Failed to get a different value after ${process.env.MAX_RETRY} tries`
  );
};

const unPauseAndPoll = async (ERC20Pausable) => {
  await ERC20Pausable.unpause();

  for (
    let numberOfTries = 0;
    process.env.MAX_RETRY <= process.env.MAX_RETRY;
    numberOfTries++
  ) {
    const isPaused = await ERC20Pausable.paused();

    if (!isPaused) {
      return true; // Unpaused
    }

    await delay(); // Delay before the next attempt
  }

  return false; // paused
};

const genericPoll = async (toPollFromPromise, comparator, ms, forOperation) => {
  for (
    let numberOfTries = 0;
    numberOfTries < process.env.MAX_RETRY;
    numberOfTries++
  ) {
    try {
      let pollResult = await toPollFromPromise;
      if (pollResult.wait) {
        pollResult = await pollResult.wait();
      }
      const comparatorResult = comparator(pollResult);
      if (comparatorResult) {
        return pollResult;
      }
    } catch (error) {
      throw error;
    }

    await delay(ms);
  }

  throw new Error(`Failed to get a different value after ${process.env.MAX_RETRY} tries.
    For: 
    ${forOperation}
  `);
};

module.exports = {
  delay,
  pauseAndPoll,
  pollForNewERC20Balance,
  pollForERC20BurnableChangedSupply,
  pollForLastEvent,
  pollForNewBalance,
  pollForNewCounterValue,
  pollForNewHBarBalance,
  pollForNewSignerBalanceUsingProvider,
  pollForNewERC721Balance,
  pollForNewERC721Owner,
  pollForNewHollowWalletBalance,
  pollForNewERC721HollowWalletOwner,
  pollForNewSignerBalance,
  pollForNewWalletBalance,
  unPauseAndPoll,
  genericPoll,
};
