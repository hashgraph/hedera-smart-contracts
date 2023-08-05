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
  const ERC20Mock = require(`${HederaSmartContractsRootPath}/artifacts/contracts/erc-20/ERC20Mock.sol/ERC20Mock.json`);
  const ERC721Mock = require(`${HederaSmartContractsRootPath}/artifacts/contracts/erc-721/ERC721Mock.sol/ERC721Mock.json`);
  const SelfFunding = require(`${HederaSmartContractsRootPath}/artifacts/contracts/exchange-rate-precompile/SelfFunding.sol/SelfFunding.json`);
  const HRCContract = require(`${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/hrc/HRCContract.sol/HRCContract.json`);
  const PrngSystemContract = require(`${HederaSmartContractsRootPath}/artifacts/contracts/util-precompile/PrngSystemContract.sol/PrngSystemContract.json`);
  const TokenQueryContract = require(`${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol/TokenQueryContract.json`);
  const TokenTransferContract = require(`${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol/TokenTransferContract.json`);
  const TokenManagementContract = require(`${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol/TokenManagementContract.json`);
  const TokenCreateCustomContract = require(`${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol/TokenCreateCustomContract.json`);

  return {
    TokenCreateCustomContract: {
      name: 'TokenCreateCustomContract',
      contractABI: TokenCreateCustomContract.abi,
      contractBytecode: TokenCreateCustomContract.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol/TokenCreateCustomContract.json`,
    },
    TokenManagementContract: {
      name: 'TokenManagementContract',
      contractABI: TokenManagementContract.abi,
      contractBytecode: TokenManagementContract.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol/TokenManagementContract.json`,
    },
    TokenQueryContract: {
      name: 'TokenQueryContract',
      contractABI: TokenQueryContract.abi,
      contractBytecode: TokenQueryContract.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol/TokenQueryContract.json`,
    },
    TokenTransferContract: {
      name: 'TokenTransferContract',
      contractABI: TokenTransferContract.abi,
      contractBytecode: TokenTransferContract.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol/TokenTransferContract.json`,
    },
    HRCContract: {
      name: 'HRCContract',
      contractABI: HRCContract.abi,
      contractBytecode: HRCContract.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/hrc/HRCContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/hrc/HRCContract.sol/HRCContract.json`,
    },
    SelfFunding: {
      name: 'SelfFunding',
      contractABI: SelfFunding.abi,
      contractBytecode: SelfFunding.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/exchange-rate-precompile/SelfFunding.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/exchange-rate-precompile/SelfFunding.sol/SelfFunding.json`,
    },
    PrngSystemContract: {
      name: 'PrngSystemContract',
      contractABI: PrngSystemContract.abi,
      contractBytecode: PrngSystemContract.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/util-precompile/PrngSystemContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/util-precompile/PrngSystemContract.sol/PrngSystemContract.json`,
    },
    ERC20Mock: {
      name: 'ERC20Mock',
      contractABI: ERC20Mock.abi,
      contractBytecode: ERC20Mock.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/erc-20/ERC20Mock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/erc-20/ERC20Mock.sol/ERC20Mock.json`,
    },
    ERC721Mock: {
      name: 'ERC721Mock',
      contractABI: ERC721Mock.abi,
      contractBytecode: ERC721Mock.bytecode,
      contractPath: `${HederaSmartContractsRootPath}/contracts/erc-721/ERC721Mock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/erc-721/ERC721Mock.sol/ERC721Mock.json`,
    },
  };
};

module.exports = getHederaSmartContractAssets;
