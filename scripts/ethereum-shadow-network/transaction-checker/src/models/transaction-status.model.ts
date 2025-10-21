// SPDX-License-Identifier: Apache-2.0

import {TransactionPayload} from "./transaction-payload.model";

export interface TransactionStatus extends TransactionPayload {
  status: string;
  error?: string;
}
