import fs from 'fs';
import path from 'path';
import {TransactionStatus} from '../models/transaction-status.model';
import {TransactionPayload} from "../models/transaction-payload.model";
import {sendToShadowingSmartContractComaparisonApi} from "../utils/shadowing-client.util";
import {env} from "./environment-variables.config";

export async function sendAndLogToFile(payload: TransactionPayload, status: string, error: string | null) {
  const transactionStatus: TransactionStatus = {
    ...payload,
    status: status,
    error: error || undefined,
  };

  const jsonString = JSON.stringify(transactionStatus);

  try {
    await Promise.all([
      sendToShadowingSmartContractComaparisonApi(jsonString),
      logToFile(jsonString)
    ]);
    console.log('Data sent to Shadowing API and transaction logged to file.');
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

async function logToFile(jsonString: string) {
  const shouldLog = env.logToFile == 'true';
  if (!shouldLog) {
    return;
  }  // Log to file if enabled in environment variables.

  const logEntry = `${new Date().toISOString()} - ${jsonString}\n`;
  const logFilePath = path.resolve(__dirname, `..`, `..`, env.logFilePath, env.logFileName);

  await fs.promises.mkdir(path.dirname(logFilePath), {recursive: true});
  await fs.promises.appendFile(logFilePath, logEntry, 'utf8');
}
