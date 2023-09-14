require('dotenv').config();

function delay() {
    return new Promise(resolve => setTimeout(resolve, process.env.RETRY_DELAY || 2000));
}

async function getBalance(erc20Contract, tokenAddress, signersAddress) {
    const balance = await erc20Contract.balanceOf(tokenAddress, signersAddress);
    return balance;
}

async function getSignerBalance(provider, signersAddress) {
    const balance = await provider.getBalance(signersAddress);
    return balance;
}

// Transaction needs to be propagated to the mirror node
async function pauseAndPoll(ERC20Pausable) {
    const timesToTry = 10;
  
    await ERC20Pausable.pause();
  
    for (let numberOfTries = 0; numberOfTries <= timesToTry; numberOfTries++) {
      const isPaused = await ERC20Pausable.paused();
      
      if (isPaused) {
        return true; // Paused
      }
  
      await delay(); // Delay before the next attempt
    }
  
    return false; // Not paused
}

async function pollForERC20BurnableChangedSupply(ERC20Burnable, initialSupply) {
    const timesToTry = 300;
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const newSupply = await ERC20Burnable.totalSupply();
  
      if ((newSupply != 0) && (newSupply != initialSupply)) {
        return newSupply; // Supply changed and not zero
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different supply value after ${timesToTry} tries`);
}

async function pollForNewERC721Owner(erc721Contract, tokenId, ownerBefore) {
    const timesToTry = 200;
    const delayDurationMs = 1000; // 1 second (adjust as needed)
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const ownerAfter = await erc721Contract.ownerOf(tokenId);
  
      if (ownerAfter !== ownerBefore) {
        return ownerAfter; // Ownership changed
      }
  
      delay();
    }
  
    throw new Error(`Ownership did not change after ${timesToTry} tries`);
}

async function pollForNewERC721Balance(erc721Contract, nftTokenAddress, signersAddress, balanceBefore) {
    const timesToTry = 200;
    const delayDurationMs = 1000; // 1 second (adjust as needed)
    
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const balanceAfter = await erc721Contract.balanceOf(nftTokenAddress, signersAddress);
      
      if (!balanceAfter.eq(balanceBefore)) {
        return balanceAfter; // Balance changed
      }
    
      await delay(); // Delay before the next attempt  
    }
    
    throw new Error(`erc721Contract.balanceOf failed to get a different value after ${timesToTry} tries`);
}
  
async function pollForNewERC721HollowWalletOwner(erc721Contract, nftTokenAddress, ownerBefore) {
    const timesToTry = 200;
    const delayDurationMs = 1000; // 1 second (adjust as needed)
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress);
  
      if (ownerAfter !== ownerBefore) {
        return ownerAfter; // Ownership changed
      }
  
      await new Promise(resolve => setTimeout(resolve, delayDurationMs));
    }
  
    throw new Error(`Ownership did not change after ${timesToTry} tries`);
}
  
async function pollForNewWalletBalance(erc20Contract, tokenAddress, signersAddress, balanceBefore) {
    const timesToTry = 200;
    const delayDurationMs = 1000; // 1 second (adjust as needed)
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const balanceAfter = await erc20Contract.balanceOf(tokenAddress, signersAddress);
  
      if (!balanceAfter.eq(0) && !balanceAfter.eq(balanceBefore)) {
        return balanceAfter; // Balance changed and not zero
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}
    
async function pollForNewHollowWalletBalance(provider, walletAddress, balanceBefore) {
    const timesToTry = 200;
    const delayDurationMs = 1000; // 1 second (adjust as needed)
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const balanceAfter = await provider.getBalance(walletAddress);
  
      if (!balanceAfter.eq(balanceBefore)) {
        return balanceAfter; // Balance changed
      }
  
      await new Promise(resolve => setTimeout(resolve, delayDurationMs));
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}

async function pollForNewBalance(IERC20, contractAddress, tokenCreateBalanceBefore) {
    const timesToTry = 200;
    const delayDurationMs = 1000; // 1 second (adjust as needed)
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const balanceAfter = await IERC20.balanceOf(contractAddress);
  
      if (balanceAfter !== null && balanceAfter !== tokenCreateBalanceBefore) {
        return balanceAfter; // Balance changed and not null
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}

async function pollForNewERC20Balance(erc20Contract, tokenAddress, signersAddress, balanceBefore) {
    const timesToTry = 200;
    const delayTimeMs = 1000; // Adjust the delay time as needed
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      try {
        const balanceAfter = await getBalance(erc20Contract, tokenAddress, signersAddress);
        if (!balanceAfter.eq(balanceBefore)) {
          return balanceAfter;
        }
      } catch (error) {
        // Handle errors from erc20Contract.balanceOf
        console.error(`Error fetching balance: ${error.message}`);
      }
  
      await delay(delayTimeMs);
    }
  
    throw new Error(`Failed to get a different value after ${timesToTry} tries`);
}

async function pollForNewSignerBalance(IERC20Contract, signersAddress, signerBefore) {
    const timesToTry = 200;
    
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      const signerAfter = await IERC20Contract.balanceOf(signersAddress);
  
      if (!signerAfter.eq(signerBefore)) {
        return signerAfter; // Balance changed and not null
      }
  
      await delay(); // Delay before the next attempt
    }
  
    throw new Error(`Failed to get a different balance value after ${timesToTry} tries`);
}

async function pollForNewSignerBalanceUsingProvider(provider, signersAddress, signerBefore) {
    const timesToTry = 400;
    const delayTimeMs = 1000; // Adjust the delay time as needed
  
    for (let numberOfTries = 0; numberOfTries < timesToTry; numberOfTries++) {
      try {
        const signerAfter = await getSignerBalance(provider, signersAddress);
        if (signerAfter !== signerBefore) {
          return signerAfter;
        }
      } catch (error) {
        // Handle errors from provider.getBalance
        console.error(`Error fetching signer balance: ${error.message}`);
      }
  
      await delay(delayTimeMs);
    }
  
    throw new Error(`Failed to get a different value after ${timesToTry} tries`);
}

async function unPauseAndPoll(ERC20Pausable) {
    const timesToTry = 10;
  
    await ERC20Pausable.unpause()
 
    for (let numberOfTries = 0; numberOfTries <= timesToTry; numberOfTries++) {
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
    pollForNewSignerBalanceUsingProvider,
    pollForNewERC721Balance,
    pollForNewERC721Owner,
    pollForNewHollowWalletBalance,
    pollForNewERC721HollowWalletOwner,
    pollForNewSignerBalance,
    pollForNewWalletBalance,
    unPauseAndPoll
}
