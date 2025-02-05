import express from 'express';
import {networkQueue} from "./app";
import {TransactionPayload} from "./models/transaction-payload.model";

const app = express();
app.use(express.json());

app.post("/check-transaction", (req, res) => {
  const payload: TransactionPayload = req.body;
  console.debug(`/check-transaction Received: ${JSON.stringify(payload)}`)

  if (!payload || !payload.transactionId) {
    res.status(400).send("Invalid payload");
    return;
  }

  networkQueue.push(payload);
  console.log(`Transaction ${payload.transactionId} sent to network queue.`);
  res.status(202).send("Transaction queued");
});

export default app;
