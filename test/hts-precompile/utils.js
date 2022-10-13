const {ethers} = require("hardhat");

class Utils {
  static async deployTokenCreateContract() {
    const tokenCreateFactory = await ethers.getContractFactory("TokenCreateContract");
    const tokenCreate = await tokenCreateFactory.deploy({gasLimit: 1_000_000});
    const tokenCreateReceipt = await tokenCreate.deployTransaction.wait();

    return await ethers.getContractAt('TokenCreateContract', tokenCreateReceipt.contractAddress);
  }

  static async deployTokenManagementContract() {
    const tokenManagementFactory = await ethers.getContractFactory("TokenManagementContract");
    const tokenManagement = await tokenManagementFactory.deploy({gasLimit: 1_000_000});
    const tokenManagementReceipt = await tokenManagement.deployTransaction.wait();

    return await ethers.getContractAt('TokenManagementContract', tokenManagementReceipt.contractAddress);
  }

  static async deployERC20Contract() {
    const erc20ContractFactory = await ethers.getContractFactory("ERC20Contract");
    const erc20Contract = await erc20ContractFactory.deploy({gasLimit: 1_000_000});
    const erc20ContractReceipt = await erc20Contract.deployTransaction.wait();

    return await ethers.getContractAt('ERC20Contract', erc20ContractReceipt.contractAddress);
  }

  static async deployERC721Contract() {
    const erc721ContractFactory = await ethers.getContractFactory("ERC721Contract");
    const erc721Contract = await erc721ContractFactory.deploy({gasLimit: 1_000_000});
    const erc721ContractReceipt = await erc721Contract.deployTransaction.wait();

    return await ethers.getContractAt('ERC721Contract', erc721ContractReceipt.contractAddress);
  }

  static async createFungibleToken(contract) {
    const tokenAddressTx = await contract.createFungibleTokenPublic(contract.address, {
      value: ethers.BigNumber.from('10000000000000000000'),
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(e => e.event === 'CreatedToken')[0].args;

    return tokenAddress;
  }

  static async createNonFungibleToken(contract) {
    const tokenAddressTx = await contract.createNonFungibleTokenPublic(contract.address, {
      value: ethers.BigNumber.from('10000000000000000000'),
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(e => e.event === 'CreatedToken')[0].args;

    return tokenAddress;
  }

  static async mintNFT(contract, nftTokenAddress) {
    const mintNftTx = await contract.mintTokenPublic(nftTokenAddress, 0, ["0x01"], {
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await mintNftTx.wait();
    const {serialNumbers} = tokenAddressReceipt.events.filter(e => e.event === 'MintedToken')[0].args;

    return parseInt(serialNumbers);
  }

  static async associateToken(contract, tokenAddress, contractName) {
    const signers = await ethers.getSigners();
    const associateTx1 = await ethers.getContractAt(contractName, contract.address, signers[0]);
    const associateTx2 = await ethers.getContractAt(contractName, contract.address, signers[1]);

    await contract.associateTokenPublic(contract.address, tokenAddress, {gasLimit: 1_000_000});
    await associateTx1.associateTokenPublic(signers[0].address, tokenAddress, {gasLimit: 1_000_000});
    await associateTx2.associateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
  }

  static async grantTokenKyc(contract, tokenAddress) {
    const signers = await ethers.getSigners();
    await contract.grantTokenKyc(tokenAddress, contract.address);
    await contract.grantTokenKyc(tokenAddress, signers[0].address);
    await contract.grantTokenKyc(tokenAddress, signers[1].address);
  }
}

module.exports = Utils;
