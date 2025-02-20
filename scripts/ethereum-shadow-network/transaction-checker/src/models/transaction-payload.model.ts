// SPDX-License-Identifier: Apache-2.0

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
