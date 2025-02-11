import { getTransactionReceipt } from "@/api/erigon/get-transaction-receipt";
import { ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { getBlockByHashErigon } from "@/api/erigon/get-block-by-hash";

export async function calculateBlockReward(block: any) {
    try {
      const blockNumber = parseInt(block.number);
      const transactions = block.transactions;
      const baseFeePerGas = block.baseFeePerGas;
      const gasUsed = block.gasUsed;

      let minerTips = [];
      let sumMinerTips = 0;
      for (const tx of transactions) {
          const transactionReceipt = await getTransactionReceipt(tx.hash);
          const txGasUseage = transactionReceipt.gasUsed;
          const totalFee = ethers.formatEther(
              BigNumber.from(txGasUseage).mul(tx.gasPrice).toString()
          );
          minerTips.push(Number(totalFee));
      }
      if (transactions.length > 0) {
        sumMinerTips = minerTips.reduce(
          (prevTip, currentTip) => prevTip + currentTip
        );
      }
    
      const burnedFee = ethers.formatEther(
        BigNumber.from(gasUsed).mul(baseFeePerGas).toString()
      );
    
      const baseBlockReward = 2;
      const nephewReward = baseBlockReward / 32;
      const uncleCount = block.uncles.length;
      const totalNephewReward = uncleCount * nephewReward;
  
      let uncleRewardsArr = [];
      for (const hash of block.uncles) {
        const uncle = await getBlockByHashErigon(hash);
        const uncleNum = parseInt(uncle.number);
        const uncleMiner = uncle.miner;
        const uncleReward = ((uncleNum + 8 - blockNumber) * baseBlockReward) / 8;
        uncleRewardsArr.push({
          reward: `${uncleReward}ETH`,
          miner: uncleMiner,
        });
      }
  
      const blockReward = baseBlockReward + (sumMinerTips - Number(burnedFee));
  
      if (uncleCount > 0) {
        console.log("Block reward:", blockReward + totalNephewReward + "ETH");
        console.log("miner:", block.miner);
        console.log("Uncle rewards:");
        console.log(uncleRewardsArr);
      } else {
        console.log("Block reward:", blockReward + "ETH");
        console.log("miner:", block.miner);
      }
    } catch (error) {
        console.log(error);
    }
}
