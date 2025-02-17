// SPDX-License-Identifier: Apache-2.0

/**
 * @dev setting up the directory/location information for smart contract assets
 */
const getHederaSmartContractAssets = (HederaSmartContractsRootPath: string) => {
  return {
    TokenCreateCustomContract: {
      name: 'TokenCreateCustomContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/system-contracts/hedera-token-service/examples/token-create/TokenCreateCustom.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/system-contracts/hedera-token-service/examples/token-create/TokenCreateCustom.sol/TokenCreateCustomContract.json`,
    },
    TokenManagementContract: {
      name: 'TokenManagementContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/system-contracts/hedera-token-service/examples/token-manage/TokenManagementContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/system-contracts/hedera-token-service/examples/token-manage/TokenManagementContract.sol/TokenManagementContract.json`,
    },
    TokenQueryContract: {
      name: 'TokenQueryContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/system-contracts/hedera-token-service/examples/token-query/TokenQueryContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/system-contracts/hedera-token-service/examples/token-query/TokenQueryContract.sol/TokenQueryContract.json`,
    },
    TokenTransferContract: {
      name: 'TokenTransferContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/system-contracts/hedera-token-service/examples/token-transfer/TokenTransferContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/system-contracts/hedera-token-service/examples/token-transfer/TokenTransferContract.sol/TokenTransferContract.json`,
    },
    IHRC719Contract: {
      name: 'IHRC719Contract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/system-contracts/hedera-token-service/IHRC719.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/system-contracts/hedera-token-service/IHRC719.sol/IHRC719.json`,
    },
    ExchangeRateMock: {
      name: 'ExchangeRateMock',
      contractPath: `${HederaSmartContractsRootPath}/contracts/system-contracts/exchange-rate/ExchangeRateMock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/system-contracts/exchange-rate/ExchangeRateMock.sol/ExchangeRateMock.json`,
    },
    PrngSystemContract: {
      name: 'PrngSystemContract',
      contractPath: `${HederaSmartContractsRootPath}/contracts/system-contracts/pseudo-random-number-generator/PrngSystemContract.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/system-contracts/pseudo-random-number-generator/PrngSystemContract.sol/PrngSystemContract.json`,
    },
    ERC20Mock: {
      name: 'ERC20Mock',
      contractPath: `${HederaSmartContractsRootPath}/contracts/openzeppelin/ERC-20/ERC20Mock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/openzeppelin/ERC-20/ERC20Mock.sol/OZERC20Mock.json`,
    },
    ERC721Mock: {
      name: 'ERC721Mock',
      contractPath: `${HederaSmartContractsRootPath}/contracts/openzeppelin/ERC-721/ERC721Mock.sol`,
      artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/openzeppelin/ERC-721/ERC721Mock.sol/OZERC721Mock.json`,
    },
  };
};

module.exports = getHederaSmartContractAssets;
