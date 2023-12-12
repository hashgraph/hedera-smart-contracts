const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@OZTokenVault Contract', function () {
  let TokenVault;
  let tokenVault;
  let ERC20Mock;
  let asset;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    ERC20Mock = await ethers.getContractFactory(Constants.Path.ERC20Mock);
    asset = await ERC20Mock.deploy(
      'MockToken',
      'MTK',
      Constants.GAS_LIMIT_1_000_000
    );
    await asset.deployed();

    TokenVault = await ethers.getContractFactory('TokenVault');
    tokenVault = await TokenVault.deploy(
      asset.address,
      'MockToken',
      'MTK',
      Constants.GAS_LIMIT_1_000_000
    );
    await tokenVault.deployed();
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    await asset.mint(addr1.address, ethers.utils.parseUnits('1000', 18));
    await asset.mint(addr2.address, ethers.utils.parseUnits('10', 18));
  });

  describe('Deployment', function () {
    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await tokenVault.balanceOf(owner.address);
      expect(await tokenVault.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Transactions', function () {
    it('Should deposit tokens and update shareHolders mapping', async function () {
      const depositAmount = ethers.utils.parseEther('10');
      await asset.connect(addr1).approve(tokenVault.address, depositAmount);
      await expect(tokenVault.connect(addr1)._deposit(depositAmount))
        .to.emit(tokenVault, 'Deposit')
        .withArgs(addr1.address, addr1.address, depositAmount, depositAmount);

      expect(await tokenVault.shareHolders(addr1.address)).to.equal(
        depositAmount
      );
    });

    it('Should withdraw tokens and update shareHolders mapping', async function () {
      const depositAmount = ethers.utils.parseEther('10');
      const withdrawAmount = ethers.utils.parseEther('5');
      const redemedAmount = ethers.utils.parseEther('5.5');

      await asset.connect(addr2).approve(tokenVault.address, depositAmount);
      await tokenVault.connect(addr2)._deposit(depositAmount);

      await expect(
        tokenVault.connect(addr2)._withdraw(withdrawAmount, addr2.address)
      )
        .to.emit(tokenVault, 'Withdraw')
        .withArgs(
          addr2.address,
          addr2.address,
          addr2.address,
          redemedAmount,
          redemedAmount
        );

      expect(await tokenVault.totalAssetsOfUser(addr2.address)).to.equal(
        depositAmount.sub(withdrawAmount)
      );
    });

    it('Should fail if withdraw is to zero address', async function () {
      expect(
        await tokenVault
          .connect(addr1)
          ._withdraw(1, ethers.constants.AddressZero)
      ).to.be.revertedWith('Zero Address');
    });

    it('Should fail if not a shareholder', async function () {
      expect(
        await tokenVault.connect(addr2)._withdraw(1, addr2.address)
      ).to.be.revertedWith('Not a shareHolder');
    });

    it('Should fail if not enough shares', async function () {
      const depositAmount = ethers.utils.parseEther('10');
      await asset.connect(addr1).approve(tokenVault.address, depositAmount);
      await tokenVault.connect(addr1)._deposit(depositAmount);
      expect(
        await tokenVault
          .connect(addr1)
          ._withdraw(depositAmount.add(1), addr1.address)
      ).to.be.revertedWith('Not enough shares');
    });
  });

  describe('Views', function () {
    it('Should return the total assets of a user', async function () {
      const depositAmount = ethers.utils.parseEther('10');
      await asset.connect(addr1).approve(tokenVault.address, depositAmount);
      await tokenVault.connect(addr1)._deposit(depositAmount);

      expect(await tokenVault.totalAssetsOfUser(addr1.address)).to.equal(
        depositAmount
      );
    });
  });
});
