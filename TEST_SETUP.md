# Development Guidelines

## Requirements

- [git](https://git-scm.com/)
- [npm](https://www.npmjs.com/)
- [docker](https://www.docker.com/)
- [node (version 18)](https://nodejs.org/en/)
- [contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md#pull-requests)
- [Hedera accounts](https://docs.hedera.com/hedera/getting-started/introduction#create-hedera-portal-profile-faucet)
- [prettier pluggin](https://prettier.io/) (recommended)

**_Notes_**: If your IDE does not support the Prettier plugin, please follow the [code formatter guidelines](GUIDELINES.md#code-formatter) to maintain the consistent code format.

## Building and Running the Project

1. Install dependencies

```
   npm install
```

2. Configure environment variables

   At root, create a `.env` file using the `example.env` as the template and fill out the variables.

   | Variable            | Description                                                                      |
   | ------------------- | -------------------------------------------------------------------------------- |
   | `OPERATOR_ID_A`     | This is the `Account ID` which can be found in your account portal.              |
   | `OPERATOR_KEY_A`    | This is the `DER Encoded Private Key` which can be found in your account portal. |
   | `HEX_PRIVATE_KEY_A` | This is the `HEX Encoded Private Key` which can be found in your account portal. |
   | `HEX_PRIVATE_KEY_B` | This is the `HEX Encoded Private Key` which can be found in your account portal. |

**_Notes_**: At least two accounts are required for the `HEX_PRIVATE_KEY` fields. See [Create Hedera Portal Profile](https://docs.hedera.com/hedera/getting-started/introduction#create-hedera-portal-profile-faucet) on how to create accounts on Hedera networks.

**_Important_**: While Hedera supports both ECDSA and ED25519 accounts, please use ECDSA since Ethereum only supports ECDSA.

3. Configure Hardhat

   Adjust the `defaultNetwork` field in the [hardhat.config.js](hardhat.config.js) file based on the network your accounts (specified in the .env file) are associated with.

4. Compile smart contracts

```
    npx hardhat compile
```

5. Test smart contracts

   5.1 Set up `Hedera Local Node`

   - Use the default env variables provided in [local.env](./local.env) for your `.env` file.

   - Ensure that the `defaultNetwork` in [hardhat.config.js](./hardhat.config.js) is set to `NETWORKS.local.name`.

   - From the root of your project directory, execute the following command to start up a `Hedera local node`:

   ```
      npx hedera start -d
   ```

   **_Important_**: Before running the `hedera local node`, verify that there are no other instances of Hedera docker containers or json-rpc-relay running in the background, as they might interfere with the functionality of the `hedera local node`.

   5.2 Execute test suites

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

