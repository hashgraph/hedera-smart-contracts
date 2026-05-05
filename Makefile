HARDHAT_BASE_COMMAND=npx hardhat
PRETTIER_BASE_COMMAND=npx prettier

# compiles all smart contracts
run-compile:
	$(HARDHAT_BASE_COMMAND) compile

# runs all test suites
run-test:
	$(HARDHAT_BASE_COMMAND) test

# Deploy local Hiero network via Solo (requires Docker, Kind, and kubectl — see TEST_SETUP.md)
start-solo-local:
	npm run solo:deploy

# format all files
format-codebase:
	$(PRETTIER_BASE_COMMAND) . --write

# assure all files are formatted
format-check:
	$(PRETTIER_BASE_COMMAND) . --check

