export interface TransactionPayload {
  transactionId: string;
  type: string;
  blockNumber: number;
  addressTo: string;
  txTimestamp: string;
  currentTimestamp: string;
  ethereumTransactionHash?: string;
  hederaTransactionHash: string;
}
