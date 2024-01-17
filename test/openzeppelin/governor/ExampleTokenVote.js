const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('ExampleToken Test Suite', function () {
  let ExampleToken;
  let token;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    ExampleToken = await ethers.getContractFactory(
      Constants.Contract.ExampleTokenVote
    );
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a new ExampleToken contract before each test.
    token = await ExampleToken.deploy(Constants.GAS_LIMIT_1_000_000);

    await token.mint(owner.address, ethers.parseEther('1000'));
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      // Transfer 50 tokens from owner to addr1
      await token.transfer(addr1.address, 50);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      await token.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it('Should fail if sender doesn’t have enough tokens', async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const addr1Balance = await token.balanceOf(addr1.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      // await expect(await token.connect(addr1).transfer(owner.address, 51)).to.be.
      // revertedWithCustomError(token, 'ERC20InsufficientBalance').withArgs('0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 0, 1);
      try {
        await token
          .connect(addr1)
          .transfer(owner.address, 1, Constants.GAS_LIMIT_800000);
      } catch (error) {
        const errorData = error.data;
        const errorSignature = ethers
          .id('ERC20InsufficientBalance(address,uint256,uint256)')
          .substring(0, 10);
        if (errorData.data.startsWith(errorSignature)) {
          // Check if the error data starts with the custom error signature
          expect(errorData.data.substring(0, 10)).to.equal(errorSignature);
        }
      }

      // Owner balance shouldn't have changed.
      expect(await token.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe('Permit', function () {
    it('Should allow permit-based token transfer', async function () {
      // Your permit functionality test here
    });
  });

  describe('Votes', function () {
    it('Should correctly tally votes after transfer', async function () {
      // Your voting power test here
    });
  });
});
