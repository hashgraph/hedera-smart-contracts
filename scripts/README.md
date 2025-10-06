# Scripts

This folder contains supporting scripts used for development, operations, and demos.

Subfolders
- offchain-signing/: Helpers for generating and signing payloads off-chain.
- offchain-signed-tx-executor-cron/: Example executor that submits signed transactions on a schedule.

## How to run
1) Install dependencies at the repository root: npm install
2) Copy example.env to local.env and populate required variables.
3) Run a script from its folder, for example:
   - node scripts/offchain-signing/index.js
   - node scripts/offchain-signed-tx-executor-cron/index.js

## Environment
- Configuration is read from local.env and process.env.
- See example.env for expected variables.

## Related docs
- README.md (root): project overview and prerequisites
- TEST_SETUP.md and test/README.md: running tests locally
- Each subfolder has its own README with details and usage examples.