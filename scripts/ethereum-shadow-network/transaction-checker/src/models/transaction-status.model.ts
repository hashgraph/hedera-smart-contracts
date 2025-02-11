import {TransactionPayload} from "./transaction-payload.model";

export interface TransactionStatus extends TransactionPayload {
  status: string;
  error?: string;
}
