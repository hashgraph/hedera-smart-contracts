// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@OZERC20 Test Suite', function () {
  const transferAmount = BigInt(33);
  const firstMintAmount = BigInt(1000);
  let signers;
  let erc20Contract;
  let wallet1;
  let wallet2;
  const DEFAULT_TIMEOUT = 30000;

  before(async function () {
    this.timeout(DEFAULT_TIMEOUT);
    try {
      signers = await ethers.getSigners();

      wallet1 = signers[0].address;
      console.log(`wallet1 = ${wallet1}`);

      wallet2 = signers[1].address;
      console.log(`wallet2 = ${wallet2}`);

      const factory = await ethers.getContractFactory(
        Constants.Contract.OZERC20Mock
      );
      erc20Contract = await factory.deploy(Constants.TOKEN_NAME, 'TOKENSYMBOL');
      console.log(`erc20Contract = ${await erc20Contract.getAddress()}`);

      await erc20Contract.mint(wallet1, firstMintAmount);
    } catch (error) {
      console.error(`Error in before hook: ${error.message}`, error);
      throw error; // Re-throw to fail the test suite
    }
 });

  it('should be able to execute name()', async function () {
    const tokenName = await erc20Contract.name();
    expect(tokenName).to.equal(Constants.TOKEN_NAME);
  }).timeout(DEFAULT_TIMEOUT);

  it('should be able to execute symbol()', async function () {
    const tokenSymbol = await erc20Contract.symbol();
    expect(tokenSymbol).to.equal('TOKENSYMBOL');
  }).timeout(DEFAULT_TIMEOUT);

  it('should be able to execute decimals()', async function () {
    const tokenDecimals = await erc20Contract.decimals();
    expect(tokenDecimals).to.equal(18);
  }).timeout(DEFAULT_TIMEOUT);

  it('should be able to execute totalSupply()', async function () {
    const totalSupply = BigInt(await erc20Contract.totalSupply());
    console.log(`totalSupply = *${totalSupply}*`);
    expect(totalSupply).to.equal(firstMintAmount);
  }).timeout(DEFAULT_TIMEOUT);

  it('should be able to get execute balanceOf(address)', async function () {
    const wallet1BalanceOf = BigInt(await erc20Contract.balanceOf(wallet1));
    console.log(`wallet1BalanceOf = *${wallet1BalanceOf}*`);
    expect(wallet1BalanceOf).to.equal(firstMintAmount);

    const wallet2BalanceOf = BigInt(await erc20Contract.balanceOf(wallet2));
    console.log(`wallet2BalanceOf = *${wallet2BalanceOf}*`);
    expect(wallet2BalanceOf).to.equal(BigInt(0));
  }).timeout(DEFAULT_TIMEOUT);

  it('should be able to execute transfer(address,uint256)', async function () {
    const wallet2BalanceBefore = BigInt(await erc20Contract.balanceOf(wallet2));
    console.log(`wallet2BalanceBefore = *${wallet2BalanceBefore}*`);
    await erc20Contract.connect(signers[0]).transfer(wallet2, transferAmount);
    const wallet2BalanceAfter = BigInt(await erc20Contract.balanceOf(wallet2));
    console.log(`wallet2BalanceAfter = *${wallet2BalanceAfter}*`);
    expect(wallet2BalanceBefore).to.not.eq(wallet2BalanceAfter);
    expect(wallet2BalanceAfter).to.eq(wallet2BalanceBefore + transferAmount);
  }).timeout(DEFAULT_TIMEOUT);

  it('should be able to execute transferFrom(address,address,uint256)', async function () {
    await erc20Contract.connect(signers[0]).approve(wallet2, transferAmount);

    const wallet1BalanceBefore = BigInt(await erc20Contract.balanceOf(wallet1));
    console.log(`wallet1BalanceBefore = *${wallet1BalanceBefore}*`);

    await erc20Contract.connect(signers[1]).transferFrom(
      wallet1,
      wallet2,
      transferAmount
    );

    const wallet1BalanceAfter = BigInt(await erc20Contract.balanceOf(wallet1));
    console.log(`wallet1BalanceAfter = *${wallet1BalanceAfter}*`);

    expect(wallet1BalanceBefore).to.not.eq(wallet1BalanceAfter);
    expect(wallet1BalanceAfter).to.eq(wallet1BalanceBefore - transferAmount);
  }).timeout(DEFAULT_TIMEOUT);

  describe('should be able to approve an amount and read a corresponding allowance', function () {
    it('should be able to execute approve(address,uint256)', async function () {
      const approveResponse = await erc20Contract.approve(await erc20Contract.getAddress(), transferAmount);
      expect(
        (await approveResponse?.wait())?.logs?.filter(
          (e) => e.fragment.name === Constants.Events.Approval
        )
      ).to.not.be.empty;
    }).timeout(DEFAULT_TIMEOUT);

    it('should be able to execute allowance(address,address)', async function () {
      const allowance = BigInt(await erc20Contract.allowance(
        wallet1,
        await erc20Contract.getAddress()
      ));
      expect(allowance).to.eq(transferAmount);
    }).timeout(DEFAULT_TIMEOUT);
  });
});
