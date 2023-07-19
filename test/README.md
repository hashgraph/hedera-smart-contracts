# Hedera Smart Contracts - tests

Test scenarios verifying the correct behavior of the following contracts:

- Diamond
- ERC-20
- ERC-721
- ERC-1155
- HIP-583
- HTS-Precompile [ERC-20, ERC-721, token-create, token-management, token-query, token-transfer]
- SafeHTS

# Hedera Smart Contracts - Local test suite execution

The tests are implmented in an independent manner, so they can be executed all, by test set or a single test.

## Using command line:

Running "npx hardhat test" in the terminal will execute all the existing tests. If you want to execute specific test set or single test you should:

1. Open the desired test suite - Ex. ERC20.js
2. Add "only" to the desired describe/it - Ex. describe.only || it.only
3. Run in the terminal "npx hardhat test" for all tests
4. Run in the terminal "npx hardhat test ./test/test.file.js" || "npx hardhat test --grep ERC20" for running a specific file

## Using launch.json config in VSCode

1. Open VSCode
2. Open Run & Debug
3. Click on "Create a launch.json file" and paste the following json:

```bash
{
    "version": "0.2.0",
    "configurations": [
      {
        "type": "pwa-node",
        "request": "launch",
        "name": "Hardhat Tests",
        "runtimeArgs": [
          "--preserve-symlinks",
          "--preserve-symlinks-main"
        ],
        "program": "${workspaceFolder}/node_modules/hardhat/internal/cli/cli.js",
        "args": [
          "test"
        ],
        "console": "integratedTerminal",
        "internalConsoleOptions": "neverOpen",
        "disableOptimisticBPs": true,
        "cwd": "${workspaceFolder}"
      }
    ]
  }
```

4. Use the Play button from the Run & Debug section to execute the tests.

[launch](https://raw.githubusercontent.com/hashgraph/hedera-smart-contracts/main/test/images/launch.png)

# Execute tests locally against mainnet, testnet and previewnet, localnet

- Start the local node:
  npx hedera start -d --network ${networkName}

Network specific configurations can be applied using the -n/--network option when starting/restarting the local node. Pre-configured options are mainnet, previewnet, testnet and local.

[Local node documentation](https://github.com/hashgraph/hedera-local-node/#using-hedera-local)
