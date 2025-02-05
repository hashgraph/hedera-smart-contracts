import { getRawTransaction } from "@/api/erigon/get-raw-transaction";
import { writeLogFile } from "@/utils/helpers/write-log-file";
import { AccountId, Client, EthereumTransaction, Hbar, PrivateKey, TransactionId, TransferTransaction } from "@hashgraph/sdk";

const txSenderAddress = "0xeA1B261FB7Ec1C4F2BEeA2476f17017537b4B507";

export async function replicatePlatformNotActiveError(
    accountId: AccountId,
	client: Client,
    operatorPrivate: string
) {

    for(let i = 0; true; i++) {
		// TRANSACTION THAT WILL NOT GIVE FREEZE ERROR AND SHOULD BE PROPER
		// await sendHbarToAliasProper(accountId, txSenderAddress, client);

		// TRANSACTION THAT WILL KEEP FAILING AFTER SOME TIME
        await sendHbarToAlias(
            accountId,
            txSenderAddress,
            1,
            client,
			i
        );
		// TODO
        // await createEthereumTransaction("0x7afaa1366e0a6273b29a6d8d7c932e939dc681ef70dfdeed2fd1a66f582d000c", client, operatorPrivate)
    }
}

async function sendHbarToAlias(
	accountId: AccountId,
	evmAddress: string,
	amountHBar: number | Hbar,
	client: Client,
	iterator: number
) {
	try {
		console.log(`Running transaction ${accountId}, ${evmAddress}`);
		const transaction = new TransferTransaction()
			.addHbarTransfer(accountId, new Hbar(amountHBar).negated())
			.addHbarTransfer(evmAddress, new Hbar(amountHBar));

		const response = await transaction.execute(client);
        console.log(await response.getReceipt(client));
	} catch (error) {
		console.error('Error sending HBAR to alias:', error);
		await writeLogFile(`logs/iterator-for-transfer-transaction.json: `, `${iterator.toString()} \n`, );
	}
}

// async function createEthereumTransaction(
// 	txHash: string,
// 	client: Client,
// 	operatorPrivate: string
// ) {
// 	try {
// 		const rawBody = await getRawTransaction(txHash);
// 		const transaction = await new EthereumTransaction()
// 			.setEthereumData(Uint8Array.from(Buffer.from(rawBody.substring(2), 'hex')))
// 			.setMaxGasAllowanceHbar(new Hbar(21000))
// 			.sign(PrivateKey.fromString(String(operatorPrivate)));
// 		const txResponse = await transaction.execute(client);

// 		console.log('txResponse', txResponse.toJSON());
//         console.log(await txResponse.getReceipt(client));
// 	} catch (error) {
//         console.log("error ", error)
// 	}
// }

export async function sendHbarToAliasProper(
	accountId: AccountId,
	evmAddress: string,
	client: Client
) {
	try {
		console.log(`Running transaction ${accountId}, ${evmAddress}`);
		const txId = TransactionId.generate(accountId);
		const transaction = new TransferTransaction()
			.addHbarTransfer(accountId, new Hbar(100).negated())
			.addHbarTransfer(evmAddress, new Hbar(100))
			.setTransactionId(txId)
			.setNodeAccountIds([new AccountId(3)])
			.freeze();

		// Execute the transaction
		await new Promise(resolve => setTimeout(resolve, 1));
		await transaction.execute(client);
		const txTimestamp = new Date().toISOString();
		// TODO: uncomment when receipt API is ready
		// sendTransactionInfoToReceiptApi(txId, evmAddress, currentBlock, "TRANSFER_TRANSACTION", txTimestamp);
	} catch (error) {
		console.error('Error sending HBAR to alias:', error);
	}
}
