// SPDX-License-Identifier: Apache-2.0

import { AccountId, Client } from '@hashgraph/sdk';
import dotenv from 'dotenv';
import { compareContractRootStates } from './compare-contract-state-root';
dotenv.config();
const OPERATOR_PRIVATE = process.env.OPERATOR_PRIVATE;
const node = { '127.0.0.1:50211': new AccountId(3) };
const client = Client.forNetwork(node).setMirrorNetwork('127.0.0.1:5600');
const accountId = new AccountId(2);
client.setOperator(accountId, OPERATOR_PRIVATE || '');

(() => {
	compareContractRootStates(new AccountId(2), client, new AccountId(3));
})();
