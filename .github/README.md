# Hedera Smart Contracts Workflows

A detailed overview of how you can use hedera-smart-contract's github workflows for testing purposes. Besides examples, there will be explanations of what is happening under the hood.

## Actions

### Migration Testing

When there is a new version released, no matter if it is network-node, mirror-node, or relay, we want to make sure the entire ecosystem is working as expected and there are not any critical regressions introduced. Another concern with switching the network node's versions is "the migration" that is running under the hood. It occurs every time a node has been started and detects if there is data for migration. The migration testing workflow offers this type of testing where we can choose versions for pre/post image tags.

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
    - initialNetworkNodeTag: 0.48.1
    - initialMirrorNodeTag: 0.103.0
    - initialRelayTag: 0.47.0
    - targetNetworkNodeTag: 0.49.7
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
