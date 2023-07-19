# Hedera Smart Contracts

Reference library for Smart Contracts utilized by the Hedera network with supporting files and examples.

## Overview

The Hedera network utilizes system contracts at a reserved contract address on the EVM to surface HAPI service functionality through EVM processed transactions.
These system contracts are precompiled smart contracts whose function selectors are mapped to defined network logic.
In this way EVM users can utilize exposed HAPI features natively in their smart contracts.

The precompiled functions are defined in this library and picked up by the [Hedera Services](https://github.com/hashgraph/hedera-services) repo.

### HTS Precompile

The Hedera Token Service (HTS) functionality is defined by the [IHederaTokenService.sol](contracts/hts-precompile/IHederaTokenService.sol) interface smart contract as defined in [HIP 206](https://hips.hedera.com/hip/hip-206), [HIP 376](https://hips.hedera.com/hip/hip-376) and [HIP 514](https://hips.hedera.com/hip/hip-514). The contract is exposed via the `0x167` address.
Reference smart contracts to call these functions as well as examples can be found under [contracts/hts-precompile](contracts/hts-precompile)

For further details on methods, hashes and availability please refer to [HTS Precompile methods](contracts/hts-precompile/README.md)

- Solidity files updated on April 20, 2022 to add token create support
- Solidity files updated on Jan 18, 2022

### Exchange Rate Precompile

The Exchange Rate functionality is defined by the [IExchangeRate.sol](contracts/exchange-rate-precompile/IExchangeRate.sol) interface smart contract as defined in [HIP 475](https://hips.hedera.com/hip/hip-475) and exposed via the `0x168` address.
Reference smart contracts to call these functions as well as examples can be found under [contracts/exchange-rate-precompile](contracts/exchange-rate-precompile)

For further details on methods, hashes and availability please refer to [Exchange Rate Precompile methods](contracts/exchange-rate-precompile/README.md)

### Prng Precompile

The PRNG functionality is defined by the [IPrng.sol](contracts/util-precompile/IPrngSystemContract.sol) interface smart contract as defined in [HIP 351](https://hips.hedera.com/hip/hip-351) and exposed via the `0x169` address.
Reference smart contracts to call these functions as well as examples can be found under [contracts/util-precompile](contracts/util-precompile)

For further details on methods, hashes and availability please refer to [PRNG Precompile methods](contracts/util-precompile/README.md)

## Development guidelines

This project is set up using the Hardhat development environment. To get started, please follow this [test setup guide](./TEST_SETUP.md).

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

