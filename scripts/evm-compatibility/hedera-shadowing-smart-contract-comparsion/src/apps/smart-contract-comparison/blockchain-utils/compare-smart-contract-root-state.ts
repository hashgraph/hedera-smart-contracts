import { getMirrorNodeTransaction } from '@/api/hedera-mirror-node/get-mirror-node-transaction';
import { getHederaContractStatesByTimestamp } from '@/apps/smart-contract-comparison/blockchain-utils/get-hedera-contract-states-by-timestamp';
import { getStorageAt } from '@/api/erigon/get-storage-at';
import { writeLogFile } from '@/utils/helpers/write-log-file';
import { ContractDetails, ContractType } from '@/utils/types';

// Compare a smart contract slot state from hedera and ethereum net and write it in the log file if they are not equal.
export async function compareSmartContractRootState(
	contractRootData: ContractType
) {
	console.log(
		`Starting compare state contract ${contractRootData.blockNumber}`
	);

	const errorInBlock = [];
	const contractsInBlock = [];

	// function for getting transaction with mirror node REST API http://localhost:5551/api/v1/docs/#/transactions/getTransaction
	const transactionResponse = await getMirrorNodeTransaction(
		contractRootData.hederaTransactionHash
	);

	const createTransactionTimestamp = transactionResponse.consensus_timestamp;
	console.log(createTransactionTimestamp, 'lastTransactionTimestamp');

	if (
		contractRootData &&
		contractRootData.ethereumTransactionHash &&
		contractRootData.addressTo
	) {
		const possibleTransactionAddress = contractRootData.addressTo;
		// detect if address to from transaction was a smart contract address. If the result array is not empty then it means that this was a smart contract address that we send transaction to
		// we send request to Hedera mirror node REST API http://localhost:5551/api/v1/docs/#/contracts/getContractState with address to of transaction and consensus timestamp to check this address in given timestamp
		const hederaStates = await getHederaContractStatesByTimestamp(
			possibleTransactionAddress,
			createTransactionTimestamp
		);

		if (hederaStates.length > 0) {
			contractsInBlock.push(transactionResponse.transactionHash);
		}

		for (const hederaState of hederaStates) {
			// as we iterate through smart contracts slots from hedera, we need to check slot on Ethereum chain with RPC API call to function eth_getStorageAt https://www.quicknode.com/docs/ethereum/eth_getStorageAt
			// we pass transaction address, slot address that we acquired from previous call to Hedera Mirror Node REST API and for the last parameter we pass the block number of block from Ethereum
			const sepoliaStateValue = await getStorageAt(
				possibleTransactionAddress,
				hederaState.slot,
				contractRootData.blockNumber.toString(16)
			);

			const contractDetails = {
				blockNumber: contractRootData.blockNumber,
				ethereumTransactionHash: contractRootData.ethereumTransactionHash,
				timestamp: hederaState.timestamp,
				contractAddress: possibleTransactionAddress,
				searchedSlot: hederaState.slot,
				hederaValue: hederaState.value,
				ethereumValue: sepoliaStateValue,
			};

			const contractDetailsValues: ContractDetails[] =
				Object.values(contractDetails);

			// we log all smart contract detection and values
			await writeLogFile(
				`logs/all-contracts-details`,
				`${contractDetailsValues.map((elem) => elem)} \r\n`,
				'csv'
			);
			// then we comapre the value on slots between Ethereum and Hedera if there are not the same than we put it in array for later usage
			if (sepoliaStateValue != hederaState.value) {
				errorInBlock.push(contractDetailsValues);
			}
		}
	}

	// all the not matched slots values on smart contracts between Hedera and Ethereum we log in here
	if (errorInBlock.length > 0) {
		await writeLogFile(
			`logs/state-root-compare-errors`,
			`${errorInBlock.map((elem) => elem)} \r\n`,
			'csv',
		);
	}
}
