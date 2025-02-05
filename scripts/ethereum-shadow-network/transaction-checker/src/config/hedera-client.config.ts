import {AccountId, Client, PrivateKey} from "@hashgraph/sdk";
import {env} from "./environment-variables.config";

export const client = Client
  .forNetwork({ [env.networkUrl] : new AccountId(parseInt(env.networkAccount)) })
  .setMirrorNetwork(env.hederaClientMirrorNetworkUrl);

client.setOperator(
  AccountId.fromString(env.operatorAccount),
  PrivateKey.fromString(env.operatorAccountKey)
);
