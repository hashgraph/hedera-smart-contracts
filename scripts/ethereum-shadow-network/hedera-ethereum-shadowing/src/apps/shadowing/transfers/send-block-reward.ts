import { AccountId, Client } from '@hashgraph/sdk';
import { getMinerAndUnclesBalance } from '@/apps/shadowing/ethereum/balances/get-miner-and-uncles-balance';
import { ethers } from 'ethers';
import { sendTinyBarToAlias } from '@/apps/shadowing/transfers/send-tiny-bar-to-alias';
import { calculateFee } from '@/utils/helpers/calculate-fee';
import { BigNumber } from '@ethersproject/bignumber';
import { convertHexIntoDecimal } from '@/utils/helpers/convert-hex-into-decimal';

export async function sendBlockReward(
	accountId: AccountId,
	client: Client,
	currentBlock: string,
	transactions: any[],
	nodeAccountId: AccountId
) {
	const convertedCurrentBlock = convertHexIntoDecimal(currentBlock);
	// function for acquiring miners and uncles balance for current block, go to the function for more details on implementation
	// more about uncle blocks can be found here https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/mining/#ommer-blocks
	const miners = await getMinerAndUnclesBalance(currentBlock);

	// miners contain balance of miners accounts in previous and current block
	// we need to implement here proper block reward with this simple solution
	// firsly we count the difference between current block and previous block
	// then we check transaction from current block
	// if there were transactions that were sent to miner account we subtract the amount of transfered ETH from the difference
	// also if there were transactions that were sent from miner account we add the amount of transfered ETH from the difference
	// the result will be block reward for all the miners and uncles
	for (const miner of miners) {
		if (miner.id && miner.balanceBefore && miner.balanceAfter) {
			let minerBalanceDifference = BigNumber.from(0);
			const minerBlockReward = BigNumber.from(String(miner.balanceAfter)).sub(
				String(miner.balanceBefore)
			);
			for (const transaction of transactions) {
				if (transaction.to === miner.id) {
					console.log(
						`Miner "TO" found in transaction ${transaction.hash} for account ${miner.id}`
					);
					console.log(
						`Removing ${BigNumber.from(String(transaction.value)).toString()} from the miner account balance`
					);
					console.log('amount', transaction.value);
					minerBalanceDifference = minerBalanceDifference.sub(
						BigNumber.from(String(transaction.value))
					);
				}

				if (transaction.from === miner.id) {
					console.log(
						`Miner "FROM" found in transaction ${transaction.hash} for account ${miner.id}`
					);
					console.log(
						`Adding money ${transaction.value} to the minter balance`
					);
					console.log(
						'amount',
						BigNumber.from(String(transaction.value)).toString()
					);

					const fee = calculateFee(transaction.gas, transaction.gasPrice);
					minerBalanceDifference = BigNumber.from(
						String(transaction.value)
					).add(BigNumber.from(String(fee)));
				}
			}
			const minerRewardPriceWei = minerBlockReward.add(
				BigNumber.from(minerBalanceDifference)
			);
			const minerRewardEth = ethers.formatEther(minerRewardPriceWei.toString());

			const minerRewardTinyBar = Math.floor(Number(minerRewardEth) * 10 ** 8);

			console.log(
				`sending to miner ${miner.id} money reward: ${minerRewardEth}`
			);

			await sendTinyBarToAlias(
				accountId,
				miner.id,
				minerRewardTinyBar,
				client,
				convertedCurrentBlock,
				nodeAccountId
			);
		}
	}
}
