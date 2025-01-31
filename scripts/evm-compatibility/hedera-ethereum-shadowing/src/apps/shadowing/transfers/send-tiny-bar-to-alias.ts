import {
	AccountId,
	Client,
	Hbar,
	TransactionId,
	TransferTransaction,
} from '@hashgraph/sdk';
import { writeLogFile } from '@/utils/helpers/write-log-file';
import { resetHederaLocalNode } from '@/utils/helpers/reset-hedera-local-node';
export async function sendTinyBarToAlias(
	accountId: AccountId,
	evmAddress: string,
	amountHBar: number,
	client: Client,
	currentBlock: number,
	nodeAccountId: AccountId
) {
	try {
		console.log(`Running tinybar transaction ${accountId}, ${evmAddress}`);
		const transactionId = TransactionId.generate(accountId);
		const transaction = new TransferTransaction()
			.addHbarTransfer(accountId, Hbar.fromTinybars(amountHBar).negated())
			.addHbarTransfer(evmAddress, Hbar.fromTinybars(amountHBar))
			.setTransactionId(transactionId)
			.setNodeAccountIds([nodeAccountId])
			.freeze();

		// Execute the transaction
		await new Promise((resolve) => setTimeout(resolve, 1));
		await transaction.execute(client);
	} catch (error: any) {
		if (error && error.status === 'DUPLICATE_TRANSACTION') {
			console.error('Error sending tinyBar to alias:', error);
			writeLogFile(
				`logs/send-tiny-bar-to-alias-error`,
				`I am rerunning transaction. Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`,
				true,
				'txt'
			);
			await sendTinyBarToAlias(
				accountId,
				evmAddress,
				amountHBar,
				client,
				currentBlock,
				nodeAccountId
			);
		}

		if (
			error &&
			typeof error.message === 'string' &&
			error.message.includes('PLATFORM_NOT_ACTIVE')
		) {
			writeLogFile(
				`logs/send-tiny-bar-to-alias-error`,
				`Found error in block ${currentBlock} PLATFORM_TRANSACTION_NOT_CREATED ERROR  \n ${error} \n`,
				true,
				'txt'
			);
			await resetHederaLocalNode();
			await sendTinyBarToAlias(
				accountId,
				evmAddress,
				amountHBar,
				client,
				currentBlock,
				nodeAccountId
			);
		} else if (
			error &&
			typeof error.message === 'string' &&
			// TODO Currenty we have platform transaction not created error when we are executing contract transaction on later blocks from 1879240 and later "https://sepolia.etherscan.io/tx/0xd8637b677add1f4a3735259bc1cae4015be7d829e0375b54d217f1d3af6cdcc5"
			error.message.includes('PLATFORM_TRANSACTION_NOT_CREATED')
		) {
			writeLogFile(
				`logs/send-tiny-bar-to-alias-error`,
				`Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`,
				true,
				'txt'
			);
			await resetHederaLocalNode();
		}

		console.error('Error sending tinyBar to alias:', error);
		writeLogFile(
			`logs/send-tiny-bar-to-alias-error`,
			`Found error in block ${currentBlock} Transaction Type: TransferTransaction \n ${error} \n`,
			true,
			'txt'
		);
	}
}
