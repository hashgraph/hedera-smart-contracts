HARDHAT_BASE_COMMAND=npx hardhat

# compiles all smart contracts
run-compile:
	$(HARDHAT_BASE_COMMAND) compile

# runs all test suites
run-test:
	$(HARDHAT_BASE_COMMAND) test

# format all files
run-formatter:
	npx prettier . --write

# assure all files are formatted
run-format-check:
	npx prettier . --check