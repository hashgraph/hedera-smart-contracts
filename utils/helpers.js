require('dotenv').config();

function delay() {
    return new Promise(resolve => setTimeout(resolve, process.env.RETRY_DELAY || 2000));
}

async function getBalance(erc20Contract, tokenAddress, signersAddress) {
    const balance = await erc20Contract.balanceOf(tokenAddress, signersAddress);
    return balance;
}

async function getCount(proxyContract) {
    const counter = await proxyContract.count();
    return counter;
}

async function getSignerBalance(provider, signersAddress) {
    const balance = await provider.getBalance(signersAddress);
    return balance;
}

// Transaction needs to be propagated to the mirror node
async function pauseAndPoll(ERC20Pausable) {
  
    await ERC20Pausable.pause();
  
    for (let numberOfTries = 0; numberOfTries <= process.env.MAX_RETRY; numberOfTries++) {
      const isPaused = await ERC20Pausable.paused();
      
      if (isPaused) {
        return true; // Paused
      }
  
      await delay(); // Delay before the next attempt
    }
  
    return false; // Not paused
}

async function pollForERC20BurnableChangedSupply(ERC20Burnable, initialSupply) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const newSupply = await ERC20Burnable.totalSupply();
  
      if (!newSupply.eq(initialSupply)) {
        return newSupply; // Supply changed and not zero
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different supply value after ${timesToTry} tries`);
}

async function pollForNewCounterValue(proxyContract, counterBefore) {
    let counterAfter, numberOfTries = 0;
  
    while (numberOfTries < process.env.MAX_RETRY) {
        counterAfter = await proxyContract.count();
  
  
      if (!counterAfter.eq(counterBefore)) {
        return counterAfter;
      }
  
      numberOfTries++;
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`proxyContract.count failed to get a different value after ${timesToTry} tries`);
  }

async function pollForNewERC721Owner(erc721Contract, tokenId, ownerBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const ownerAfter = await erc721Contract.ownerOf(tokenId);
  
      if (ownerAfter !== ownerBefore) {
        return ownerAfter; // Ownership changed
      }
  
      delay();
    }
  
    throw new Error(`Ownership did not change after ${timesToTry} tries`);
}

async function pollForNewERC721Balance(erc721Contract, nftTokenAddress, signersAddress, balanceBefore) {
    
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const balanceAfter = await erc721Contract.balanceOf(nftTokenAddress, signersAddress);
      
      if (!balanceAfter.eq(balanceBefore)) {
        return balanceAfter; // Balance changed
      }
    
      await delay(); // Delay before the next attempt  
    }
    
    throw new Error(`erc721Contract.balanceOf failed to get a different value after ${timesToTry} tries`);
}
  
async function pollForNewERC721HollowWalletOwner(erc721Contract, nftTokenAddress, ownerBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress);
  
      if (ownerAfter !== ownerBefore) {
        return ownerAfter; // Ownership changed
      }
  
      delay();
    }
  
    throw new Error(`Ownership did not change after ${timesToTry} tries`);
}
  
async function pollForNewWalletBalance(erc20Contract, tokenAddress, signersAddress, balanceBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const balanceAfter = await erc20Contract.balanceOf(tokenAddress, signersAddress);
  
      if (!balanceAfter.eq(0) && !balanceAfter.eq(balanceBefore)) {
        return balanceAfter; // Balance changed and not zero
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}
    
async function pollForNewHollowWalletBalance(provider, walletAddress, balanceBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const balanceAfter = await provider.getBalance(walletAddress);
  
      if (!balanceAfter.eq(balanceBefore)) {
        return balanceAfter; // Balance changed
      }
  
      delay();
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}

async function pollForNewBalance(IERC20, contractAddress, tokenCreateBalanceBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const balanceAfter = await IERC20.balanceOf(contractAddress);
  
      if (!balanceAfter.eq(tokenCreateBalanceBefore)) {
        return balanceAfter; // Balance changed and not null
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}

async function pollForNewERC20Balance(erc20Contract, tokenAddress, signersAddress, balanceBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      try {
        const balanceAfter = await getBalance(erc20Contract, tokenAddress, signersAddress);
        if (!balanceAfter.eq(balanceBefore)) {
          return balanceAfter;
        }
      } catch (error) {
        // Handle errors from erc20Contract.balanceOf
        console.error(`Error fetching balance: ${error.message}`);
      }
  
      await delay();
    }
  
    throw new Error(`Failed to get a different value after ${timesToTry} tries`);
}

async function pollForNewHBarBalance(provider, signers0BeforeHbarBalance, signer1AccountID) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const signers0AfterHbarBalance = await provider.getBalance(signer1AccountID);
  
      if (!signers0AfterHbarBalance.eq(signers0BeforeHbarBalance)) {
        return signers0AfterHbarBalance;
      }
  
      await delay();
    }
  
    throw new Error(`Failed to get a different balance after ${timesToTry} tries`);
}

async function pollForNewSignerBalance(IERC20Contract, signersAddress, signerBefore) {
    
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      const signerAfter = await IERC20Contract.balanceOf(signersAddress);
  
      if (!signerAfter.eq(signerBefore)) {
        return signerAfter; // Balance changed and not null
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}

async function pollForNewCounterValue(proxyContract, counterBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      try {
        const counterAfter = await getCount(proxyContract);
        if (!counterAfter.eq(counterBefore)) {
          return counterAfter;
        }
      } catch (error) {
        // Handle errors from proxyContract.count
        console.error(`Error fetching counter value: ${error.message}`);
      }
  
      await delay();
    }
  
    throw new Error(`Failed to get a different value after ${timesToTry} tries`);
}

async function pollForNewSignerBalanceUsingProvider(provider, signersAddress, signerBefore) {
  
    for (let numberOfTries = 0; numberOfTries < process.env.MAX_RETRY; numberOfTries++) {
      try {
        const signerAfter = await getSignerBalance(provider, signersAddress);
        if (signerAfter != signerBefore) {
          return signerAfter;
        }
      } catch (error) {
        // Handle errors from provider.getBalance
        console.error(`Error fetching signer balance: ${error.message}`);
      }
  
      await delay();
    }
  
    throw new Error(`Failed to get a different value after ${timesToTry} tries`);
}

async function unPauseAndPoll(ERC20Pausable) {
  
    await ERC20Pausable.unpause()
 
    for (let numberOfTries = 0; process.env.MAX_RETRY <= process.env.MAX_RETRY; numberOfTries++) {
        const isPaused = await ERC20Pausable.paused();
        
        if (!isPaused) {
          return true; // Unpaused
        }
    
        await delay(); // Delay before the next attempt
      }

    return false // paused
}
      
module.exports = {
    delay,
    pauseAndPoll,
    pollForNewERC20Balance,
    pollForERC20BurnableChangedSupply,
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
    unPauseAndPoll
}
