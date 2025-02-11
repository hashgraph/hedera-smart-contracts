import { getBlockByNumber } from '@/api/erigon/get-block-by-number';
import { getAccountBalance } from '@/api/erigon/get-account-balance';
import { convertIntoPrevBlockNumber } from '@/utils/helpers/convert-into-prev-block-number';
import { getUncleByBlockNumberAndIndex } from '@/api/erigon/get-uncle-by-block-number-and-index';

export interface Miner {
	id: string;
	balanceBefore: string;
	balanceAfter: string;
}

export async function getMinerAndUnclesBalance(
	blockNumber: string
): Promise<Miner[]> {
	// get block information with rpc api call to erigon, miner and uncles information are present there
	const result = await getBlockByNumber(blockNumber);
	const prevBlockNumber = convertIntoPrevBlockNumber(blockNumber);
	const miners = [];
	const minersWithBalance: Miner[] = [];

	if (result.miner) {
		const miner = result.miner;
		miners.push(miner);

		// there can be multiple uncles blocks, "uncles" field contains blocks hashes and we need to iterate trough them and find miners for them
		if (result.uncles && result.uncles.length > 0) {
			const uncles = result.uncles;
			for (let i = 0; i < uncles.length; i++) {
				const uncleResult = await getUncleByBlockNumberAndIndex(
					blockNumber,
					i.toString(16)
				);
				if (
					uncleResult &&
					uncleResult.miner &&
					!miners.includes(uncleResult.miner)
				) {
					miners.push(uncleResult.miner);
				}
			}
		}

		for (const minerForBalance of miners) {
			// get miner account balance in previous block
			const minerBalanceBefore = await getAccountBalance(
				minerForBalance,
				prevBlockNumber
			);
			// get miner account balance in current block
			const minerBalanceAfter = await getAccountBalance(
				minerForBalance,
				blockNumber
			);
			// put it in the minersWithBalance array
			minersWithBalance.push({
				id: minerForBalance,
				balanceBefore: minerBalanceBefore,
				balanceAfter: minerBalanceAfter,
			});
		}
	}
	return minersWithBalance;
}
