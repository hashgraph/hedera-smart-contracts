:warning: :bangbang: ***All examples and contracts in this repository are exploration code and have NOT been audited. Use them at your own risk!*** :bangbang: :warning:

# Hedera Smart Contracts

Reference library for Smart Contracts utilized by the Hedera network with supporting files and examples.

## Overview

The Hedera network utilizes system contracts at a reserved contract address on the EVM to surface HAPI service functionality through EVM processed transactions.
These system contracts are precompiled smart contracts whose function selectors are mapped to defined network logic.
In this way EVM users can utilize exposed HAPI features natively in their smart contracts.

The system contract functions are defined in [Hiero Contracts repository](https://github.com/hiero-ledger/hiero-contracts) and implemented by the [Hedera Services](https://github.com/hashgraph/hedera-services) repo as part of consensus node functionality.

### Hedera Token Service (HTS) System Contract

The Hedera Token Service (HTS) functionality is defined by the [IHederaTokenService.sol](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/token-service/IHederaTokenService.sol) interface smart contract as defined in [HIP 206](https://hips.hedera.com/hip/hip-206), [HIP 376](https://hips.hedera.com/hip/hip-376) and [HIP 514](https://hips.hedera.com/hip/hip-514). The contract is exposed via the `0x167` address.
Reference smart contracts to call these functions can be found under [@hiero-ledger/hiero-contracts/token-service](https://github.com/hiero-ledger/hiero-contracts/tree/main/contracts/token-service)

For further details on methods, hashes and availability please refer to [HTS System Contract Methods](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/token-service/README.md)

### Hedera Account Service (HAS) System Contract

The Hedera Account Service (HAS) functionality is defined by the [IHederaAccountService.sol](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/account-service/IHederaAccountService.sol) interface smart contract as defined in [HIP 632](https://hips.hedera.com/hip/hip-632) and [HIP 906](https://hips.hedera.com/hip/hip-906). The contract is exposed via the `0x16a` address.
Reference smart contracts to call these functions can be found under [@hiero-ledger/hiero-contracts/account-service](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/account-service)

For further details on methods, hashes and availability please refer to [HAS System Contract Methods](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/account-service/README.md)

### Exchange Rate System Contract

The Exchange Rate functionality is defined by the [IExchangeRate.sol](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/exchange-rate/IExchangeRate.sol) interface smart contract as defined in [HIP 475](https://hips.hedera.com/hip/hip-475) and exposed via the `0x168` address.
Reference smart contracts to call these functions can be found under [@hiero-ledger/hiero-contracts/exchange-rate](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/exchange-rate)

For further details on methods, hashes and availability please refer to [Exchange Rate System Contract Methods](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/exchange-rate/README.md)

### Prng System Contract

The PRNG functionality is defined by the [IPrngSystemContract.sol](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/prng/IPrngSystemContract.sol) interface smart contract as defined in [HIP 351](https://hips.hedera.com/hip/hip-351) and exposed via the `0x169` address.
Reference smart contracts to call these functions can be found under [@hiero-ledger/hiero-contracts/prng](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/prng)

For further details on methods, hashes and availability please refer to [PRNG System Contract Methods](https://github.com/hiero-ledger/hiero-contracts/blob/main/contracts/prng/README.md)

## Development guidelines

This project is set up using the Hardhat development environment. To get started, please follow this [test setup guide](./TEST_SETUP.md).

For using this project as a library in a Foundry project see [Foundry Testing](FOUNDRY_TESTING.md)

## Support

If you have a question on how to use the product, please see our
[support guide](https://github.com/hashgraph/.github/blob/main/SUPPORT.md).

## Contributing

Contributions are welcome. Please see the
[contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md)
to see how you can get involved.

## Code of Conduct

This project is governed by the
[Contributor Covenant Code of Conduct](https://github.com/hashgraph/.github/blob/main/CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code of conduct. Please report unacceptable behavior
to [oss@hedera.com](mailto:oss@hedera.com).

## License

[Apache License 2.0](LICENSE)

## Smart contracts - testing

[Smart contracts tests - documentation](https://raw.githubusercontent.com/hashgraph/hedera-smart-contracts/main/test/README.md)
