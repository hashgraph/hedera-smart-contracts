import { AccountId, Client, PrivateKey } from '@hashgraph/sdk';
import { HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY } from './config';

export const initClient = () => {
  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(HEDERA_OPERATOR_ID), PrivateKey.fromStringECDSA(HEDERA_OPERATOR_KEY));
  return client;
}
