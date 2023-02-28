const { ethers } = require("hardhat");
const { expect } = require("chai");
const { LocalProvider, Wallet, AccountId, Client, AccountInfoQuery } = require("@hashgraph/sdk");

class Utils {
  //createTokenCost is cost for creating the token, which is passed to the precompile. This is equivalent of 10 and 20hbars, any excess hbars are refunded.
  static createTokenCost = "10000000000000000000";
  static createTokenCustomFeesCost = "20000000000000000000";
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
    const erc20MockFactory = await ethers.getContractFactory("contracts/hip-583/ERC20Mock.sol:ERC20Mock");
    const erc20Mock = await erc20MockFactory.deploy({gasLimit: 1_000_000});
    const erc20MockReceipt = await erc20Mock.deployTransaction.wait();

    return await ethers.getContractAt("contracts/hip-583/ERC20Mock.sol:ERC20Mock", erc20MockReceipt.contractAddress);
  }

  static async deployERC721Mock() {
    const erc721MockFactory = await ethers.getContractFactory("contracts/hip-583/ERC721Mock.sol:ERC721Mock");
    const erc721Mock = await erc721MockFactory.deploy({gasLimit: 1_000_000});
    const erc721MockReceipt = await erc721Mock.deployTransaction.wait();

    return await ethers.getContractAt("contracts/hip-583/ERC721Mock.sol:ERC721Mock", erc721MockReceipt.contractAddress);
  }

  static async deployTokenCreateContract() {
    const tokenCreateFactory = await ethers.getContractFactory(
      "TokenCreateContract"
    );
    const tokenCreate = await tokenCreateFactory.deploy({
      gasLimit: 1_000_000,
    });
    const tokenCreateReceipt = await tokenCreate.deployTransaction.wait();

    return await ethers.getContractAt(
      "TokenCreateContract",
      tokenCreateReceipt.contractAddress
    );
  }

  static async deployTokenCreateCustomContract() {
    const tokenCreateCustomFactory = await ethers.getContractFactory(
      "TokenCreateCustomContract"
    );
    const tokenCreateCustom = await tokenCreateCustomFactory.deploy({
      gasLimit: 1_000_000,
    });
    const tokenCreateCustomReceipt = await tokenCreateCustom.deployTransaction.wait();

    return await ethers.getContractAt(
      "TokenCreateCustomContract",
      tokenCreateCustomReceipt.contractAddress
    );
  }

  static async deployTokenManagementContract() {
    const tokenManagementFactory = await ethers.getContractFactory(
      "TokenManagementContract"
    );
    const tokenManagement = await tokenManagementFactory.deploy({
      gasLimit: 1_000_000,
    });
    const tokenManagementReceipt =
      await tokenManagement.deployTransaction.wait();

    return await ethers.getContractAt(
      "TokenManagementContract",
      tokenManagementReceipt.contractAddress
    );
  }

  static async deployTokenQueryContract() {
    const tokenQueryFactory = await ethers.getContractFactory(
      "TokenQueryContract"
    );
    const tokenQuery = await tokenQueryFactory.deploy({ gasLimit: 1_000_000 });
    const tokenQueryReceipt = await tokenQuery.deployTransaction.wait();

    return await ethers.getContractAt(
      "TokenQueryContract",
      tokenQueryReceipt.contractAddress
    );
  }

  static async deployTokenTransferContract() {
    const tokenTransferFactory = await ethers.getContractFactory(
      "TokenTransferContract"
    );
    const tokenTransfer = await tokenTransferFactory.deploy({
      gasLimit: 1_000_000,
    });
    const tokenTransferReceipt = await tokenTransfer.deployTransaction.wait();

    return await ethers.getContractAt(
      "TokenTransferContract",
      tokenTransferReceipt.contractAddress
    );
  }

  static async deployERC20Contract() {
    const erc20ContractFactory = await ethers.getContractFactory(
      "ERC20Contract"
    );
    const erc20Contract = await erc20ContractFactory.deploy({
      gasLimit: 1_000_000,
    });
    const erc20ContractReceipt = await erc20Contract.deployTransaction.wait();

    return await ethers.getContractAt(
      "ERC20Contract",
      erc20ContractReceipt.contractAddress
    );
  }

  static async deployERC721Contract() {
    const erc721ContractFactory = await ethers.getContractFactory(
      "ERC721Contract"
    );
    const erc721Contract = await erc721ContractFactory.deploy({
      gasLimit: 1_000_000,
    });
    const erc721ContractReceipt = await erc721Contract.deployTransaction.wait();

    return await ethers.getContractAt(
      "ERC721Contract",
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
      (e) => e.event === "CreatedToken"
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
      (e) => e.event === "CreatedToken"
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
      (e) => e.event === "CreatedToken"
    )[0].args;

    return tokenAddress;
  }

  static async createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddress(contract, treasury, adminKey, initialBalance = 300) {
    const tokenAddressTx = await contract.createFungibleTokenWithSECP256K1AdminKeyAssociateAndTransferToAddressPublic(treasury, adminKey, initialBalance, {
      value: ethers.BigNumber.from(this.createTokenCost),
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(
        (e) => e.event === "CreatedToken"
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
      (e) => e.event === "CreatedToken"
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
      (e) => e.event === "CreatedToken"
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
      (e) => e.event === "CreatedToken"
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
      (e) => e.event === "CreatedToken"
    )[0].args;

    return tokenAddress;
  }

  static async mintNFT(contract, nftTokenAddress, data = ["0x01"]) {
    const mintNftTx = await contract.mintTokenPublic(nftTokenAddress, 0, data, {
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await mintNftTx.wait();
    const { serialNumbers } = tokenAddressReceipt.events.filter(
      (e) => e.event === "MintedToken"
    )[0].args;

    return parseInt(serialNumbers);
  }

  static async mintNFTToAddress(contract, nftTokenAddress, data = ["0x01"]) {
    const mintNftTx = await contract.mintTokenToAddressPublic(nftTokenAddress, 0, data, {
      gasLimit: 1_000_000,
    });
    const tokenAddressReceipt = await mintNftTx.wait();
    const { serialNumbers } = tokenAddressReceipt.events.filter(
        (e) => e.event === "MintedToken"
    )[0].args;

    return parseInt(serialNumbers);
  }

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

    await contract.associateTokenPublic(contract.address, tokenAddress, {
      gasLimit: 1_000_000,
    });
    await associateTx1.associateTokenPublic(signers[0].address, tokenAddress, {
      gasLimit: 1_000_000,
    });
    await associateTx2.associateTokenPublic(signers[1].address, tokenAddress, {
      gasLimit: 1_000_000,
    });
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

  static async createLocalSDKClient(operatorId, operatorKey, hederaNetwork = { "127.0.0.1:50211": new AccountId(3) }, mirrorNode = "127.0.0.1:5600") {
    const client = Client.forNetwork(hederaNetwork).setMirrorNetwork(mirrorNode);
    client.setOperator(operatorId, operatorKey);

    return client
  }

  static async getAccountId(evmAddress, client) {
    const query = new AccountInfoQuery()
    .setAccountId(AccountId.fromEvmAddress(0,0,evmAddress));

    const accountInfo = await query.execute(client);
    return accountInfo.accountId.toString();
  }

  static getSignerCompressedPublicKey(index = 0, asBuffer = true, prune0x = true) {
    const wallet = new ethers.Wallet(hre.config.networks.relay.accounts[index]);
    const cpk = prune0x ? wallet._signingKey().compressedPublicKey.replace('0x', '') : wallet._signingKey().compressedPublicKey;

    return asBuffer ? Buffer.from(cpk, 'hex') : cpk;
  }
}

module.exports = Utils;
