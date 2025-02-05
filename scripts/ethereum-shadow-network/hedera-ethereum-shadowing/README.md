# Hedera Shadowing

This is the third and last service needed to start the comparsion, exact process is described [here](#how-does-it-work). You can find the rest of the services below:

- #1 [transaction checker](../transaction-checker)
- #2 [SC comparator](../hedera-shadowing-smart-contract-comparsion/)

### Description

Goal of the Hedera shadowing process is to research the Hedera EVM and Ethereum EVM equivalence.
This is achieved by re-executing all Ethereum transaction on by one on local Hedera network. Each transaction is verified by states match.

### System requirements

- [Node.js](https://nodejs.org/en) >= 22.x
- [Docker](https://www.docker.com/) > 24.x
- [Docker Compose](https://docs.docker.com/compose/) > 2.22.0
- [PM2](https://pm2.keymetrics.io/) - Optional
- Minimum 16GB RAM

### Pre-requisities

- Create a `.env` file in the root of project and add all variables from `.env.example`. API key for `OPERATOR_PRIVATE`
  [can be found in this article](https://docs.hedera.com/hedera/sdks-and-apis/sdks/client).
- Add `logs` directory in the root of the project for logs
- Make sure that the rest of the services are up and running

### Usage

##### With PM2 - Recommended

Install packages:

```
npm install
```

Start the app:

```
pm2 start ecosystem.config.js
```

Configure `ecosystem.config.js` file according to preferences. Find more about [pm2 configuration here](https://pm2.keymetrics.io/docs/usage/application-declaration/).

Running with this method shadowing will create inside log directory a pm2 directory with errors and output from the pm2.

##### With NPM

Install packages:

```
npm install
```

Start the app:

```
npm run dev
```

### How does it work?

This is an outline of what the script does:

1. First step populates the empty Hedera local node with Sepolia genesis block accounts and assigns them proper balances by transferring funds from the treasury account in Hedera (Account Id 0.0.2). The genesis state is provided from [genesis_block_transactions.json](./src/genesis_block_transactions.json).
2. The last block from Sepolia is read, we iterate through all the block in a loop, starting from genesis block.
3. For each block its miners and uncles are read. The reward for block calculated is sent to an account in Hedera using the `TransferTransaction` method from the Hashgraph SDK.
4. Then the iteration starts through all the transactions present in the block. A transfer is sent to the transaction recipient's EVM address, provided it does not already exist in the Hedera node. The raw transaction body is read from Sepolia using the RPC API provided by Erigon and sent to the Hedera Consensus Node using the `EthereumTransaction` method from the Hedera SDK.
5. If no error occurs, all transactions sent to Hedera in step 4 are asynchronously forwarded to the transaction checker API, which verifies the success of the transactions.
6. In the background, the system listens for a response from the Receipt API. Once the response is received, the state root of the contract is compared, if it was present in the current block. This step is done by making an API call to `GET /api/v1/contracts/${contractAddress}/state?timestamp=${timestamp}` in the Hedera Mirror Node REST API, where `contractAddress` is the transaction recipient address, and `timestamp` is the Hedera transaction timestamp. If states for this address are present, each state is checked using an RPC API call to the eth_getStorageAt method provided by Erigon, and the values at the same address are compared. If the values differ, the occurrence is logged to a separate file.
7. Steps 2–5 are repeated. As mentioned above, step 6 runs in the background.
