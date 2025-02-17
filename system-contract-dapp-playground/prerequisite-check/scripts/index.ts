// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');
const getHederaSmartContractAssetsFunc = require('../contracts-info');

/** @dev resolves the root path of the hedera smart contracts repo */
const HederaSmartContractsRootPath = path.resolve(__dirname, '..', '..', '..');

if (
  !fs.existsSync(`${HederaSmartContractsRootPath}/artifacts`) ||
  !fs.existsSync(`${HederaSmartContractsRootPath}/contracts`)
) {
  console.error(
    '❌ CONTRACT ASSETS UNAVAILABLE! ❌\nPlease ensure to compile the smart contracts first by navigating to the `hedera-smart-contracts` root directory and running `npm i` and `npx hardhat compile` commands.'
  );
  process.exit();
}

/** @dev retrieves smart contract assets */
const HEDERA_SMART_CONTRACTS = getHederaSmartContractAssetsFunc(HederaSmartContractsRootPath);

/** @dev validation check that ensure availability of the contract assets (artifact files or solidity contract files) */
(() => {
  type ValidatingError = {
    name: string;
    type: 'ABI' | 'SOL';
    path: string;
  };

  const validatingError: ValidatingError[] = [];

  const contractNames = [
    'TokenCreateCustomContract',
    'TokenManagementContract',
    'TokenTransferContract',
    'PrngSystemContract',
    'ExchangeRateMock',
    'TokenQueryContract',
    'IHRC719Contract',
    'ERC20Mock',
    'ERC721Mock',
  ];

  contractNames.forEach((name) => {
    if (!fs.existsSync(HEDERA_SMART_CONTRACTS[name].contractPath)) {
      validatingError.push({ name, type: 'SOL', path: HEDERA_SMART_CONTRACTS[name].contractPath });
    }
    if (!fs.existsSync(HEDERA_SMART_CONTRACTS[name].artifactPath)) {
      validatingError.push({ name, type: 'ABI', path: HEDERA_SMART_CONTRACTS[name].artifactPath });
    }
  });

  if (validatingError.length > 0) {
    console.error('❌ CONTRACT ASSETS UNAVAILABLE! ❌');
    validatingError.forEach((error) => {
      console.error(
        `Missing ${error.type === 'ABI' ? 'artifacts' : 'solidity contract'} file at ${error.path}`
      );
    });

    console.error(
      '\nPlease ensure to compile the smart contracts first by navigating to the `hedera-smart-contracts` root directory and running `npm i` and `npx hardhat compile` commands.'
    );
  } else {
    console.log(`✅ Validation successful! Contract assets are available! ✅`);
  }
})();
