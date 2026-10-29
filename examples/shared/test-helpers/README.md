# Shared test helpers

Helpers used by the Hardhat examples under `examples/` that test against a Hedera network:

| Module | Contents |
| --- | --- |
| `networks.js` | Hardhat `networks` config for `local` (Solo), `testnet` and `previewnet`, read from the example's `.env` |
| `constants.js` | Contract names, event names, gas limits and other test constants |
| `hedera-token-service.js` | Hedera SDK client, HTS token creation/association/KYC helpers, mirror node queries |
| `helpers.js` | Polling helpers that wait for state to reach the mirror node |
| `utils.js` | Small encoding helpers (function selectors, hex to ASCII) |

It is not published. An example depends on it with a `file:` dependency and installs it as a regular
copy (`install-links=true` in the example's `.npmrc`), so `require('hardhat')` and the other peer
dependencies resolve from the example's own `node_modules`:

```json
"devDependencies": {
  "hedera-examples-test-helpers": "file:../../shared/test-helpers"
}
```

```js
const Constants = require('hedera-examples-test-helpers/constants');
const Utils = require('hedera-examples-test-helpers/hedera-token-service');
```

Copying an example out of this repository? Copy this folder next to it and adjust the `file:` path.
