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

/**
 * @dev setting up the directory/location information for smart contract assets
 */
const getHederaSmartContractAssets = (HederaSmartContractsRootPath: string) => {
  return {
    TokenCreateCustomContract: {
      name: 'TokenCreateCustomContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol/TokenCreateCustomContract.json`,
    },
    TokenManagementContract: {
      name: 'TokenManagementContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol/TokenManagementContract.json`,
    },
    TokenQueryContract: {
      name: 'TokenQueryContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol/TokenQueryContract.json`,
    },
    TokenTransferContract: {
      name: 'TokenTransferContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol/TokenTransferContract.json`,
    },
    IHRC719Contract: {
      name: 'IHRC719Contract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/IHRC.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/IHRC.sol/IHRC.json`,
    },
    ExchangeRateMock: {
      name: 'ExchangeRateMock',
      contractPath: `${HederaSmartContractsRootPath}/contracts/exchange-rate-precompile/ExchangeRateMock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/exchange-rate-precompile/ExchangeRateMock.sol/ExchangeRateMock.json`,
    },
    PrngSystemContract: {
      name: 'PrngSystemContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/util-precompile/PrngSystemContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/util-precompile/PrngSystemContract.sol/PrngSystemContract.json`,
    },
    ERC20Mock: {
      name: 'ERC20Mock',
      contractPath: `${HederaSmartContractsRootPath}/contracts/openzeppelin/ERC-20/ERC20Mock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/openzeppelin/ERC-20/ERC20Mock.sol/ERC20Mock.json`,
    },
    ERC721Mock: {
      name: 'ERC721Mock',
      contractPath: `${HederaSmartContractsRootPath}/contracts/openzeppelin/ERC-721/ERC721Mock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/openzeppelin/ERC-721/ERC721Mock.sol/ERC721Mock.json`,
    },
  };
};

module.exports = getHederaSmartContractAssets;
