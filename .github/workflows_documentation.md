# Hedera Smart Contracts Workflows

A detailed overview of how you can use hedera-smart-contract's github workflows for testing purposes. Besides examples, there will be explanations of what is happening under the hood.

## Actions

### Migration Testing

When there is a new version released, no matter if it is network-node, mirror-node, or relay, we want to make sure the entire ecosystem is working as expected and there are not any critical regressions introduced.

Another concern with switching the network node's versions is "the migration" that is running under the hood. It occurs every time a node has been started and detects if there is data for migration. The migration testing workflow offers this type of testing where we can choose versions for pre/post image tags.

Available workflow inputs are:

- **initialNetworkNodeTag** - Specify the initial Network Node image tag
- **initialMirrorNodeTag** - Specify the initial Mirror Node image tag
- **initialRelayTag** - Specify the initial Relay image tag
- **targetNetworkNodeTag** - Specify target Network Node image tag
- **targetMirrorNodeTag** - Specify the target Mirror Node image tag
- **targetRelayTag** - Specify the target Relay image tag
- **preMigrationTestTags** - Specify the pre-migration test tags. Default: @pre-migration. It could be every tag we want (e.g. **@OZERC20**)
- **postMigrationTestTags** - Specify the post-migration test tags. Default: @post-migration. It could be every tag we want (e.g. **@OZERC20**)

Examples:

- if we want to test possible state corruption between mono and mod versions, we could use a setup like this:
  - initialNetworkNodeTag: 0.48.1 # last tag for mono module
  - initialMirrorNodeTag: 0.103.0
  - initialRelayTag: 0.47.0
  - targetNetworkNodeTag: 0.49.7 # first stable tag for modular module
  - targetMirrorNodeTag: 0.103.0
  - targetRelayTag: 0.47.0
  - preMigrationTestTags: @pre-migration
  - postMigrationTestTags: @post-migration
- if we want to check for regressions on @OZERC20 suite after the relay's version update, we could use a setup like this:
  - initialNetworkNodeTag: 0.49.7
  - initialMirrorNodeTag: 0.104.0
  - initialRelayTag: 0.47.0
  - targetNetworkNodeTag: 0.49.7
  - targetMirrorNodeTag: 0.104.0
  - targetRelayTag: 0.48.0
  - preMigrationTestTags: @OZERC20
  - postMigrationTestTags: @OZERC20
- if we want to simulate the mirror node's version update, we could use a setup like this:
  - initialNetworkNodeTag: 0.49.7
  - initialMirrorNodeTag: 0.103.0
  - initialRelayTag: 0.47.0
  - targetNetworkNodeTag: 0.49.7
  - targetMirrorNodeTag: 0.104.0
  - targetRelayTag: 0.47.0
  - preMigrationTestTags: @pre-migration
  - postMigrationTestTags: @post-migration

The testing matrix offers pretty big coverage as we can see. All options and combinations rely on us, and what's our end goal.

### Opcode logger Testing

In order to make opcode logger testing easier, we decided to use Besu's **debug_traceTransaction** responses as a source of truth for executed opcodes. The pipeline execution is as follows:
- installs dependencies
- compiles contracts
- executes `npm run besu:start` - A helper script that starts the local Besu node, the version is hardcoded to 24.6.0 and it uses an official docker image. Exposed ports are:
  - *8540* which is mapped to Besu's HTTP json-rpc relay
  - *8541* which is mapped to Besu's WS json-rpc relay

  All the overridden node properties as miner address, enabled and included apis including custom genesis file are defined in *utils/besu-configs/customConfigFile.toml*. A custom genesis file (defined in *utils/besu-configs/customGenesisFile.toml*) is needed because starting block number of all existing forks till now must be set to 0 when Besu's node is used as a local private testing network. Start-up accounts are included in *customGenesisFile.json* as well and they easily can be expanded with new user-defined ones.
- executes specific tests - These tests have custom before and after methods that detect the target network, and if it is Besu, then execute **debug_traceTransaction** against Besu node and save the opcodes response into JSON file. That step doesn't gain us any coverage, it's needed to generate a source of truth when the same tests are executed against the Hedera local node.
- starts Hedera local node
- executes specific tests - These tests have custom before and after methods that detect the target network, and if it is Hedera, then execute **debug_traceTransaction** against Hedera local node and compare response opcodes with these generated against Besu and saved in JSON several steps above.

Entire Besu's prerequisites and responses generation are required because each time a solidity's compiler version in the **hardhat.config.js** is changed, the developer, who did the update, must locally run these tests against Besu to generate a new hardcoded JSON which will be used for further comparison. That would be needed because let's get for example changes from solidity *0.8.23* and *0.8.24*. Contracts compiled with the older version will not include EIP-5656 (for `MCOPY` opcode) and EIP-1153 (for `TSTORE` and `TLOAD` opcodes) and **debug_traceTransaction** will return opcodes based on the contract's bytecode. When a solidity version is updated to *0.8.24* in **hardhat.config.js**, contracts will be precompiled and the new opcodes (from EIP-5656 and EIP-1153) will be introduced in the contracts bytecodes, so when we run the tests and compare **debug_traceTransaction** responses with the hardcoded ones (generated with contracts compiled with solidity *0.8.23*) they will differ. After using a CI as above, the solidity version update is not binding to developers and they shouldn't take extra care for new "source of truth" JSON generation.
