/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const fs = require('fs');
const path = require('path');
const getHederaSmartContractAssetsFunc = require('../contracts-info');

/** @dev resolves the root path of the hedera smart contracts repo */
const HederaSmartContractsRootPath = path.resolve(__dirname, '..', '..');

if (
  !fs.existsSync(`${HederaSmartContractsRootPath}/artifacts`) ||
  !fs.existsSync(`${HederaSmartContractsRootPath}/contracts`)
) {
  console.error(
    '❌ CONTRACT ASSETS UNAVAILABLE! ❌\nPlease make sure to follow the guidelines at https://github.com/hashgraph/hedera-smart-contracts/tree/main/system-contract-dapp-playground#Project-Prerequisite-Check-for-Contract-Assets for more information on how to set up the project environment properly.'
  );
  process.exit();
}

/** @dev retrieves smart contract assets */
const HEDERA_SMART_CONTRACTS = getHederaSmartContractAssetsFunc(HederaSmartContractsRootPath);

/** @dev validation check that ensure availability of the contract assets (artifact files or solidity contract files) */
(() => {
  let error = false;
  const contractNames = [
    'TokenCreateCustomContract',
    'TokenManagementContract',
    'TokenQueryContract',
    'TokenTransferContract',
    'HRCContract',
    'SelfFunding',
    'PrngSystemContract',
    'ERC20Mock',
    'ERC721Mock',
  ];

  contractNames.forEach((name) => {
    if (!fs.existsSync(HEDERA_SMART_CONTRACTS[name].contractPath)) {
      error = true;
      return;
    }
    if (!fs.existsSync(HEDERA_SMART_CONTRACTS[name].artifactPath)) {
      error = true;
      return;
    }
  });

  if (error) {
    console.error(
      '❌ CONTRACT ASSETS UNAVAILABLE! ❌\nPlease make sure to follow the guidelines at https://github.com/hashgraph/hedera-smart-contracts/tree/main/system-contract-dapp-playground#Project-Prerequisite-Check-for-Contract-Assets for more information on how to set up the project environment properly.'
    );
  } else {
    console.log(`✅ Validation successful! Contract assets are available! ✅`);
  }
})();
