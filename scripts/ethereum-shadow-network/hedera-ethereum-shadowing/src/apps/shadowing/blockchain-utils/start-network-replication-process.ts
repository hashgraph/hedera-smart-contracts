import { Genesis } from '@/utils/types';
import { getLastBlockNumber } from '@/api/erigon/get-last-block-number';
import { convertHexIntoDecimal } from '@/utils/helpers/convert-hex-into-decimal';
import { getTransactionByBlock } from '@/apps/shadowing/ethereum/get-transaction-by-block';
import { sendHbarToAlias } from '@/apps/shadowing/transfers/send-hbar-to-alias';
import { AccountId, Client } from '@hashgraph/sdk';

export async function startNetworkReplicationProcess(
	accountId: AccountId,
	genesisTransactions: Genesis[],
	client: Client,
	nodeAccountId: AccountId
) {
	// Create all accounts from the genesis block
	for (const transaction of genesisTransactions) {
		console.log('iterateThoughGenesisTransactions', transaction);

		await sendHbarToAlias(
			accountId,
			transaction.toAccount,
			transaction.amount,
			client,
			0,
			nodeAccountId
		);
	}

	// Get last block number from Erigon with RPC API call to with eth_getBlockNumber
	const lastBlockNumber = await getLastBlockNumber();
	// Convert hex value of lastBlockNumber to decimal values that we use later on
	const convertedBlockNumber = convertHexIntoDecimal(lastBlockNumber);

	// Iterate for all blocks in current net from start to end.
	await getTransactionByBlock(
		1,
		convertedBlockNumber,
		accountId,
		client,
		nodeAccountId
	);
}
