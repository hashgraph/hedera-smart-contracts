import {mirrorQueue} from "../app";
import {checkTransactionOnMirrorNode} from "../utils/mirror-node-client.util";
import {sendAndLogToFile} from "../config/logger.config";

export function mirrorWorker(id: number) {
  console.log(`Mirror Worker ${id} started.`);

  setInterval(async () => {
    if (mirrorQueue.length > 0) {
      const payload = mirrorQueue.shift();
      if (payload) {
        console.log(`Mirror Worker ${id} processing transaction ${payload.transactionId}`);
        try {
          const status = await checkTransactionOnMirrorNode(payload);
          console.log(`Status of transaction ${payload.transactionId} is: ${status}`);

          await sendAndLogToFile(payload, status, null);
        } catch (error) {
          console.error(`Mirror Worker ${id} failed to get the status of transaction ${payload.transactionId}: ${error}`);
          await sendAndLogToFile(payload, '', `Error getting status from node, transaction failed or not executed (mirror node): ${error}`);
          // TODO: Implement error handling to prevent payload loss when Mirror Node is unavailable.
        }
      }
    }
  }, 2000);
}
