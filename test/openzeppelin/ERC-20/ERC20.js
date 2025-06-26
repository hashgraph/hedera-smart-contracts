// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@OZERC20 Test Suite', function () {
  const amount = 33;
  let signers;
  let erc20;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(
      Constants.Contract.OZERC20Mock
    );
    erc20 = await factory.deploy(Constants.TOKEN_NAME, 'TOKENSYMBOL');
    await erc20.mint(signers[0].address, 1000);
  });

  it('should be able to execute name()', async function () {
    const res = await erc20.name();
    expect(res).to.equal(Constants.TOKEN_NAME);
  });

  it('should be able to execute symbol()', async function () {
    const res = await erc20.symbol();
    expect(res).to.equal('TOKENSYMBOL');
  });

  it('should be able to execute decimals()', async function () {
    const res = await erc20.decimals();
    expect(res).to.equal(18);
  });

  it('should be able to execute totalSupply()', async function () {
    const res = await erc20.totalSupply();
    console.log(`totalSupply = *${res}*: ${JSON.stringify(res)}`);
    expect(res).to.equal(1000);
  });

  it('should be able to get execute balanceOf(address)', async function () {
    const res1 = await erc20.balanceOf(signers[0].address);
    console.log(`balanceOf(signers[0]) = *${res1}*: ${JSON.stringify(res1)}`);
    expect(res1).to.equal(1000);

    const res2 = await erc20.balanceOf(signers[1].address);
    console.log(`balanceOf(signers[1]) = *${res2}*: ${JSON.stringify(res2)}`);
    expect(res2).to.equal(0);
  });

  it('should be able to execute transfer(address,uint256)', async function () {
    const balanceBefore = await erc20.balanceOf(signers[1].address);
    console.log(`balanceBefore = *${balanceBefore}*`);
    await erc20.transfer(signers[1].address, 33);
    const balanceAfter = await erc20.balanceOf(signers[1].address);
    console.log(`balanceAfter = *${balanceAfter}*`);
    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + amount);
  });

  it('should be able to execute transferFrom(address,address,uint256)', async function () {
    await erc20.approve(signers[1].address, amount);
    const erc20Signer2 = erc20.connect(signers[1]);

    const balanceBefore = await erc20.balanceOf(await erc20.getAddress());
    console.log(`balanceBefore = *${balanceBefore}*`);

    await erc20Signer2.transferFrom(
      signers[0].address,
      await erc20.getAddress(),
      33
    );
    const balanceAfter = await erc20.balanceOf(await erc20.getAddress());
    console.log(`balanceAfter = *${balanceAfter}*`);

    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + amount);
  });

  describe('should be able to approve an amount and read a corresponding allowance', function () {
    it('should be able to execute approve(address,uint256)', async function () {
      const res = await erc20.approve(await erc20.getAddress(), amount);
      expect(
        (await res.wait()).logs.filter(
          (e) => e.fragment.name === Constants.Events.Approval
        )
      ).to.not.be.empty;
    });

    it('should be able to execute allowance(address,address)', async function () {
      const res = await erc20.allowance(
        signers[0].address,
        await erc20.getAddress()
      );
      expect(res).to.eq(amount);
    });
  });
});
