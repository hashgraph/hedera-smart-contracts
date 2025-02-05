export interface StateData {
	slot: string;
	value: string;
	timestamp: string;
	address: string;
}

export interface ContractType {
	addressTo: string;
	blockNumber: number;
	currentTimestamp: string;
	ethereumTransactionHash: string | null;
	hederaTransactionHash: string;
	transactionId: string;
	txTimestamp: string;
	type: string;
}

export interface TransactionStatusResponse extends ContractType {
	status: string;
}

interface HederaTransfers {
	account: string;
	amount: number;
	is_approval: boolean;
}

interface HederaTransaction {
	bytes: null;
	charged_tx_fee: number;
	consensus_timestamp: string;
	entity_id: string;
	max_fee: string;
	memo_base64: string;
	name: string;
	nft_transfers: [];
	node: string;
	nonce: number;
	parent_consensus_timestamp: null | string;
	result: string;
	scheduled: boolean;
	staking_reward_transfers: [];
	token_transfers: [];
	transaction_hash: string;
	transaction_id: string;
	transafers: HederaTransfers[];
	valid_duration_seconds: string;
	valid_start_timestamp: string;
}

export interface HederaTransactionsResponse {
	transactions: HederaTransaction[];
}

export interface ContractDetails {
	blockNumber: number,
	ethereumTransactionHash: string,
	timestamp: string,
	contractAddress: string,
	searchedSlot: string,
	hederaValue: string,
	ethereumValue: string,
}
