import { TRANSACTION_CHECKER_LOGGER } from '@/utils/file-logger';
import { TransactionStatusResponse } from '@/utils/types';

export async function transactionStatusAccuracyChecker(
	transactionData: TransactionStatusResponse
) {
	console.log(`Checking transaction ${transactionData.hederaTransactionHash}`);
	const { status } = transactionData;

	if (transactionData) {
		const transactionArray: TransactionStatusResponse[] =
			Object.values(transactionData);

		TRANSACTION_CHECKER_LOGGER.info(transactionArray);

		console.log(`Finished checking transaction - result: ${status}`);
	}
}
