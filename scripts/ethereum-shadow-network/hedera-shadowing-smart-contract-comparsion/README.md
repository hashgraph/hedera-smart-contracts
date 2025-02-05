# Hedera Shadowing Smart Contract Comparator and Shadowing API

This is the first app that is needed to use the shadowing. After starting it, proceed to run the others in order:

- #2 [TX Checker](../transaction-checker)
- #3 [Shadowing main app](../hedera-ethereum-shadowing)

### System requirements

- [Node.js](https://nodejs.org/en) >= 22.x
- [Docker](https://www.docker.com/) > 24.x
- [Docker Compose](https://docs.docker.com/compose/) > 2.22.0
- Minimum 16GB RAM

### Notes

> ❗️ Both apps need to be running in order to use the shadowing.

> 💡 Both apps can be ran with docker by running `docker compose up -d`.

# Hedera Shadowing Smart Contract Comparator

### Pre-requisities

- Add `logs` directory in the root of the project for log files.
- Create a `.env` file in the root of project and add all variables from `.env.example`.
  - `SHADOWING_API_HOST` - address for the shadowing API
  - `MIRROR_NODE_API_HOST` - address for the mirror node API
  - `ERIGON_API_HOST` - address for the erigon API

> When using docker compose change first two variables with names of the docker containers, like in `.env.example` file, while `ERIGON_API_HOST` must point to IP hosting the Erigon VM/client. Without docker change all of them to `localhost`.

- To run the app Hedera Local Node needs to be set up. Refer to the [hedera local node setup instructions.](#hedera-local-node-setup-instructions)

### Usage

To start the app use:

```
npm run dev
```

# Shadowing API

An API that creates a WebSocket connection to listen for incoming requests from the transaction checker app. The shadowing API will be set by default on the following ports:

- 3005 - Shadowing API
- 8005 - Shadowing API WebSocket

### Pre-requisities

To run the app Hedera Local Node needs to be set up. Refer to the [hedera local node setup instructions.](#hedera-local-node-setup-instructions). It also requires a RPC API that complies to the API described [here](#ethereum-rpc-api). We recommend Erigon client.

### Usage

To start the app use:

```
npm run api
```

## Additional informations

### Hedera local node setup instructions

To run this project install the [Hedera local node](https://github.com/hiero-ledger/hiero-local-node) environment.

1. Go to: `.nvm/versions/node/<node version>/lib/node_modules/@hashgraph/hedera-local`.

2. Hedera local node must be running on the 11155111 chain. To do this, open `build/configuration/originalNodeConfiguration.json` and change the `contracts.chainId` value to `11155111`.

3. Change the selected variables in the file inside `.env`. To work with Sepolia and Mainnet, you need additional memory:

   - `NETWORK_NODE_MEM_LIMIT=16gb`
   - `PLATFORM_JAVA_HEAP_MAX=12g`

4. The original Hedera local node `network_node` service has issues with creating transactions on the `CHAIN_ID` 11155111. To fix that, paste both images into `docker-compose.yml` and replace the service images with:

   - `havaged` service: `us-docker.pkg.dev/swirlds-registry/local-node/network-node-haveged:0.54.0-shadowing-wip-new-changes-0.54.0-alpha.5.x06fa4a3`
   - `network-node` service: `us-docker.pkg.dev/swirlds-registry/local-node/main-network-node:0.54.0-shadowing-wip-new-changes-0.54.0-alpha.5.x06fa4a3`

   To prevent any stability issues, in the same file:

   - add a new volume for the `network-node` service: `"network-node-data:/opt/hgcapp/services-hedera/HAPIApp2.0/data/saved"`
   - register that volume in volumes at the end of the file: `network-node-data: name: network-node-data`

5. In the same directory, go to `build/services/DockerService.js` remove the `-v` flag from the last `docker-compose down` command.

6. In `build/state/StopState.js`, remove the `-v` flag from the last `docker-compose down` command.

7. The Hedera local node can be now started with:

   ```
   RELAY_CHAIN_ID=11155111 hedera start
   ```

   The shadowing will automatically reset Hedera without losing any data.

### Ethereum RPC API

The host also need to be connected to an RPC API that enables all required Ethereum client methods used in the process. For this, we recommend the _Erigon_ client.

- [eth_getBalance](https://www.quicknode.com/docs/ethereum/eth_getBalance)

- [eth_getBlockByHash](https://www.quicknode.com/docs/ethereum/eth_getBlockByHash)

- [eth_getBlockByNumber](https://www.quicknode.com/docs/ethereum/eth_getBlockByNumber)

- [eth_blockNumber](https://www.quicknode.com/docs/ethereum/eth_blockNumber)

- [eth_getRawTransactionByHash](https://www.quicknode.com/docs/ethereum/eth_getRawTransactionByHash)

- [eth_getStorageAt](https://www.quicknode.com/docs/ethereum/eth_getStorageAt)

- [eth_getTransactionByHash](https://www.quicknode.com/docs/ethereum/eth_getTransactionByHash)

- [eth_getTransactionReceipt](https://www.quicknode.com/docs/ethereum/eth_getTransactionReceipt)

- [eth_getUncleByBlockNumberAndIndex](https://docs.alchemy.com/reference/eth-getunclebyblocknumberandindex)

> ❗️ The shadowing process will not work if the API does not provide all of this methods.
