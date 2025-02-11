import {env} from "./config/environment-variables.config";
import {TransactionPayload} from "./models/transaction-payload.model";
import app from "./server";
import {mirrorWorker} from "./services/mirror-worker.service";
import {hederaWorker} from "./services/hedera-worker.service";

export const mirrorQueue: TransactionPayload[] = [];
export const networkQueue: TransactionPayload[] = [];

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

const networkWorkers = env.networkWorkers || 5;
for (let i = 0; i < networkWorkers; i++) {
  hederaWorker(i);
}

const mirrorWorkers = env.mirrorWorkers || 5;
for (let i = 0; i < mirrorWorkers; i++) {
  mirrorWorker(i);
}
