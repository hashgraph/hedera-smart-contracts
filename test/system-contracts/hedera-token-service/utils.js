// SPDX-License-Identifier: Apache-2.0

const hre = require('hardhat');
const { ethers } = hre;
const { expect } = require('chai');
const {
  AccountId,
  Client,
  AccountInfoQuery,
  AccountUpdateTransaction,
  ContractId,
  KeyList,
  PrivateKey,
  TokenId,
  TokenUpdateTransaction,
  TokenAssociateTransaction,
  AccountBalanceQuery,
  ContractInfoQuery,
  AccountDeleteTransaction,
} = require('@hashgraph/sdk');
const Constants = require('../../constants');
const axios = require('axios');
const {
  getMirrorNodeUrl,
} = require('../native/evm-compatibility-ecrecover/utils');

class Utils {
  static createTokenCost = '50000000000000000000';
  static createTokenCustomFeesCost = '60000000000000000000';
  static tinybarToWeibarCoef = 10_000_000_000;
  static tinybarToHbarCoef = 100_000_000;
  static initialSupply = 1000000000000;
  static maxSupply = 2000000000000;
  static nftMaxSupply = 20000;

  static KeyType = {
    ADMIN: 1,
    KYC: 2,
    FREEZE: 4,
    WIPE: 8,
    SUPPLY: 16,
    FEE: 32,
    PAUSE: 64,
  };

  static KeyValueType = {
    INHERIT_ACCOUNT_KEY: 0,
    CONTRACT_ID: 1,
    ED25519: 2,
    SECP256K1: 3,
    DELEGETABLE_CONTRACT_ID: 4,
  };

  static async deployContract(
    contractPath,
    gasLimit = Constants.GAS_LIMIT_1_000_000
  ) {
    const factory = await ethers.getContractFactory(contractPath);
    const contract = await factory.deploy(gasLimit);

    return await ethers.getContractAt(
      contractPath,
      await contract.getAddress()
    );
  }

  static async deployERC20Mock() {
    return this.deployContract(Constants.Path.HIP583_ERC20Mock);
  }

  static async deployERC721Mock() {
    return this.deployContract(Constants.Path.HIP583_ERC721Mock);
  }

  static async deployTokenCreateContract() {
    return this.deployContract(Constants.Contract.TokenCreateContract);
  }

  static async deployTokenCreateCustomContract() {
    return this.deployContract(Constants.Contract.TokenCreateCustomContract);
  }

  static async deployTokenManagementContract() {
    return this.deployContract(Constants.Contract.TokenManagementContract);
  }

  static async deployTokenQueryContract() {
    return this.deployContract(Constants.Contract.TokenQueryContract);
  }

  static async deployTokenTransferContract() {
    return this.deployContract(Constants.Contract.TokenTransferContract);
  }

  static async deployHRC719Contract() {
    return this.deployContract(Constants.Contract.HRC719Contract);
  }

  static async deployERC20Contract() {
    return this.deployContract(Constants.Contract.ERC20Contract);
  }

  static async deployERC721Contract() {
    return this.deployContract(Constants.Contract.ERC721Contract);
  }

  static async getTokenAddress(tx) {
    const receipt = await tx.wait();
    const { tokenAddress } = receipt.logs.find(
      (e) => e.fragment.name === Constants.Events.CreatedToken
    )[0].args;

    return tokenAddress;
  }

