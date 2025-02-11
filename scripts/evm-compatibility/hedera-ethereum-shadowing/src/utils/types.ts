export type TransactionType = 'TRANSFER' | 'TRANSFER_TRANSACTION';

export type Genesis = {
	toAccount: string;
	amount: number;
};

export interface StateData {
	slot: string;
	value: string;
	timestamp: string;
	address: string;
}

export interface TransactionData {
	txHash: string;
	gas: number;
}
