# Transaction checker

This is second part of the shadowing app.

This is an API used to send transaction informations for asynchronous check for the transaction status that we are pushing to Hedera consensus node via transfer transaction or EthereumTransaction method. After the check is completed a response is sent to [hedera shadowing smart contract comparison](https://github.com/Kamil-chmielewski-ariane/hedera-shadowing-smart-contract-comparison) to check smart contract states between Hedera and Sepolia.

You can find the rest of the services here:

- #1 [hedera shadowing smart contract comparison](https://github.com/Kamil-chmielewski-ariane/hedera-shadowing-smart-contract-comparison)
- #3 [Shadowing main app](https://github.com/Kamil-chmielewski-ariane/hedera-ethereum-shadowing)

### Pre-requsities

Before runing this app make sure that everything required in [hedera shadowing smart contract comparison](https://github.com/Kamil-chmielewski-ariane/hedera-shadowing-smart-contract-comparison) is up and running.

Create a `.env` file in the root of project and add all variables as in `.env.example`. API key for `OPERATOR_PRIVATE` should be added from the shadowing.

- `PORT`- port on which app will be running on - default is 8081
- `LOG_TO_FILE` - whether the app should log to files
- `LOG_FILE_PATH`- directory to store the logs
- `LOG_FILE_NAME`- logfile name
- `NETWORK_WORKERS`- max network workers - default 128
- `MIRROR_WORKERS`- max mirror workers - default is 64
- `NETWORK_QUEUE_CAPACITY`- max network queue capacity - default is 65536
- `MIRROR_QUEUE_CAPACITY`- max mirror queue capacity - default is 65536
- `NETWORK_URL`- URL of the network node API exposed by hedera local node
- `NETWORK_ACCOUNT`- id of network account
- `OPERATOR_ACCOUNT`- id of operator account
- `OPERATOR_ACCOUNT_KEY`- operator key [can be found in this article](https://docs.hedera.com/hedera/sdks-and-apis/sdks/client)
- `MIRROR_NODE_URL`- URL of the mirror exposed by hedera local node
- `SHADOWING_API_URL` - URL of the shadowing API from the first service
- `HEDERA_CLIENT_MIRROR_NETWORK_URL` - URL of the Hedera local node's mirror network

### Usage

Install packages:

```shell
npm install
```

To start the checker run:

```shell
npm run dev
```
