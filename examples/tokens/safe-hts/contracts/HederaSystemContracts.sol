// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

// Pulls the SafeHTS operation contracts from @hiero-ledger/hiero-contracts into the compilation,
// so the tests can deploy them by name.
import "@hiero-ledger/hiero-contracts/token-service/safe-hts/SafeOperations.sol";
import "@hiero-ledger/hiero-contracts/token-service/safe-hts/SafeViewOperations.sol";
