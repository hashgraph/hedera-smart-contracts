import {
	websocketConnection,
	websocketEvents,
} from '@/api/websocket/websocket-connection';
import { TransactionStatusResponse } from '@/utils/types';
import { compareSmartContractRootState } from '@/apps/smart-contract-comparison/blockchain-utils/compare-smart-contract-root-state';
import { transactionStatusAccuracyChecker } from '@/apps/smart-contract-comparison/hedera/transaction-status-accuracy-checker';

(async () => {
	let iteration = 0;

	// Start listening for the shadowing api requests from evm_shadowing api
	websocketConnection();
	await new Promise((resolve) => setTimeout(resolve, 2000));
	const eventQueue: TransactionStatusResponse[] = [];
	let isProcessing = false;

	websocketEvents.on(
		'websocket',
		async (contractData: TransactionStatusResponse) => {
			eventQueue.push(contractData);
			await processQueue();
		}
	);

	// main function for processing next transactions and check if there are smart contract calls and if true compare slots on smart contract address between Hedera and Ethereum
	async function processQueue() {
		if (isProcessing) return;

		isProcessing = true;
		while (eventQueue.length > 0) {
			const contractData = eventQueue.shift();
			if (contractData) {
				iteration++;
				// log transaction data
				await transactionStatusAccuracyChecker(contractData);
				// function for detecting and comparing smart contract slots between Hedera and Sepolia
				await compareSmartContractRootState(contractData);
			}
		}
		isProcessing = false;
	}
})();
