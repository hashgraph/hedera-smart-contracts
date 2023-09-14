require('dotenv').config();

function delay() {
    return new Promise(resolve => setTimeout(resolve, process.env.RETRY_DELAY || 2000));
}

// Transaction needs to be propagated to the mirror node
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
  


module.exports = {
    delay,
    pauseAndPoll,
    unPauseAndPoll
}