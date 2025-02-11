import { getBlockByNumber } from "@/api/erigon/get-block-by-number";
import { sendHbarToAlias } from "@/apps/shadowing/transfers/send-hbar-to-alias";
import {
	AccountId,
	Client
} from '@hashgraph/sdk';
import { getMinersForBlock } from "@/apps/shadowing/ethereum/get-miners-for-block";

export async function findAndSendBlockReward(accountId: AccountId, client: Client, blockNumber: number) {
	let result = await getBlockByNumber(
		blockNumber.toString(16)
	);
	const miners = await getMinersForBlock(result);
	console.log("MINERS: ", miners);
	for (const miner of miners) {
		await sendHbarToAlias(accountId, miner, 6, client);
	}
}
