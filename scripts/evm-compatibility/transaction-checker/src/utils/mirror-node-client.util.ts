import {env} from "../config/environment-variables.config";
import {TransactionPayload} from "../models/transaction-payload.model";
import axios from 'axios';

export async function checkTransactionOnMirrorNode(payload: TransactionPayload): Promise<string> {
  const transactionId = convertTransactionIdForMirrorNode(payload.transactionId);
  const url = `${env.mirrorNodeUrl}/api/v1/transactions/${transactionId}`;
  console.log(`checkTransactionOnMirrorNode: Sending GET request to: ${url}`);

  let response: any;
  let retryCount = 0;
  const maxRetry = 3;

  while (retryCount < maxRetry) {
    try {
      response = await axios.get(url, {
        headers: {'Content-Type': 'application/json'},
      });
      if (response.status === 404) {
        throw new Error('Received 404 response');
      }
      break;
    } catch (error: any) {
      console.error(`An error occurred: ${error.message}, retrying in five seconds..`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      retryCount++;
    }
  }

  if (retryCount === maxRetry) {
    throw new Error('Maximum retry limit reached');
  }

  if (response.status !== 200) {
    throw new Error(`Received non-200 response: ${response.status}`);
  }

  const transactions = response.data.transactions;
  if (!transactions || transactions.length === 0) {
    throw new Error('Transaction not found in the response');
  }

  const transaction = transactions.find((tx: any) => tx.transaction_id === transactionId);
  if (!transaction) {
    throw new Error('Transaction not found in the response');
  }

  console.log(`Transaction found in the response from Mirror Node:\n${transaction.result}`);
  return transaction.result;
}

function convertTransactionIdForMirrorNode(input: string): string {
  let splitTransactionId = input.split("@");
  splitTransactionId[1] = splitTransactionId[1].replace(/\./g, "-");
  return splitTransactionId.join("-");
}
