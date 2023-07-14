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

const hre = require("hardhat");
const { ethers } = hre;
const { expect } = require("chai");
const {
  AccountId, Client, AccountInfoQuery, AccountUpdateTransaction,
  ContractId, KeyList, PrivateKey, TokenId, TokenUpdateTransaction,
  TokenAssociateTransaction
} = require("@hashgraph/sdk");
const Constants = require('../constants')

class Utils {
  //createTokenCost is cost for creating the token, which is passed to the precompile. This is equivalent of 40 and 60hbars, any excess hbars are refunded.
  static createTokenCost = "50000000000000000000";
  static createTokenCustomFeesCost = "60000000000000000000";
  static tinybarToWeibarCoef = 10_000_000_000;

  static KeyType = {
    ADMIN: 1,
    KYC: 2,
    FREEZE: 4,
    WIPE: 8,
    SUPPLY: 16,
    FEE: 32,
    PAUSE: 64
  }

  static KeyValueType = {
    INHERIT_ACCOUNT_KEY: 0,
    CONTRACT_ID: 1,
    ED25519: 2,
    SECP256K1: 3,
    DELEGETABLE_CONTRACT_ID: 4
  }

  static getSignerCompressedPublicKey(index = 0, asBuffer = true, prune0x = true) {
    const wallet = new ethers.Wallet(hre.config.networks.relay.accounts[index]);
    const cpk = prune0x ? wallet._signingKey().compressedPublicKey.replace('0x', '') : wallet._signingKey().compressedPublicKey;

    return asBuffer ? Buffer.from(cpk, 'hex') : cpk;
  }

  static async deployERC20Mock() {
    const erc20MockFactory = await ethers.getContractFactory(Constants.Path.HIP583_ERC20Mock);
    const erc20Mock = await erc20MockFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const erc20MockReceipt = await erc20Mock.deployTransaction.wait();

    return await ethers.getContractAt(Constants.Path.HIP583_ERC20Mock, erc20MockReceipt.contractAddress);
  }

  static async deployERC721Mock() {
    const erc721MockFactory = await ethers.getContractFactory(Constants.Path.HIP583_ERC721Mock);
    const erc721Mock = await erc721MockFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const erc721MockReceipt = await erc721Mock.deployTransaction.wait();

    return await ethers.getContractAt(Constants.Path.HIP583_ERC721Mock, erc721MockReceipt.contractAddress);
  }

