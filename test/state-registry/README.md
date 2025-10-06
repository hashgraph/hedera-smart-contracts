State Registry tests

This folder contains tests that exercise the StateRegistry contract by writing and reading a broad set of Solidity types.

Files
- stateRegistry.js: Core tests that set/get primitive and complex types
- ercStateTest.js: ERC-related variations and additional state checks
- states.json, ercStates.json: Generated during test runs to persist example state

Related
- contracts/state-registry/: The contract under test
- contracts-abi/: ABIs used by the tests