import { getRawTransaction } from '@/api/erigon/get-raw-transaction';
import { sendRawTransaction } from '@/api/hedera/send-raw-transaction';
import { sendHbarToAlias } from '@/apps/shadowing/transfers/send-hbar-to-alias';
import { AccountId, Client } from '@hashgraph/sdk';

// This function create a transaction and send the rawBody to the erigon eth_sendRawTransaction endpoint. Should return gas minimum price error
export async function transactionNoGas(
	accountId: AccountId,
	client: Client,
	nodeAccountId: AccountId
) {
	const rawBody = await getRawTransaction(
		'0xa02a056a0899d63073f82e7f6ca75cf36f3a6582b940f4e801bb049b634072a8'
	);
	await sendHbarToAlias(
		accountId,
		'0x731B8DbC498d3db06a64037DDeA7685490Af4ee5',
		20,
		client,
		0,
		nodeAccountId
	);
	const response = await sendRawTransaction(rawBody);
	console.log(response.error.message);
}
