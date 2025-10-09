// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../constants');

describe('ERC721Contract Test Suite', function () {
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenAddress;
  let erc721Contract;
  let mintedTokenSerialNumber;
  let nftInitialOwnerAddress;
  let signers, firstWallet, secondWallet;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    erc721Contract = await utils.deployERC721Contract();
    tokenAddress = await utils.createNonFungibleToken(
      tokenCreateContract,
      signers[0].address
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      tokenAddress
    );
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
    firstWallet = signers[0];
    secondWallet = signers[1];

    await tokenCreateContract.associateTokenPublic(
      await erc721Contract.getAddress(),
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );

    await tokenCreateContract.grantTokenKycPublic(
      tokenAddress,
      await erc721Contract.getAddress(),
      Constants.GAS_LIMIT_1_000_000
    );

    await tokenTransferContract.transferNFTPublic(
      tokenAddress,
      await tokenCreateContract.getAddress(),
      signers[0].address,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    );
    nftInitialOwnerAddress = signers[0].address;
  });

  it('should be able to get token name', async function () {
    const name = await erc721Contract.name(tokenAddress);
    expect(name).to.equal(Constants.TOKEN_NAME);
  });

  it('should be able to get token symbol', async function () {
    const symbol = await erc721Contract.symbol(tokenAddress);
    expect(symbol).to.equal(Constants.TOKEN_SYMBOL);
  });

  it('should be able to get token totalSupply', async function () {
    const totalSupply = await erc721Contract.totalSupply(tokenAddress);
    expect(totalSupply).to.equal(1);
  });

  it('should be able to get token uri via tokenURI', async function () {
    const tokenURI = await erc721Contract.tokenURI(
      tokenAddress,
      mintedTokenSerialNumber
    );
    expect(tokenURI).to.equal('\u0001');
  });

  it('should be able to execute ownerOf', async function () {
    const owner = await erc721Contract.ownerOf(
      tokenAddress,
      mintedTokenSerialNumber
    );
    expect(owner).to.equal(nftInitialOwnerAddress);
  });

  it('should be able to execute balanceOf', async function () {
    const balance = await erc721Contract.balanceOf(
      tokenAddress,
      nftInitialOwnerAddress
    );
    expect(balance).to.equal(1);
  });

  it('should be able to execute getApproved', async function () {
    const approved = await erc721Contract.getApproved(
      tokenAddress,
      mintedTokenSerialNumber
    );
    expect(approved).to.equal('0x0000000000000000000000000000000000000000');
  });

  it('should NOT be able to execute delegateSetApprovalForAll and isApprovedForAll', async function () {
    const secondWallet = (await ethers.getSigners())[1];
    const isApprovedForAllBefore = await erc721Contract.isApprovedForAll(
      tokenAddress,
      firstWallet.address,
      secondWallet.address
    );
    await erc721Contract.delegateSetApprovalForAll(
      tokenAddress,
      secondWallet.address,
      true,
      Constants.GAS_LIMIT_1_000_000
    );
    const isApprovedForAllAfter = await erc721Contract.isApprovedForAll(
      tokenAddress,
      firstWallet.address,
      secondWallet.address
    );

    expect(isApprovedForAllBefore).to.equal(false);
    expect(isApprovedForAllAfter).to.not.equal(true);
  });

  it('should be able to execute delegate transferFrom', async function () {
    const ownerBefore = await erc721Contract.ownerOf(
      tokenAddress,
      mintedTokenSerialNumber
    );
    const erc721ContractNFTOwner = await ethers.getContractAt(
      Constants.Contract.ERC721Contract,
      await erc721Contract.getAddress(),
      firstWallet
    );
    await erc721ContractNFTOwner.delegateTransferFrom(
      tokenAddress,
      firstWallet.address,
      secondWallet.address,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    );
    const ownerAfter = await erc721Contract.ownerOf(
      tokenAddress,
      mintedTokenSerialNumber
    );

    expect(ownerBefore).to.equal(firstWallet.address);
    expect(ownerAfter).to.not.equal(secondWallet.address);
  });

  it('should be able to delegate approve', async function () {
    const erc721ContractNFTOwner = await ethers.getContractAt(
      Constants.Contract.ERC721Contract,
      await erc721Contract.getAddress(),
      secondWallet
    );
    const beforeApproval = await erc721ContractNFTOwner.getApproved(
      tokenAddress,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    );
    await erc721ContractNFTOwner.delegateApprove(
      tokenAddress,
      firstWallet.address,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    );
    const afterApproval = await erc721ContractNFTOwner.getApproved(
      tokenAddress,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    );

    expect(beforeApproval).to.equal(
      '0x0000000000000000000000000000000000000000'
    );
    expect(afterApproval).to.not.equal(firstWallet.address);
  });

  describe('Unsupported operations', async function () {
    let serialNumber;

    before(async function () {
      serialNumber = await utils.mintNFT(tokenCreateContract, tokenAddress, [
        '0x02',
      ]);
      await tokenTransferContract.transferNFTPublic(
        tokenAddress,
        await tokenCreateContract.getAddress(),
        signers[0].address,
        serialNumber,
        Constants.GAS_LIMIT_1_000_000
      );
    });

    it('should NOT be able to execute approve', async function () {
      const erc721ContractNFTOwner = await ethers.getContractAt(
        Constants.Contract.ERC721Contract,
        await erc721Contract.getAddress(),
        secondWallet
      );
      const beforeApproval = await erc721ContractNFTOwner.getApproved(
        tokenAddress,
        serialNumber,
        Constants.GAS_LIMIT_1_000_000
      );
      await utils.expectToFail(
        erc721ContractNFTOwner.approve(
          tokenAddress,
          firstWallet.address,
          serialNumber,
          Constants.GAS_LIMIT_1_000_000
        ),
        Constants.CALL_EXCEPTION
      );
      const afterApproval = await erc721ContractNFTOwner.getApproved(
        tokenAddress,
        serialNumber,
        Constants.GAS_LIMIT_1_000_000
      );

      expect(beforeApproval).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
      expect(afterApproval).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
    });

    it('should NOT be able to execute transferFrom', async function () {
      const ownerBefore = await erc721Contract.ownerOf(
        tokenAddress,
        serialNumber
      );
      const erc721ContractNFTOwner = await ethers.getContractAt(
        Constants.Contract.ERC721Contract,
        await erc721Contract.getAddress(),
        firstWallet
      );
      await utils.expectToFail(
        erc721ContractNFTOwner.transferFrom(
          tokenAddress,
          firstWallet.address,
          secondWallet.address,
          serialNumber,
          Constants.GAS_LIMIT_1_000_000
        ),
        Constants.CALL_EXCEPTION
      );
      const ownerAfter = await erc721Contract.ownerOf(
        tokenAddress,
        serialNumber
      );

      expect(ownerBefore).to.equal(firstWallet.address);
      expect(ownerAfter).to.equal(firstWallet.address);
    });

    it('should NOT be able call tokenByIndex', async function () {
      await utils.expectToFail(
        erc721Contract.tokenByIndex(tokenAddress, 0),
        Constants.CONTRACT_REVERT_EXECUTED_CODE
      );
    });

    it('should NOT be able call tokenOfOwnerByIndex', async function () {
      await utils.expectToFail(
        erc721Contract.tokenOfOwnerByIndex(
          tokenAddress,
          firstWallet.address,
          0
        ),
        Constants.CONTRACT_REVERT_EXECUTED_CODE
      );
    });

    it('should NOT be able execute safeTransferFrom', async function () {
      const tx = erc721Contract.safeTransferFrom(
        tokenAddress,
        firstWallet.address,
        secondWallet.address,
        mintedTokenSerialNumber,
        Constants.GAS_LIMIT_1_000_000
      );
      if (tx) await utils.expectToFail(tx, Constants.CALL_EXCEPTION);
    });

    it('should NOT be able execute safeTransferFromWithData', async function () {
      const tx = erc721Contract.safeTransferFromWithData(
        tokenAddress,
        firstWallet.address,
        secondWallet.address,
        mintedTokenSerialNumber,
        '0x01',
        Constants.GAS_LIMIT_1_000_000
      );
      if (tx) await utils.expectToFail(tx, Constants.CALL_EXCEPTION);
    });
  });
});
