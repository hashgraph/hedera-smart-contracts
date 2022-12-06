const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');
const {expectValidHash} = require('../assertions');

describe("TokenCreateContract tests", function () {
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenManagmentContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;
  let signers;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    tokenManagmentContract = await utils.deployTokenManagementContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(tokenCreateContract, signers[0].address, utils.getSignerCompressedPublicKey());
    nftTokenAddress = await utils.createNonFungibleToken(tokenCreateContract, signers[0].address);
    mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);

    await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
    await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);
  });

  it('should be able to execute burnToken', async function () {
    const amount = 111;
    const totalSupplyBefore = await erc20Contract.totalSupply(tokenAddress);
    const balanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    await tokenManagmentContract.burnTokenPublic(tokenAddress, amount, []);
    const balanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const totalSupplyAfter = await erc20Contract.totalSupply(tokenAddress);

    expect(totalSupplyAfter).to.equal(totalSupplyBefore - amount);
    expect(balanceAfter).to.equal(balanceBefore - amount);
  });

  it('should be able to execute dissociateTokens and associateTokens', async function () {
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(signers[1]);

    const txDisassociate = await tokenManagmentContractWallet2.dissociateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });

  it('should be able to execute dissociateToken and associateToken', async function () {
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(signers[1]);

    const txDisassociate = await tokenManagmentContractWallet2.dissociateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });

  it('should be able to execute createFungibleToken', async function () {
    const tokenAddressTx = await tokenCreateContract.createFungibleTokenPublic(tokenCreateContract.address, {
      value: ethers.BigNumber.from('10000000000000000000'),
      gasLimit: 1_000_000
    });
    const tokenAddressReceipt = await tokenAddressTx.wait();
    const result = tokenAddressReceipt.events.filter(e => e.event === 'CreatedToken')[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40)
  });

  it('should be able to execute createNonFungibleToken', async function () {
    const tokenAddressTx = await tokenCreateContract.createNonFungibleTokenPublic(tokenCreateContract.address, {
      value: ethers.BigNumber.from('10000000000000000000'),
      gasLimit: 1_000_000
    });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    const result = tokenAddressReceipt.events.filter(e => e.event === 'CreatedToken')[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40)
  });

  it('should be able to execute createFungibleTokenWithCustomFees', async function () {
    const tx = await tokenCreateContract.createFungibleTokenWithCustomFeesPublic(signers[0].address, tokenAddress, {
      value: ethers.BigNumber.from('20000000000000000000'),
      gasLimit: 1_000_000
    });

    const txReceipt = await tx.wait();
    const result = txReceipt.events.filter(e => e.event === 'CreatedToken')[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40)
  });

  it('should be able to execute createNonFungibleTokenWithCustomFees', async function () {
    const tx = await tokenCreateContract.createNonFungibleTokenWithCustomFeesPublic(signers[0].address, tokenAddress, {
      value: ethers.BigNumber.from('20000000000000000000'),
      gasLimit: 1_000_000
    });

    const txReceipt = await tx.wait();
    const result = txReceipt.events.filter(e => e.event === 'CreatedToken')[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40)
  });

  it('should be able to execute mintToken', async function () {
    const nftAddress = await utils.createNonFungibleToken(tokenCreateContract, signers[0].address);
    expect(nftAddress).to.exist;
    expectValidHash(nftAddress, 40);

    const tx = await tokenCreateContract.mintTokenPublic(nftAddress, 0, ['0x02'], {
      gasLimit: 1_000_000
    });

    const receipt = await tx.wait();
    const { responseCode } = receipt.events.filter(e => e.event === 'ResponseCode')[0].args;
    expect(responseCode).to.equal(22);
    const { serialNumbers } = receipt.events.filter(e => e.event === 'MintedToken')[0].args;
    expect(serialNumbers[0].toNumber()).to.be.greaterThan(0);
  });

  it('should be able to execute grantTokenKyc', async function () {
    const grantKycTx = await tokenCreateContract.grantTokenKycPublic(tokenAddress, signers[1].address, { gasLimit: 1000000 });
    expect((await grantKycTx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });
});
