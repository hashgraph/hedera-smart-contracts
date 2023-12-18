# TEST_SETUP

## Requirements

- [git](https://git-scm.com/)
- [npm](https://www.npmjs.com/)
- [docker](https://www.docker.com/)
- [node (version 18)](https://nodejs.org/en/)
- [contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md#pull-requests)
- [Hedera accounts](https://docs.hedera.com/hedera/getting-started/introduction#create-hedera-portal-profile-faucet)
- [prettier pluggin](https://prettier.io/) (recommended)

**_Notes_**: If your IDE does not support the Prettier plugin, please follow the [code formatter guidelines](TEST_SETUP.md#code-formatter) to maintain the consistent code format.

## Building and Running the Project

#### 1. Install dependencies

```
   npm install
```

#### 2. Configure environment variables

At root, create a `.env` file using the `example.env` as the template and fill out the variables.

| Variable         | Description                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `OPERATOR_ID_A`  | This is the `Account ID` which can be found in your account portal.                                                       |
| `OPERATOR_KEY_A` | This is the `DER Encoded Private Key` which can be found in your account portal.                                          |
| `PRIVATE_KEYS`   | This is the `HEX Encoded Private Key` list which can be found in your account portal. It supports up to six private keys. |

**_Notes_**: At least two accounts are required for the `HEX_PRIVATE_KEY` fields. See [Create Hedera Portal Profile](https://docs.hedera.com/hedera/getting-started/introduction#create-hedera-portal-profile-faucet) on how to create accounts on Hedera networks. Six accounts will be needed if you want to run the solidity voting example. The local.env file uses ECDSA accounts listed when starting the local node.

**_Important_**: While Hedera supports both ECDSA and ED25519 accounts, please use ECDSA since Ethereum only supports ECDSA.

#### 3. Configure Hardhat

Adjust the `defaultNetwork` field in the [hardhat.config.js](hardhat.config.js) file based on the network your accounts (specified in the .env file) are associated with.

Available Networks:

- local for reference and how to setup a local besu node please follow the [link](https://docs.hedera.com/hedera/sdks-and-apis/sdks/set-up-your-local-network)
- testnet
- previewnet
- besu_local for reference and how to setup a local besu node please follow the [link](https://besu.hyperledger.org/)

#### 4. Installing the `foundry-rs` toolkit for the `forge` testing framework

**_Motivation_**: This step is necessary for the project as it utilizes the `hardhat-foundry` plugin, enabling Hardhat to use dependencies from the `./lib` folder, which are installed using `forge`. Consequently, the plugin attempts to execute `forge install` to make these dependencies accessible to Hardhat. Therefore, it is crucial to install the `forge` testing framework, which is a part of the `foundry-rs` toolkit.

**_Notes_**: If you already have `foundry-rs` and `forge` correctly installed locally, you can skip this step.

##### 4.a. First, download the `foundry-rs` installer by running the following command:

```bash
curl -L https://foundry.paradigm.xyz | bash
```

##### 4.b. Next, to install `Foundry` and `forge`, simply execute:

```bash
foundryup
```

#### 5. Compile smart contracts

```
    npx hardhat compile
```

#### 6. Test smart contracts

##### 6.1 Set up `Hedera Local Node`

- Use the default env variables provided in [local.env](./local.env) for your `.env` file.

- Ensure that the `defaultNetwork` in [hardhat.config.js](./hardhat.config.js) is set to `NETWORKS.local.name`.

- From the root of your project directory, execute the following command to start up a `Hedera local node`:

```
   npx hedera start -d
```

**_Important_**: Before running the `hedera local node`, verify that there are no other instances of Hedera docker containers or json-rpc-relay running in the background, as they might interfere with the functionality of the `hedera local node`.

##### 6.2 Execute test suites

Run below command to execute the tests

```
   npx hardhat test
```

**_Note_**: For more information on testing, follow the instructions in the [test guide](test/README.md).

## Code Formatter

Before committing your new changes, please run command below to format all files:

```
   npx prettier . --write
```

**_Notes_**: This is applicable only in cases where you haven't configured prettier within your IDE.
