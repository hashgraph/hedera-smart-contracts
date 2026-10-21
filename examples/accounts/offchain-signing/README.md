# Off-chain and offline account deletion transaction signing

Sign an `AccountDeleteTransaction` completely off-chain and offline, then let another party execute it once its
`validStart` time is reached. One application is resetting an account's nonce to allow flows that require an
initial nonce, such as deterministic contract addresses.

```bash
npm ci                    # install dependencies
cp .env.example .env      # copy and fill the .env
npm run sign              # sign the transaction and print the signed transaction bytes
npm run execute           # (executor side) wait for validStart and submit SIGNED_TX_BYTES
```

`.env.example` format:

```bash
DELETABLE_ACCOUNT_NUM=   # uint - the account id we want to delete - e.g. 6056440
DELETABLE_ACCOUNT_PK=    # hex encoded 32 bytes - the account's private key - e.g. 0x0e98be035c311a4053db957b088497e326e62964ecad8672ad797370506ff9bf
RECEIVER_ACCOUNT_NUM=    # uint - the account to transfer the remaining funds to - e.g. 5644001
VALID_START_DAYS_OFFSET= # uint - after how many days the transaction's validStart time will be set - e.g. 15 (default 30)
SIGNED_TX_BYTES=         # hex encoded signed transaction bytes (output of `npm run sign`)
```

The executor (`scripts/executeSignedTransactionCron.js`) checks every 15 seconds whether the transaction's
`validStart` has passed and submits it to a mainnet node. Switch to the commented testnet client in the script to
run it against testnet.