  static async deployTokenCreateContract() {
    const tokenCreateFactory = await ethers.getContractFactory(
      Constants.Contract.TokenCreateContract
    );
    const tokenCreate = await tokenCreateFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const tokenCreateReceipt = await tokenCreate.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.TokenCreateContract,
      tokenCreateReceipt.contractAddress
    );
  }

  static async deployTokenCreateCustomContract() {
    const tokenCreateCustomFactory = await ethers.getContractFactory(
      Constants.Contract.TokenCreateCustomContract
    );
    const tokenCreateCustom = await tokenCreateCustomFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const tokenCreateCustomReceipt = await tokenCreateCustom.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.TokenCreateCustomContract,
      tokenCreateCustomReceipt.contractAddress
    );
  }

  static async deployTokenManagementContract() {
    const tokenManagementFactory = await ethers.getContractFactory(
      Constants.Contract.TokenManagementContract
    );
    const tokenManagement = await tokenManagementFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const tokenManagementReceipt =
      await tokenManagement.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.TokenManagementContract,
      tokenManagementReceipt.contractAddress
    );
  }

  static async deployTokenQueryContract() {
    const tokenQueryFactory = await ethers.getContractFactory(
      Constants.Contract.TokenQueryContract
    );
    const tokenQuery = await tokenQueryFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const tokenQueryReceipt = await tokenQuery.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.TokenQueryContract,
      tokenQueryReceipt.contractAddress
    );
  }

  static async deployTokenTransferContract() {
    const tokenTransferFactory = await ethers.getContractFactory(
      Constants.Contract.TokenTransferContract
    );
    const tokenTransfer = await tokenTransferFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const tokenTransferReceipt = await tokenTransfer.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.TokenTransferContract,
      tokenTransferReceipt.contractAddress
    );
  }

  static async deployHRCContract() {
    const hrcContractFactory = await ethers.getContractFactory(
      Constants.Contract.HRCContract
    );
    const hrcContract = await hrcContractFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const hrcContractReceipt = await hrcContract.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.HRCContract,
      hrcContractReceipt.contractAddress
    );
  }

  static async deployERC20Contract() {
    const erc20ContractFactory = await ethers.getContractFactory(
      Constants.Contract.ERC20Contract
    );
    const erc20Contract = await erc20ContractFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const erc20ContractReceipt = await erc20Contract.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.ERC20Contract,
      erc20ContractReceipt.contractAddress
    );
  }

  static async deployERC721Contract() {
    const erc721ContractFactory = await ethers.getContractFactory(
      Constants.Contract.ERC721Contract
    );
    const erc721Contract = await erc721ContractFactory.deploy(Constants.GAS_LIMIT_1_000_000);
    const erc721ContractReceipt = await erc721Contract.deployTransaction.wait();

    return await ethers.getContractAt(
      Constants.Contract.ERC721Contract,
      erc721ContractReceipt.contractAddress
    );
  }

  static async createFungibleToken(contract, treasury) {
    const tokenAddressTx = await contract.createFungibleTokenPublic(treasury, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createFungibleTokenWithSECP256K1AdminKey(contract, treasury, adminKey) {
    const tokenAddressTx = await contract.createFungibleTokenWithSECP256K1AdminKeyPublic(treasury, adminKey, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(contract, treasury, adminKey) {
    const tokenAddressTx = await contract.createFungibleTokenWithSECP256K1AdminKeyWithoutKYCPublic(treasury, adminKey, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddress(contract, treasury, adminKey, initialBalance = 300) {
    const tokenAddressTx = await contract.createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddressPublic(treasury, adminKey, initialBalance, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createFungibleTokenWithCustomFees(contract, feeTokenAddress) {
    const tokenAddressTx =
      await contract.createFungibleTokenWithCustomFeesPublic(
        contract.address,
        feeTokenAddress,
        {
          value: ethers.BigNumber.from(this.createTokenCustomFeesCost),
          gasLimit: 10_000_000,
        }
      );
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createNonFungibleToken(contract, treasury) {
    const tokenAddressTx = await contract.createNonFungibleTokenPublic(treasury, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createNonFungibleTokenWithSECP256K1AdminKey(contract, treasury, adminKey) {
    const tokenAddressTx = await contract.createNonFungibleTokenWithSECP256K1AdminKeyPublic(treasury, adminKey, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(contract, treasury, adminKey) {
    const tokenAddressTx = await contract.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYCPublic(treasury, adminKey, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const { tokenAddress } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async mintNFT(contract, nftTokenAddress, data = ["0x01"]) {
    const mintNftTx = await contract.mintTokenPublic(nftTokenAddress, 0, data, Constants.GAS_LIMIT_1_000_000);
    const tokenAddressReceipt = await mintNftTx.wait();
    const { serialNumbers } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.MintedToken
    )[0].args;

    return parseInt(serialNumbers);
  }

  static async mintNFTToAddress(contract, nftTokenAddress, data = ["0x01"]) {
    const mintNftTx = await contract.mintTokenToAddressPublic(nftTokenAddress, 0, data, Constants.GAS_LIMIT_1_000_000);
    const tokenAddressReceipt = await mintNftTx.wait();
    const { serialNumbers } = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.MintedToken
    )[0].args;

    return parseInt(serialNumbers);
  }

  //Add Token association via hedera.js sdk
  // Client with signer - my private key example

  static async associateToken(contract, tokenAddress, contractName) {
    const signers = await ethers.getSigners();
    const associateTx1 = await ethers.getContractAt(
      contractName,
      contract.address,
      signers[0]
    );
    const associateTx2 = await ethers.getContractAt(
      contractName,
      contract.address,
      signers[1]
    );

    await contract.associateTokenPublic(contract.address, tokenAddress, Constants.GAS_LIMIT_1_000_000);
    await associateTx1.associateTokenPublic(signers[0].address, tokenAddress, Constants.GAS_LIMIT_1_000_000);
    await associateTx2.associateTokenPublic(signers[1].address, tokenAddress, Constants.GAS_LIMIT_1_000_000);
  }

  static async grantTokenKyc(contract, tokenAddress) {
    const signers = await ethers.getSigners();
    await contract.grantTokenKycPublic(tokenAddress, contract.address);
    await contract.grantTokenKycPublic(tokenAddress, signers[0].address);
    await contract.grantTokenKycPublic(tokenAddress, signers[1].address);
  }

  static async expectToFail(transaction, code) {
    try {
      const result = await transaction;
      const receipt = await result.wait();
      expect(true).to.eq(false);
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(code);
    }
  }

  static async createSDKClient(operatorId, operatorKey) {
    const network = Utils.getCurrentNetwork();

    const hederaNetwork = {};
    hederaNetwork[hre.config.networks[network].sdkClient.networkNodeUrl] = AccountId.fromString(hre.config.networks[network].sdkClient.nodeId);
    const { mirrorNode } = hre.config.networks[network].sdkClient;

    operatorId = operatorId || hre.config.networks[network].sdkClient.operatorId;
    operatorKey = operatorKey || hre.config.networks[network].sdkClient.operatorKey;

    const client = Client.forNetwork(hederaNetwork).setMirrorNetwork(mirrorNode);
    client.setOperator(operatorId, operatorKey);

    return client
  }

  static async getAccountId(evmAddress, client) {
    const query = new AccountInfoQuery()
      .setAccountId(AccountId.fromEvmAddress(0, 0, evmAddress));

    const accountInfo = await query.execute(client);
    return accountInfo.accountId.toString();
  }

  static getSignerCompressedPublicKey(index = 0, asBuffer = true, prune0x = true) {
    const wallet = new ethers.Wallet(hre.config.networks.relay.accounts[index]);
    const cpk = prune0x ? wallet._signingKey().compressedPublicKey.replace('0x', '') : wallet._signingKey().compressedPublicKey;

    return asBuffer ? Buffer.from(cpk, 'hex') : cpk;
  }

  static async getHardhatSignersPrivateKeys(add0xPrefix = true) {
    const network = Utils.getCurrentNetwork();
    return hre.config.networks[network].accounts.map(pk => add0xPrefix ? pk : pk.replace('0x', ''));
  }

  static async updateAccountKeysViaHapi(contractAddresses, ecdsaPrivateKeys = []) {
    const clientGenesis = await Utils.createSDKClient();
    ecdsaPrivateKeys = ecdsaPrivateKeys.length ? ecdsaPrivateKeys : await this.getHardhatSignersPrivateKeys(false);
    for (let i in ecdsaPrivateKeys) {
      const pkSigner = PrivateKey.fromStringECDSA(ecdsaPrivateKeys[i].replace('0x', ''));
      const accountId = await Utils.getAccountId(pkSigner.publicKey.toEvmAddress(), clientGenesis);
      const clientSigner = await Utils.createSDKClient(accountId, pkSigner);

      await (
        await (new AccountUpdateTransaction()
          .setAccountId(accountId)
          .setKey(new KeyList([
            pkSigner.publicKey,
            ...contractAddresses.map(address => ContractId.fromEvmAddress(0, 0, address))
          ], 1))
          .freezeWith(clientSigner)
        ).sign(pkSigner)
      ).execute(clientSigner);
    }
  }

  static async updateTokenKeysViaHapi(tokenAddress, contractAddresses, setAdmin = true, setPause = true, setKyc = true, setFreeze = true, setSupply = true, setWipe = true) {
    const signers = await ethers.getSigners();
    const clientGenesis = await Utils.createSDKClient();
    const pkSigners = (await Utils.getHardhatSignersPrivateKeys()).map(pk => PrivateKey.fromStringECDSA(pk));
    const accountIdSigner0 = await Utils.getAccountId(signers[0].address, clientGenesis);
    const clientSigner0 = await Utils.createSDKClient(accountIdSigner0, pkSigners[0]);

    const keyList = new KeyList([
      ...pkSigners.map(pk => pk.publicKey),
      ...contractAddresses.map(address => ContractId.fromEvmAddress(0, 0, address))
    ], 1);

    const tx = new TokenUpdateTransaction().setTokenId(TokenId.fromSolidityAddress(tokenAddress));
    if (setAdmin) tx.setAdminKey(keyList);
    if (setPause) tx.setPauseKey(keyList);
    if (setKyc) tx.setKycKey(keyList);
    if (setFreeze) tx.setFreezeKey(keyList);
    if (setSupply) tx.setSupplyKey(keyList);
    if (setWipe) tx.setWipeKey(keyList);

    await (
      await (
        tx.freezeWith(clientSigner0)
      ).sign(pkSigners[0])
    ).execute(clientSigner0);
  }

  static getCurrentNetwork() {
    return hre.network.name;
  }

  static async convertAccountIdToLongZeroAddress(accountId) {
    return (AccountId.fromString(accountId)).toSolidityAddress();
  }

  static async associateWithSigner(privateKey, tokenAddress) {
    const genesisClient = await this.createSDKClient();

    const wallet = new ethers.Wallet(privateKey);
    const accountIdAsString = await this.getAccountId(wallet.address, genesisClient);
    const signerPk = PrivateKey.fromStringECDSA(wallet._signingKey().privateKey);

    const signerClient = await this.createSDKClient(
      accountIdAsString,
      signerPk.toString() // DER encoded
    );

    const transaction = new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(accountIdAsString))
      .setTokenIds([TokenId.fromSolidityAddress(tokenAddress)])
      .freezeWith(signerClient);

    const signTx = await transaction.sign(signerPk);
    const txResponse = await signTx.execute(signerClient);
    await txResponse.getReceipt(signerClient);
  }
}

module.exports = Utils;

