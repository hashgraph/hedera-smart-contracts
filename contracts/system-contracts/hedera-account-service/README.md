## Hedera Account Service (HAS) System Contract Functions

The Hedera Account Service (HAS) System Contract is accessible at address `0x16a` on the Hedera network. This contract interface introduces a new account proxy contract to interact with other contracts for functionality such as HBAR allowances. It enables querying and granting HBAR approval to a spender account from within smart contracts, allowing developers to grant, retrieve, and manage HBAR allowances directly in their code. Additionally, HAS can verify whether a given address (Hedera account or EVM address) is authorized based on a provided message hash and signature through the `isAuthorizedRaw` method.

The table below outlines the available Hedera Account Service System Contract functions:

| Function Name     | Function Selector Hash | Consensus Node Release Version                                               | HIP                                            | Method Interface                                                           |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `hbarAllowance`   | `0xbbee989e`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#v0.52) | [HIP 906](https://hips.hedera.com/hip/hip-906) | `hbarAllowance(address spender)`                                           |
| `hbarApprove`     | `0x86aff07c`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#v0.52) | [HIP 906](https://hips.hedera.com/hip/hip-906) | `hbarApprove(address spender, int256 amount)`                              |
| `isAuthorizedRaw` | `0xb2a31da4`           | [0.52](https://docs.hedera.com/hedera/networks/release-notes/services#v0.52) | [HIP 632](https://hips.hedera.com/hip/hip-632) | `isAuthorizedRaw(address, bytes /*messageHash*/, bytes /*signatureBlob*/)` |
