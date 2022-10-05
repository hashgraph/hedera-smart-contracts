const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("ERC721Contract tests", function () {
  let tokenCreateContract;
  let tokenAddress;
  let erc721Contract;
  let mintedTokenSerialNumber;
  let nftInitialOwnerAddress;

  before(async function () {
    tokenCreateContract = await utils.deployTokenCreateContract();
    erc721Contract = await deployERC721Contract();
    tokenAddress = await createNonFungibleToken();
    mintedTokenSerialNumber = await mintNFT();
    await associateToken();
  });

  async function deployERC721Contract() {
    const erc721ContractFactory = await ethers.getContractFactory("ERC721Contract");
    const erc721Contract = await erc721ContractFactory.deploy({gasLimit: 1_000_000});
    const erc721ContractReceipt = await erc721Contract.deployTransaction.wait();

    return await ethers.getContractAt('ERC721Contract', erc721ContractReceipt.contractAddress);
  }

  async function createNonFungibleToken() {
    const tokenAddressTx = await tokenCreateContract.createNonFungibleTokenPublic(tokenCreateContract.address, {
      value: ethers.BigNumber.from('10000000000000000000'),
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(e => e.event === 'CreatedToken')[0].args;

    return tokenAddress;
  }

  async function mintNFT() {
    const mintNftTx = await tokenCreateContract.mintTokenPublic(tokenAddress, 0, ["0x01"], {
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await mintNftTx.wait();
    const {serialNumbers} = tokenAddressReceipt.events.filter(e => e.event === 'MintedToken')[0].args;

    return parseInt(serialNumbers);
  }

  async function associateToken() {
    const signers = await ethers.getSigners();
    const associateTx1 = await ethers.getContractAt('TokenCreateContract', tokenCreateContract.address, signers[0]);
    const associateTx2 = await ethers.getContractAt('TokenCreateContract', tokenCreateContract.address, signers[1]);

    await tokenCreateContract.associateTokenPublic(erc721Contract.address, tokenAddress, {gasLimit: 1_000_000});
    await associateTx1.associateTokenPublic(signers[0].address, tokenAddress, {gasLimit: 1_000_000});
    await associateTx2.associateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});

    await tokenCreateContract.grantTokenKyc(tokenAddress, tokenCreateContract.address);
    await tokenCreateContract.grantTokenKyc(tokenAddress, erc721Contract.address);
    await tokenCreateContract.grantTokenKyc(tokenAddress, signers[0].address);
    await tokenCreateContract.grantTokenKyc(tokenAddress, signers[1].address);

    await tokenCreateContract.transferNFTPublic(tokenAddress, tokenCreateContract.address, signers[0].address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    nftInitialOwnerAddress = signers[0].address;
  }

  it("should be able to get token name", async function () {
    const name = await erc721Contract.name(tokenAddress);
    expect(name).to.equal('tokenName');
  });

  it("should be able to get token symbol", async function () {
    const symbol = await erc721Contract.symbol(tokenAddress);
    expect(symbol).to.equal('tokenSymbol');
  });

  it("should be able to get token totalSupply", async function () {
    const totalSupply = await erc721Contract.totalSupply(tokenAddress);
    expect(totalSupply).to.equal(1);
  });

  it("should be able to get token uri via tokenURI", async function () {
    const tokenURI = await erc721Contract.tokenURI(tokenAddress, mintedTokenSerialNumber);
    expect(tokenURI).to.equal('\u0001');
  });

  it("should be able to execute ownerOf", async function () {
    const owner = await erc721Contract.ownerOf(tokenAddress, mintedTokenSerialNumber);
    expect(owner).to.equal(nftInitialOwnerAddress);
  });

  it("should be able to execute balanceOf", async function () {
    const balance = await erc721Contract.balanceOf(tokenAddress, nftInitialOwnerAddress);
    expect(balance).to.equal(1);
  });

  it("should be able to execute getApproved", async function () {
    const approved = await erc721Contract.getApproved(tokenAddress, mintedTokenSerialNumber);
    expect(approved).to.equal('0x0000000000000000000000000000000000000000');
  });

  it("should be able to execute setApprovedForAll and isApprovedForAll", async function () {
    const firstWallet = (await ethers.getSigners())[0];
    const isApprovedForAllBefore = await erc721Contract.isApprovedForAll(tokenAddress, erc721Contract.address, firstWallet.address);
    const tx = await erc721Contract.setApprovalForAll(tokenAddress, firstWallet.address, true, {gasLimit: 1_000_000});
    await tx.wait();
    const isApprovedForAllAfter = await erc721Contract.isApprovedForAll(tokenAddress, erc721Contract.address, firstWallet.address);

    expect(isApprovedForAllBefore).to.equal(false);
    expect(isApprovedForAllAfter).to.equal(true);
  });

  it("should be able to execute transferFrom", async function () {
    const signers = await ethers.getSigners();
    const firstWallet = signers[0];
    const secondWallet = signers[1];

    const ownerBefore = await erc721Contract.ownerOf(tokenAddress, mintedTokenSerialNumber);
    const erc721ContractNFTOwner = await ethers.getContractAt('ERC721Contract', erc721Contract.address, firstWallet);
    await erc721ContractNFTOwner.delegateTransferFrom(tokenAddress, firstWallet.address, secondWallet.address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const ownerAfter = await erc721Contract.ownerOf(tokenAddress, mintedTokenSerialNumber);

    expect(ownerBefore).to.equal(firstWallet.address);
    expect(ownerAfter).to.equal(secondWallet.address);
  });

  it("should be able to approve", async function () {
    const signers = await ethers.getSigners();
    const firstWallet = signers[0];
    const secondWallet = signers[1];

    const erc721ContractNFTOwner = await ethers.getContractAt('ERC721Contract', erc721Contract.address, secondWallet);
    const beforeApproval = await erc721ContractNFTOwner.getApproved(tokenAddress, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    await erc721ContractNFTOwner.delegateApprove(tokenAddress, firstWallet.address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const afterApproval = await erc721ContractNFTOwner.getApproved(tokenAddress, mintedTokenSerialNumber, {gasLimit: 1_000_000});

    expect(beforeApproval).to.equal('0x0000000000000000000000000000000000000000');
    expect(afterApproval).to.equal(firstWallet.address);
  });
});
