// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

// Pulls the system contract helpers from @hiero-ledger/hiero-contracts into the compilation,
// so the tests can deploy them by name.
import "@hiero-ledger/hiero-contracts/extensions/token-create/TokenCreateContract.sol";
import "@hiero-ledger/hiero-contracts/extensions/token-transfer/TokenTransferContract.sol";
import "@hiero-ledger/hiero-contracts/native/EthNativePrecompileCaller.sol";
