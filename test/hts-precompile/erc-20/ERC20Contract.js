const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("ERC20Contract tests", function () {
  let tokenCreateContract;
  let tokenAddress;
  let erc20Contract;

  before(async function () {
    tokenCreateContract = await utils.deployTokenCreateContract();
    erc20Contract = await utils.deployERC20Contract();
    tokenAddress = await utils.createFungibleToken(tokenCreateContract);
  });

  it("should be able to get token name", async function () {
    const name = await erc20Contract.name(tokenAddress);
    expect(name).to.equal('tokenName');
  });

  it("should be able to get token symbol", async function () {
    const symbol = await erc20Contract.symbol(tokenAddress);
    expect(symbol).to.equal('tokenSymbol');
  });

  it("should be able to get token decimals", async function () {
    const decimals = await erc20Contract.decimals(tokenAddress);
    expect(decimals).to.equal(8);
  });

  it("should be able to get token totalSupply", async function () {
    const totalSupply = await erc20Contract.totalSupply(tokenAddress);
    expect(totalSupply).to.equal(1000);
  });
});
