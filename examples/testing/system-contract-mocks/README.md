# System contract mocks (Foundry)

Unit-test contracts that call Hedera system contracts without a Hedera network. The mocks in [`src/mocks`](src/mocks)
re-implement the system contracts in Solidity and are installed at the system contract addresses with `vm.etch`:

| Mock | Address | Implements |
| --- | --- | --- |
| `HtsSystemContractMock` (+ `HederaFungibleToken`, `HederaNonFungibleToken`) | `0x167` | Token create/mint/burn/associate/transfer/approve, KYC, freeze, pause, token info (HTS) |
| `ExchangeRateSystemContractMock` | `0x168` | tinycent ↔ tinybar conversion with a settable rate |
| `PRNGSytemContractMock` | `0x169` | Pseudo-random seed |

The helpers in [`test/utils`](test/utils) set the mocks up (`_setUpHtsPrecompileMock()`,
`_setUpExchangeRateSystemContractMock()`, ...) and wrap common calls (create, mint, associate, transfer, ...).

`test/SimpleVault.t.sol` shows how to use them to unit test your own contract: `src/SimpleVault.sol` uses `SafeHTS`
and `SelfFunding` from [`@hiero-ledger/hiero-contracts`](https://www.npmjs.com/package/@hiero-ledger/hiero-contracts),
and the test runs it against mocked HTS and exchange rate system contracts. The other tests cover the mocks themselves.

The mocks are a best-effort approximation for unit tests. Always run integration tests against a real network
(e.g. a local [Solo](https://solo.hiero.org) network) before relying on system contract behavior.

## Run

```bash
npm ci        # @hiero-ledger/hiero-contracts, @openzeppelin/contracts and forge-std
forge build
forge test -vvv
```

`HtsSystemContractMock` is larger than the EIP-170 contract size limit. That is fine for tests (it is installed with
`vm.etch`), but it means `forge build --sizes` fails for this project.
