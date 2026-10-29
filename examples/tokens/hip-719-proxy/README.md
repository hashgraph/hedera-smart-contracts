# HIP-719 token proxy

`HRC719TokenProxy` is the token proxy described in [HIP-719](https://hips.hedera.com/hip/hip-719): every HTS token address runs this redirect code, which forwards the call (prefixed with the `redirectForToken` selector and the token address) to the HTS system contract at `0x167`. Build only; it is a reference implementation of the code the network serves for token addresses.

## Run

```bash
npm ci
npx hardhat compile
```
