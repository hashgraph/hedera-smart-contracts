HARDHAT_BASE_COMMAND=npx hardhat
PRETTIER_BASE_COMMAND=npx prettier

# compiles all smart contracts
run-compile:
	$(HARDHAT_BASE_COMMAND) compile

# runs all test suites
run-test:
	$(HARDHAT_BASE_COMMAND) test

# starts a new solo instance
start-solo:
	npx @hashgraph/solo@0.58.0 one-shot falcon deploy --values-file .github/falcon.yml --dev

# stop a solo instance
stop-solo:
	npx @hashgraph/solo@0.58.0 one-shot falcon destroy

# format all files
format-codebase:
	$(PRETTIER_BASE_COMMAND) . --write

# assure all files are formatted
format-check:
	$(PRETTIER_BASE_COMMAND) . --check
