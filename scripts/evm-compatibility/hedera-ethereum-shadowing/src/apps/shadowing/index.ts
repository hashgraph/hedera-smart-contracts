import { getAllGenesisData } from '@/apps/shadowing/frontier/get-all-genesis-data';
import { Client, AccountId } from '@hashgraph/sdk';
import dotenv from 'dotenv';
import { startNetworkReplicationProcess } from '@/apps/shadowing/blockchain-utils/start-network-replication-process';
dotenv.config();

// Defining operator account with private key. More info here https://docs.hedera.com/hedera/sdks-and-apis/sdks/client
// COnfiguration for local network can be found here https://docs.hedera.com/hedera/sdks-and-apis/sdks/set-up-your-local-network

//private key of transaction operator account we picked account with ID 0.0.2
const OPERATOR_PRIVATE = process.env.OPERATOR_PRIVATE;

const HARDCODED_NUMBER_OF_BLOCKS = 100000;
const HARDCODED_BLOCK_NUMBER_WITH_TRANSACTIONS = 5966639;

// Account ID 0.0.3 is the consensus node account https://docs.hedera.com/hedera/sdks-and-apis/sdks/set-up-your-local-network#id-2.-configure-your-network
const nodeAccountId = new AccountId(3);
const node = { '127.0.0.1:50211': nodeAccountId };
const client = Client.forNetwork(node).setMirrorNetwork('127.0.0.1:5600');
// getAllTransaction() is method for retrieving all accounts for the genesis block, the data is held in file /genesis_block_transactions.json
const genesisTransactions = getAllGenesisData();
const accountId = new AccountId(2);
client.setOperator(accountId, OPERATOR_PRIVATE || '');

(async () => {
	await startNetworkReplicationProcess(
		accountId,
		genesisTransactions,
		client,
		nodeAccountId
	);
})();
