import {networkQueue, mirrorQueue} from '../app';
import {sendAndLogToFile} from '../config/logger.config';
import {getTransactionReceiptFromHederaNode} from "../utils/hedera-client.util";
import {client} from "../config/hedera-client.config";

export function hederaWorker(id: number) {
  console.log(`Hedera Worker ${id} started.`);

  setInterval(async () => {
    if (networkQueue.length > 0) {
      const payload = networkQueue.shift();
      if (payload) {
        console.log(`Hedera Worker ${id} processing transaction ${payload.transactionId}`);
        try {
          const status = await getTransactionReceiptFromHederaNode(client, payload);
          console.log(`Status of transaction ${payload.transactionId} is: ${status}`);

          await sendAndLogToFile(payload, status.toString(), null);
        } catch (error) {
          mirrorQueue.push(payload);
          console.error(`Hedera Worker ${id} failed to get receipt of transaction ${payload.transactionId}, sent to mirror queue. Error was: ${error}`);
        }
      }
    }
  }, 2000);
}
