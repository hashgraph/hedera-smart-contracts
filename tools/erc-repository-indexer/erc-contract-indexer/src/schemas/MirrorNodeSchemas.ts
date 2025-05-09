// SPDX-License-Identifier: Apache-2.0

// refs: https://github.com/hashgraph/hedera-mirror-node-explorer/blob/main/src/schemas/MirrorNodeSchemas.ts#L543
export interface MirrorNodeContract {
  admin_key: any;
  auto_renew_account: string | null; // Network entity ID in the format of shard.realm.num
  auto_renew_period: number | null;
  contract_id: string | null; // Network entity ID in the format of shard.realm.num
  created_timestamp: string | null;
  deleted: boolean;
  evm_address: string;
  expiration_timestamp: string | null;
  file_id: string | null | undefined; // Network entity ID in the format of shard.realm.num
  max_automatic_token_associations: number | null;
  memo: string;
  nonce: number | undefined;
  obtainer_id: string | null; // Network entity ID in the format of shard.realm.num
  permanent_removal: boolean | null;
  proxy_account_id: string | null; // Network entity ID in the format of shard.realm.num
  timestamp: any;
}

export interface MirrorNodeContractResponse extends MirrorNodeContract {
  bytecode: string | null;
  runtime_bytecode: string | null;
}

export interface Links {
  next: string | null;
}

export interface ContractCallData {
  data: string;
  to: string;
}
