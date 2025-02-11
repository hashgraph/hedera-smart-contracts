import { getRawTransaction } from '@/api/erigon/get-raw-transaction';
import {
	AccountId,
	Client,
	EthereumTransaction,
	Hbar,
	PrivateKey,
	TransactionId,
} from '@hashgraph/sdk';
import dotenv from 'dotenv';
import { writeLogFile } from '@/utils/helpers/write-log-file';
import { sendTransactionInfoToReceiptApi } from '@/api/receipt/transaction-sender';
import { resetHederaLocalNode } from '@/utils/helpers/reset-hedera-local-node';
import { TransactionData } from '@/utils/types';
dotenv.config();

const OPERATOR_PRIVATE = process.env.OPERATOR_PRIVATE;

// Create a hedera transaction using a raw transaction Data from Erigon api. More info here
// All the logs that are created here can be found in logs/ directory
// https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/ethereum-transaction
export async function createEthereumTransaction(
	transactionData: TransactionData,
	accountId: AccountId,
	client: Client,
	nodeAccountId: AccountId,
	accountTo: string,
	currentBlock: number
): Promise<any> {
	try {
		// RPC API call to Erigon to get raw transaction body we will user later on. 
		// See for more information about this method https://docs.chainstack.com/reference/base-getrawtransactionbyhash
		const rawBody = await getRawTransaction(transactionData.txHash);
		const txId = TransactionId.generate(accountId);
		// https://docs.hedera.com/hedera/sdks-and-apis/sdks/smart-contracts/ethereum-transaction
		// We construct the EtheruemTransaction with raw transaction body that we got above
		// The transaction ID that we generated above is passed because we received many DUPLICATE_TRANSACTION errors when this was generated automatically
		// we need to freeze the transaction and sign it with Account ID 0.0.2 private key for it to be properly executed
		const transaction = await new EthereumTransaction()
			.setTransactionId(txId)
			.setEthereumData(
				Uint8Array.from(Buffer.from(rawBody.substring(2), 'hex'))
			)
			.setMaxGasAllowanceHbar(new Hbar(transactionData.gas))
			.setNodeAccountIds([nodeAccountId])
			.freeze()
			.sign(PrivateKey.fromString(String(OPERATOR_PRIVATE)));
		await new Promise((resolve) => setTimeout(resolve, 1));
		const txResponse = await transaction.execute(client);
		console.log(txResponse.toJSON());
		const transactionTimestamp = new Date().toISOString();
		// Sends transaction data to receipt api to check if this transaction is a smart contract
		await sendTransactionInfoToReceiptApi({
			transactionId: txId,
			ethereumTransactionHash: transactionData.txHash,
			hederaTransactionHash: txResponse.toJSON().transactionHash,
			transactionType: 'TRANSFER_TRANSACTION',
			currentBlock: currentBlock,
			evmAddress: accountTo,
			txTimestamp: transactionTimestamp,
		});
		return txResponse.toJSON();
	} catch (error: any) {
		// Sometimes we would catch DUPLICATE_TRANSACTION error that was thrown when Transaction ID was duplicated. 
		// We minimalized this risk by generating it manually but when sometimes this happens you need to process this transaction one more time
		if (error.status && error.status === 'DUPLICATE_TRANSACTION') {
			writeLogFile(
				`logs/create-ethereum-transaction-error`,
				`DUPLICATE TRASNSACTION: \nFound error at transaction ${transactionData.txHash} in block ${currentBlock} Transaction Type: EthereumTransaction \n ${JSON.stringify(error)} \n`,
				true,
				'txt'
			);
			await createEthereumTransaction(
				transactionData,
				accountId,
				client,
				nodeAccountId,
				accountTo,
				currentBlock
			);
		}
		// PLATFORM_NOT_ACTIVE is an error that we precisely do not know why is happening. 
		// We know that after some time when hedera local node is running it will generate this error and after this error is thrown all next transaction will result the same
		// So to this a workaround to this problem. When this error happens we reset hedera local node with function resetHederaLocalNode() and then we hit createEthereumTrasanction one more time with same data for it to process transaction
		// To prevent this behaviour we also reset hedera after processing 100000 blocks in iteration
		if (
			error &&
			typeof error.message === 'string' &&
			error.message.includes('PLATFORM_NOT_ACTIVE')
		) {
			writeLogFile(
				`logs/send-tiny-bar-to-alias-error`,
				`Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`,
				true,
				'txt'
			);
			await resetHederaLocalNode();
			await createEthereumTransaction(
				transactionData,
				accountId,
				client,
				nodeAccountId,
				accountTo,
				currentBlock
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

		writeLogFile(
			`logs/create-ethereum-transaction-error`,
			`Found error at transaction ${transactionData.txHash} in block ${currentBlock} Transaction Type: EthereumTransaction \n ${JSON.stringify(error)} \n`,
			true,
			'txt'
		);
	}
}