  static async createFungibleToken(contract, treasury) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenPublic(treasury, {
        value: BigInt(this.createTokenCost),
        gasLimit: 1_000_000,
      })
    );
  }

  static async createFungibleTokenWithPresetKeysPublic(
    contract,
    name,
    symbol,
    memo,
    initialSupply,
    maxSupply,
    decimals,
    freezeDefaultStatus,
    treasury
  ) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithPresetKeys(
        name,
        symbol,
        memo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        treasury,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        }
      )
    );
  }

  static async createFungibleTokenPublic(
    tokenName,
    tokenSymbol,
    tokenMemo,
    initialSupply,
    maxSupply,
    decimals,
    freezeDefaultStatus,
    signerAddress,
    keys,
    contract
  ) {
    const tokenAddress = (
      await (
        await contract.createFungibleTokenPublic(
          tokenName,
          tokenSymbol,
          tokenMemo,
          initialSupply,
          maxSupply,
          decimals,
          freezeDefaultStatus,
          signerAddress,
          keys,
          {
            value: '35000000000000000000',
            gasLimit: 1_000_000,
          }
        )
      ).wait()
    ).logs.filter((e) => e.fragment.name === Constants.Events.CreatedToken)[0]
      .args.tokenAddress;

    return tokenAddress;
  }

  static async createFungibleTokenWithSECP256K1AdminKey(
    contract,
    treasury,
    adminKey
  ) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithSECP256K1AdminKeyPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        }
      )
    );
  }

  static async createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
    contract,
    treasury,
    adminKey
  ) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithSECP256K1AdminKeyWithoutKYCPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        }
      )
    );
  }

  static async createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddress(
    contract,
    treasury,
    adminKey,
    initialBalance = 300
  ) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddressPublic(
        treasury,
        adminKey,
        initialBalance,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        }
      )
    );
  }

  static async createFungibleTokenWithCustomFees(contract, feeTokenAddress) {
    return await this.getTokenAddress(
      await contract.createFungibleTokenWithCustomFeesPublic(
        await contract.getAddress(),
        feeTokenAddress,
        {
          value: BigInt(this.createTokenCustomFeesCost),
          gasLimit: 10_000_000,
        }
      )
    );
  }

  // Helper function to associate and grant KYC
  static async associateAndGrantKyc(contract, token, addresses) {
    for (const address of addresses) {
      const associateTx = await contract.associateTokenPublic(address, token);
      await associateTx.wait(); // Ensure the association is completed before proceeding

      const grantKycTx = await contract.grantTokenKycPublic(token, address);
      await grantKycTx.wait(); // Ensure the KYC grant is completed before proceeding
    }
  }

  static async createFungibleTokenWithCustomFeesAndKeys(
    contract,
    treasury,
    fixedFees,
    fractionalFees,
    keys
  ) {
    const updateFeesTx = await contract.createFungibleTokenWithCustomFeesPublic(
      treasury,
      'Hedera Token Fees',
      'HTF',
      'Hedera Token With Fees',
      this.initialSupply,
      this.maxSupply,
      0,
      fixedFees,
      fractionalFees,
      keys,
      {
        value: BigInt(this.createTokenCost),
        gasLimit: 1_000_000,
      }
    );
    return await this.getTokenAddress(updateFeesTx);
  }

  static async createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
    contract,
    treasury,
    fixedFees,
    royaltyFees,
    keys
  ) {
    return await this.getTokenAddress(
      await contract.createNonFungibleTokenWithCustomFeesPublic(
        treasury,
        'Non Fungible Token With Custom Fees',
        'NFTF',
        'Non Fungible Token With Custom Fees',
        this.nftMaxSupply,
        fixedFees,
        royaltyFees,
        keys,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        }
      )
    );
  }

  static async createNonFungibleToken(contract, treasury) {
    const tokenAddressTx = await contract.createNonFungibleTokenPublic(
      treasury,
      {
        value: BigInt(this.createTokenCost),
        gasLimit: 1_000_000,
      }
    );
    return await this.getTokenAddress(tokenAddressTx);
  }

  static async createNonFungibleTokenWithSECP256K1AdminKey(
    contract,
    treasury,
    adminKey
  ) {
    return await this.getTokenAddress(
      await contract.createNonFungibleTokenWithSECP256K1AdminKeyPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        }
      )
    );
  }

  static async createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
    contract,
    treasury,
    adminKey
  ) {
    return await this.getTokenAddress(
      await contract.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYCPublic(
        treasury,
        adminKey,
        {
          value: BigInt(this.createTokenCost),
          gasLimit: 1_000_000,
        }
      )
    );
  }

  static hexToASCII(str) {
    const hex = str.toString();
    let ascii = '';
    for (let n = 0; n < hex.length; n += 2) {
      ascii += String.fromCharCode(parseInt(hex.substring(n, n + 2), 16));
    }
    return ascii;
  }

  /**
   * Converts an EVM ErrorMessage to a readable form. For example this :
   * 0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000d53657420746f2072657665727400000000000000000000000000000000000000
   * will be converted to "Set to revert"
   * @param message
   */
  static decodeErrorMessage(message) {
    const EMPTY_HEX = '0x';
    if (!message) return '';

    // If the message does not start with 0x, it is not an error message, return it as is
    if (!message.includes(EMPTY_HEX)) return message;

    message = message.replace(/^0x/, ''); // Remove the starting 0x
    const strLen = parseInt(message.slice(8 + 64, 8 + 128), 16); // Get the length of the readable text
    const resultCodeHex = message.slice(8 + 128, 8 + 128 + strLen * 2); // Extract the hex of the text
    return this.hexToASCII(resultCodeHex);
  }

  static async getRevertReasonFromReceipt(hash) {
    const receipt = await ethers.provider.send('eth_getTransactionReceipt', [
      hash,
    ]);

    return receipt.revertReason;
  }

  static async getHbarBalance(address) {
    const balanceJson = (await this.getAccountBalance(address)).toJSON();
    const balanceFloat = parseFloat(balanceJson.hbars);

    return balanceFloat;
  }

  static async getTokenBalance(accountAddress, tokenAddress) {
    const accountBalanceJson = (
      await this.getAccountBalance(accountAddress)
    ).toJSON();
    const tokenId = await AccountId.fromEvmAddress(
      0,
      0,
      tokenAddress
    ).toString();
    const balance = accountBalanceJson.tokens.find(
      (e) => e.tokenId === tokenId
    );

    return parseInt(balance.balance);
  }

  static async updateFungibleTokenCustomFees(
    contract,
    token,
    treasury,
    feeToken,
    feeAmount
  ) {
    const updateFees = await contract.updateFungibleTokenCustomFeesPublic(
      token,
      treasury,
      feeToken,
      feeAmount
    );
    const receipt = await updateFees.wait();
  }

  static async getSerialNumbers(mintNftTx) {
    const tokenAddressReceipt = await mintNftTx.wait();
    const { serialNumbers } = tokenAddressReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.MintedToken
    )[0].args;

    return parseInt(serialNumbers);
  }

  static async mintNFT(contract, nftTokenAddress, data = ['0x01']) {
    const mintNftTx = await contract.mintTokenPublic(
      nftTokenAddress,
      0,
      data,
      Constants.GAS_LIMIT_1_000_000
    );

    return await this.getSerialNumbers(mintNftTx);
  }

  static async mintNFTToAddress(contract, nftTokenAddress, data = ['0x01']) {
    const mintNftTx = await contract.mintTokenToAddressPublic(
      nftTokenAddress,
      0,
      data,
      Constants.GAS_LIMIT_1_000_000
    );

    return await this.getSerialNumbers(mintNftTx);
  }

  // Add Token association via hedera.js sdk
  // Client with signer - my private key example

  static async associateToken(contract, tokenAddress, contractName) {
    const signers = await ethers.getSigners();
    const associateTx1 = await ethers.getContractAt(
      contractName,
      await contract.getAddress(),
      signers[0]
    );
    const associateTx2 = await ethers.getContractAt(
      contractName,
      await contract.getAddress(),
      signers[1]
    );

    const associateTx3 = await ethers.getContractAt(
      contractName,
      await contract.getAddress(),
      signers[2]
    );

    await contract.associateTokenPublic(
      await contract.getAddress(),
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    await associateTx1.associateTokenPublic(
      signers[0].address,
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    await associateTx2.associateTokenPublic(
      signers[1].address,
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    await associateTx3.associateTokenPublic(
      signers[2].address,
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
  }

  static async grantTokenKyc(contract, tokenAddress) {
    const signers = await ethers.getSigners();
    await contract.grantTokenKycPublic(
      tokenAddress,
      await contract.getAddress()
    );
    await contract.grantTokenKycPublic(tokenAddress, signers[0].address);
    await contract.grantTokenKycPublic(tokenAddress, signers[1].address);
  }

  static async expectToFail(transaction, code = null) {
    try {
      const result = await transaction;
      await result.wait();
      expect(true).to.eq(false);
    } catch (e) {
      expect(e).to.exist;
      if (code) {
        expect(e.code).to.eq(code);
      }
    }
  }

  static async createSDKClient(operatorId, operatorKey) {
    const network = Utils.getCurrentNetwork();

    const hederaNetwork = {};
    hederaNetwork[hre.config.networks[network].sdkClient.networkNodeUrl] =
      AccountId.fromString(hre.config.networks[network].sdkClient.nodeId);
    const { mirrorNode } = hre.config.networks[network].sdkClient;

    operatorId =
      operatorId || hre.config.networks[network].sdkClient.operatorId;
    operatorKey =
      operatorKey || hre.config.networks[network].sdkClient.operatorKey;

    const client = Client.forNetwork(hederaNetwork)
      .setMirrorNetwork(mirrorNode)
      .setOperator(operatorId, operatorKey);

    return client;
  }

  static async getAccountId(evmAddress, client) {
    const query = new AccountInfoQuery().setAccountId(
      AccountId.fromEvmAddress(0, 0, evmAddress)
    );

    const accountInfo = await query.execute(client);
    return accountInfo.accountId.toString();
  }

  static async getAccountInfo(evmAddress, client) {
    const query = new AccountInfoQuery().setAccountId(
      AccountId.fromEvmAddress(0, 0, evmAddress)
    );

    return await query.execute(client);
  }

  static async getContractInfo(evmAddress, client) {
    const query = new ContractInfoQuery().setContractId(
      ContractId.fromEvmAddress(0, 0, evmAddress)
    );

    return await query.execute(client);
  }

  static async deleteAccount(account, signer, accountId) {
    const accountDeleteTransaction = await new AccountDeleteTransaction()
      .setAccountId(accountId)
      .setTransferAccountId(signer.getOperator().accountId)
      .freezeWith(signer)
      .sign(PrivateKey.fromStringECDSA(account.signingKey.privateKey));

    await accountDeleteTransaction.execute(signer);
  }

  static getSignerCompressedPublicKey(
    index = 0,
    asBuffer = true,
    prune0x = true
  ) {
    const wallet = new ethers.Wallet(
      hre.config.networks[hre.network.name].accounts[index]
    );
    const cpk = prune0x
      ? wallet.signingKey.compressedPublicKey.replace('0x', '')
      : wallet.signingKey.compressedPublicKey;

    return asBuffer ? Buffer.from(cpk, 'hex') : cpk;
  }

  static async getHardhatSignersPrivateKeys(add0xPrefix = true) {
    const network = Utils.getCurrentNetwork();
    return hre.config.networks[network].accounts.map((pk) =>
      add0xPrefix ? pk : pk.replace('0x', '')
    );
  }

  static getHardhatSignerPrivateKeyByIndex(index = 0) {
    return hre.config.networks[hre.network.name].accounts[index];
  }

  static async updateAccountKeysViaHapi(
    contractAddresses,
    ecdsaPrivateKeys = []
  ) {
    const clientGenesis = await Utils.createSDKClient();
    if (!ecdsaPrivateKeys.length) {
      ecdsaPrivateKeys = await this.getHardhatSignersPrivateKeys(false);
    }

    for (const privateKey of ecdsaPrivateKeys) {
      const pkSigner = PrivateKey.fromStringECDSA(privateKey.replace('0x', ''));
      const accountId = await Utils.getAccountId(
        pkSigner.publicKey.toEvmAddress(),
        clientGenesis
      );
      const clientSigner = await Utils.createSDKClient(accountId, pkSigner);

      const keyList = new KeyList(
        [
          pkSigner.publicKey,
          ...contractAddresses.map((address) =>
            ContractId.fromEvmAddress(0, 0, address)
          ),
        ],
        1
      );

      await (
        await new AccountUpdateTransaction()
          .setAccountId(accountId)
          .setKey(keyList)
          .freezeWith(clientSigner)
          .sign(pkSigner)
      ).execute(clientSigner);
    }
  }

  static async getAccountBalance(address) {
    const client = await Utils.createSDKClient();
    const accountId = await Utils.getAccountId(address, client);
    const tokenBalance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    return tokenBalance;
  }

  static async updateTokenKeysViaHapi(
    tokenAddress,
    contractAddresses,
    setAdmin = true,
    setPause = true,
    setKyc = true,
    setFreeze = true,
    setSupply = true,
    setWipe = true,
    setFeeSchedule = true
  ) {
    const signers = await ethers.getSigners();
    const clientGenesis = await Utils.createSDKClient();
    const pkSigners = (await Utils.getHardhatSignersPrivateKeys()).map((pk) =>
      PrivateKey.fromStringECDSA(pk)
    );
    const accountIdSigner0 = await Utils.getAccountId(
      signers[0].address,
      clientGenesis
    );
    const clientSigner0 = await Utils.createSDKClient(
      accountIdSigner0,
      pkSigners[0]
    );

    const keyList = new KeyList(
      [
        ...pkSigners.map((pk) => pk.publicKey),
        ...contractAddresses.map((address) =>
          ContractId.fromEvmAddress(0, 0, address)
        ),
      ],
      1
    );

    const tx = new TokenUpdateTransaction().setTokenId(
      TokenId.fromSolidityAddress(tokenAddress)
    );
    if (setAdmin) tx.setAdminKey(keyList);
    if (setPause) tx.setPauseKey(keyList);
    if (setKyc) tx.setKycKey(keyList);
    if (setFreeze) tx.setFreezeKey(keyList);
    if (setSupply) tx.setSupplyKey(keyList);
    if (setWipe) tx.setWipeKey(keyList);
    if (setFeeSchedule) tx.setFeeScheduleKey(keyList);

    await (
      await tx.freezeWith(clientSigner0).sign(pkSigners[0])
    ).execute(clientSigner0);
  }

  static getCurrentNetwork() {
    return hre.network.name;
  }

  static convertAccountIdToLongZeroAddress(accountId, prepend0x = false) {
    const address = AccountId.fromString(accountId).toSolidityAddress();

    return prepend0x ? '0x' + address : address;
  }

  static async associateWithSigner(privateKey, tokenAddress) {
    const genesisClient = await this.createSDKClient();

    const wallet = new ethers.Wallet(privateKey);
    const accountIdAsString = await this.getAccountId(
      wallet.address,
      genesisClient
    );
    const signerPk = PrivateKey.fromStringECDSA(wallet.signingKey.privateKey);

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

  static defaultKeyValues = {
    inheritAccountKey: false,
    contractId: ethers.ZeroAddress,
    ed25519: Buffer.from('', 'hex'),
    ECDSA_secp256k1: Buffer.from('', 'hex'),
    delegatableContractId: ethers.ZeroAddress,
  };

  /**
   * @dev Constructs a key conforming to the IHederaTokenService.TokenKey type
   *
   * @param keyType ADMIN | KYC | FREEZE | WIPE | SUPPLY | FEE | PAUSE
   *                See https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/system-contracts/hedera-token-service/IHederaTokenService.sol#L128
   *                for more information
   *
   * @param keyValueType INHERIT_ACCOUNT_KEY | CONTRACT_ID | ED25519 | SECP256K1 | DELEGETABLE_CONTRACT_ID
   *
   * @param value bytes value, public address of an account, or boolean
   *            See https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/system-contracts/hedera-token-service/IHederaTokenService.sol#L92
   *                     for more information
   */
  static constructIHederaTokenKey(keyType, keyValueType, value) {
    // sanitize params
    if (
      keyType !== 'ADMIN' &&
      keyType !== 'KYC' &&
      keyType !== 'FREEZE' &&
      keyType !== 'WIPE' &&
      keyType !== 'SUPPLY' &&
      keyType !== 'FEE' &&
      keyType !== 'PAUSE'
    ) {
      return;
    }

    switch (keyValueType) {
      case 'INHERIT_ACCOUNT_KEY':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, inheritAccountKey: value },
        };
      case 'CONTRACT_ID':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, contractId: value },
        };
      case 'ED25519':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, ed25519: value },
        };
      case 'SECP256K1':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, ECDSA_secp256k1: value },
        };
      case 'DELEGETABLE_CONTRACT_ID':
        return {
          keyType: this.KeyType[keyType],
          key: { ...this.defaultKeyValues, delegatableContractId: value },
        };
      default:
        return;
    }
  }

  /**
   * This method fetches the transaction actions from the mirror node corresponding to the current network,
   * filters the actions to find the one directed to the Hedera Token Service (HTS) system contract,
   * and extracts the result data from the precompile action. The result data is converted from a BigInt
   * to a string before being returned.
   *
   * @param {string} txHash - The transaction hash to query.
   * @returns {string} - The response code as a string.
   */
  static async getHTSResponseCode(txHash) {
    const network = hre.network.name;
    const mirrorNodeUrl = getMirrorNodeUrl(network);
    const res = await axios.get(
      `${mirrorNodeUrl}/contracts/results/${txHash}/actions`
    );
    const precompileAction = res.data.actions.find(
      (x) => x.recipient === Constants.HTS_SYSTEM_CONTRACT_ID
    );
    return BigInt(precompileAction.result_data).toString();
  }

  /**
   * This method fetches the transaction actions from the mirror node corresponding to the current network,
   * filters the actions to find the one directed to the Hedera Account Service (HAS) system contract,
   * and extracts the result data from the precompile action. The result data is converted from a BigInt
   * to a string before being returned.
   *
   * @param {string} txHash - The transaction hash to query.
   * @returns {string} - The response code as a string.
   */
  static async getHASResponseCode(txHash) {
    const network = hre.network.name;
    const mirrorNodeUrl = getMirrorNodeUrl(network);
    const res = await axios.get(
      `${mirrorNodeUrl}/contracts/results/${txHash}/actions`
    );
    const precompileAction = res.data.actions.find(
      (x) => x.recipient === Constants.HAS_SYSTEM_CONTRACT_ID
    );
    return BigInt(precompileAction.result_data).toString();
  }

  static async setupNft(tokenCreateContract, owner, contractAddresses) {
    const nftTokenAddress =
      await this.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        this.getSignerCompressedPublicKey()
      );

    await this.updateTokenKeysViaHapi(
      nftTokenAddress,
      contractAddresses,
      true,
      true,
      false,
      true,
      true,
      true,
      false
    );

    await this.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    );

    return nftTokenAddress;
  }

  static async setupToken(tokenCreateContract, owner, contractAddresses) {
    const tokenAddress =
      await this.createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        this.getSignerCompressedPublicKey()
      );

    await this.updateTokenKeysViaHapi(
      tokenAddress,
      contractAddresses,
      true,
      true,
      false,
      true,
      true,
      true,
      false
    );

    await this.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );

    return tokenAddress;
  }

  /**
   * Creates multiple pending airdrops for testing purposes
   * @param {Contract} airdropContract - The airdrop contract instance
   * @param {string} owner - The owner's address
   * @param {Contract} tokenCreateContract - The token create contract instance
   * @param {number} count - Number of pending airdrops to create
   * @returns {Object} Object containing arrays of senders, receivers, tokens, serials, and amounts
   */
  static async createPendingAirdrops(
    count,
    tokenCreateContract,
    owner,
    airdropContract,
    receiver
  ) {
    const senders = [];
    const receivers = [];
    const tokens = [];
    const serials = [];
    const amounts = [];

    for (let i = 0; i < count; i++) {
      const tokenAddress = await this.setupToken(tokenCreateContract, owner, [
        await airdropContract.getAddress(),
      ]);
      const ftAmount = BigInt(i + 1); // Different amount for each airdrop

      const airdropTx = await airdropContract.tokenAirdrop(
        tokenAddress,
        owner,
        receiver,
        ftAmount,
        {
          value: Constants.ONE_HBAR,
          gasLimit: 2_000_000,
        }
      );
      await airdropTx.wait();

      senders.push(owner);
      receivers.push(receiver);
      tokens.push(tokenAddress);
      serials.push(0); // 0 for fungible tokens
      amounts.push(ftAmount);
    }

    return { senders, receivers, tokens, serials, amounts };
  }

  /**
   * Retrieves the maximum number of automatic token associations for an account from the mirror node
   * @param {string} evmAddress - The EVM address of the account to query
   * @returns {Promise<number>} Returns:
   *  - -1 if unlimited automatic associations are enabled
   *  - 0 if automatic associations are disabled
   *  - positive number for the maximum number of automatic associations allowed
   * @throws {Error} If there was an error fetching the data from mirror node
   */
  static async getMaxAutomaticTokenAssociations(evmAddress) {
    const network = hre.network.name;
    const mirrorNodeUrl = getMirrorNodeUrl(network);
    const response = await axios.get(`${mirrorNodeUrl}/accounts/${evmAddress}`);
    return response.data.max_automatic_token_associations;
  }

  static decimalToAscii(decimalStr) {
    const hex = BigInt(decimalStr).toString(16);
    return Buffer.from(hex, 'hex').toString('ascii');
  }
}

module.exports = Utils;
