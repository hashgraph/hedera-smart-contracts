import { getRawTransaction } from '@/api/erigon/get-raw-transaction';
import { sendHbarToAlias } from '@/apps/shadowing/transfers/send-hbar-to-alias';
import {
	AccountId,
	Client,
	EthereumTransaction,
	Hbar,
	PrivateKey,
	TransactionId,
} from '@hashgraph/sdk';

//This function should add a new ethereum transaction but on the hedera exploler should display WRONG_CHAIN_ID
export async function sendTransactionAsEthereum(
	transactionData: {
		txHash: string;
		evmAddress: string;
		gas: number;
		hbar: number;
	},
	accountId: AccountId,
	client: Client,
	ppkey: string
) {
	const rawBody = await getRawTransaction(transactionData.txHash);
	await sendHbarToAlias(accountId, transactionData.evmAddress, transactionData.hbar, client, 0, new AccountId(3));
	const txId = TransactionId.generate(accountId)

	const transaction = await new EthereumTransaction()
		.setTransactionId(txId)
		.setEthereumData(Uint8Array.from(Buffer.from(rawBody.substring(2), 'hex')))
		.setMaxGasAllowanceHbar(new Hbar(transactionData.gas))
		.freezeWith(client)
		.sign(PrivateKey.fromString(String(ppkey)));

	const txResponse = await transaction.execute(client);

    console.log('SUCCESS:', txResponse.toJSON())
}
