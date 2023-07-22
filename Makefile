HARDHAT_BASE_COMMAND=npx hardhat
HEDERA_BASE_COMMAND=npx hedera
PRETTIER_BASE_COMMAND=npx prettier

# compiles all smart contracts
run-compile:
	$(HARDHAT_BASE_COMMAND) compile

# runs all test suites
run-test:
	$(HARDHAT_BASE_COMMAND) test

# starts a new hedera local node
start-hedera-local:
	$(HEDERA_BASE_COMMAND) start -d

# stop current hedera local node
stop-hedera-local:
	$(HEDERA_BASE_COMMAND) stop

# format all files
format-codebase:
	$(PRETTIER_BASE_COMMAND) . --write

# assure all files are formatted
format-check:
	$(PRETTIER_BASE_COMMAND) . --check

