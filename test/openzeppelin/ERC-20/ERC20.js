// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

async function safeCall(callback) {
  try {
    return await callback();
  }catch (error) {
    console.error(`Error in safeCall: ${error.message}`, error);
  }
}

describe('@OZERC20 Test Suite', function () {
  const transferAmount = BigInt(33);
  const firstMintAmount = BigInt(1000);
  let signers;
  let erc20Contract;
  let wallet1;
  let wallet2;
  let erc20Wallet1;
  let erc20Wallet2

  before(async function () {
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

      erc20Wallet1 = erc20Contract.connect(signers[0]);
      erc20Wallet2 = erc20Contract.connect(signers[1]);

      const mintResponse = await erc20Contract.mint(wallet1, firstMintAmount);
      console.log(`mintResponse = ${await safeCall(async () => {
        JSON.stringify(await mintResponse?.wait());
      })}`);
    } catch (error) {
      console.error(`Error in before hook: ${error.message}`, error);
      throw error; // Re-throw to fail the test suite
    }
 });

  it('should be able to execute name()', async function () {
    const tokenName = await erc20Contract.name();
    expect(tokenName).to.equal(Constants.TOKEN_NAME);
  });

  it('should be able to execute symbol()', async function () {
    const tokenSymbol = await erc20Contract.symbol();
    expect(tokenSymbol).to.equal('TOKENSYMBOL');
  });

  it('should be able to execute decimals()', async function () {
    const tokenDecimals = await erc20Contract.decimals();
    expect(tokenDecimals).to.equal(18);
  });

  it('should be able to execute totalSupply()', async function () {
    const totalSupply = BigInt(await erc20Contract.totalSupply());
    console.log(`totalSupply = *${totalSupply}*`);
    expect(totalSupply).to.equal(firstMintAmount);
  });

  it('should be able to get execute balanceOf(address)', async function () {
    const wallet1BalanceOf = BigInt(await erc20Contract.balanceOf(wallet1));
    console.log(`wallet1BalanceOf = *${wallet1BalanceOf}*`);
    expect(wallet1BalanceOf).to.equal(firstMintAmount);

    const wallet2BalanceOf = BigInt(await erc20Contract.balanceOf(wallet2));
    console.log(`wallet2BalanceOf = *${wallet2BalanceOf}*`);
    expect(wallet2BalanceOf).to.equal(BigInt(0));
  });

  it('should be able to execute transfer(address,uint256)', async function () {
    const wallet2BalanceBefore = BigInt(await erc20Contract.balanceOf(wallet2));
    console.log(`wallet2BalanceBefore = *${wallet2BalanceBefore}*`);
    const transferResponse = await erc20Wallet1.transfer(wallet2, transferAmount);
    console.log(`transferResponse = ${await safeCall(async () => {
      JSON.stringify(await transferResponse?.wait());
    })}`);
    const wallet2BalanceAfter = BigInt(await erc20Contract.balanceOf(wallet2));
    console.log(`wallet2BalanceAfter = *${wallet2BalanceAfter}*`);
    expect(wallet2BalanceBefore).to.not.eq(wallet2BalanceAfter);
    expect(wallet2BalanceAfter).to.eq(wallet2BalanceBefore + transferAmount);
  });

  it('should be able to execute transferFrom(address,address,uint256)', async function () {
    const approveResponse = await erc20Wallet1.approve(wallet2, transferAmount);
    console.log(`approveResponse = ${await safeCall(async () => {
      JSON.stringify(await approveResponse?.wait());
    })}`);

    const wallet1BalanceBefore = BigInt(await erc20Contract.balanceOf(wallet1));
    console.log(`wallet1BalanceBefore = *${wallet1BalanceBefore}*`);

    const transferFromResponse = await erc20Wallet2.transferFrom(
      wallet1,
      wallet2,
      transferAmount
    );
    console.log(`transferFromResponse = ${await safeCall(async () => {
      JSON.stringify(await transferFromResponse?.wait());
    })}`);

    const wallet1BalanceAfter = BigInt(await erc20Contract.balanceOf(wallet1));
    console.log(`wallet1BalanceAfter = *${wallet1BalanceAfter}*`);

    expect(wallet1BalanceBefore).to.not.eq(wallet1BalanceAfter);
    expect(wallet1BalanceAfter).to.eq(wallet1BalanceBefore - transferAmount);
  });

  describe('should be able to approve an amount and read a corresponding allowance', function () {
    it('should be able to execute approve(address,uint256)', async function () {
      const approveResponse = await erc20Contract.approve(await erc20Contract.getAddress(), transferAmount);
      expect(
        (await approveResponse?.wait())?.logs?.filter(
          (e) => e.fragment.name === Constants.Events.Approval
        )
      ).to.not.be.empty;
    });

    it('should be able to execute allowance(address,address)', async function () {
      const allowance = BigInt(await erc20Contract.allowance(
        wallet1,
        await erc20Contract.getAddress()
      ));
      expect(allowance).to.eq(transferAmount);
    });
  });
});
