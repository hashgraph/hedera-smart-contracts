import {
	AccountId,
	Client,
	Hbar,
	TransactionId,
	TransferTransaction,
} from '@hashgraph/sdk';
import { writeLogFile } from '@/utils/helpers/write-log-file';
import { resetHederaLocalNode } from '@/utils/helpers/reset-hedera-local-node';

// Creates a hedera account using TransferTransaction function. More info here
// https://docs.hedera.com/hedera/getting-started/transfer-hbar
export async function sendHbarToAlias(
	accountId: AccountId,
	evmAddress: string,
	amountHBar: number | Hbar,
	client: Client,
	currentBlock: number,
	nodeAccountId: AccountId
) {
	try {
		console.log(`Running transaction ${accountId}, ${evmAddress}`);
		const transactionId = TransactionId.generate(accountId);
		const transaction = new TransferTransaction()
			.addHbarTransfer(accountId, new Hbar(amountHBar).negated())
			.addHbarTransfer(evmAddress, new Hbar(amountHBar))
			.setTransactionId(transactionId)
			.setNodeAccountIds([nodeAccountId])
			.freeze();

		// Execute the transaction
		await new Promise((resolve) => setTimeout(resolve, 1));
		await transaction.execute(client);
	} catch (error: any) {
		if (error.status && error.status === 'DUPLICATE_TRANSACTION') {
			writeLogFile(
				`logs/send-tiny-bar-to-alias-error`,
				`GOT INSIDE DUPLICATE TRANSACTION`,
				true,
				'txt'
			);
			console.error('Error sending tinyBar to alias:', error);
			writeLogFile(
				`logs/send-tiny-bar-to-alias-error`,
				`I am rerunning transaction. Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${JSON.stringify(error)} \n`,
				true,
				'txt'
			);

			await sendHbarToAlias(
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
			console.log('PLATFORM NOT ACTIVE ERROR INSIDE');
			writeLogFile(
				`logs/send-tiny-bar-to-alias-error`,
				`Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`,
				true,
				'txt'
			);
			await resetHederaLocalNode();
			await sendHbarToAlias(
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
				`Found error in block ${currentBlock} PLATFORM_TRANSACTION_NOT_CREATED ERROR  \n ${error} \n`,
				true,
				'txt'
			);
			await resetHederaLocalNode();
		}

		console.error('Error sending tinyBar to alias:', error);
		writeLogFile(
			`logs/send-tiny-bar-to-alias-error`,
			`Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`,
			true,
			'txt'
		);
	}
}
